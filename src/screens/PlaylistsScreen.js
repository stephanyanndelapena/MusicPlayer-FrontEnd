import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';
import styles, { colors } from './PlaylistsScreen.styles';
import { SvgXml } from 'react-native-svg'; // added for bootstrap SVG icon rendering

/* simple in-memory cache + helper to fetch and recolor remote SVGs */
const svgCache = {};
function RemoteSvgIcon({ uri, color = '#fff', width = 16, height = 16, style }) {
  const [svgText, setSvgText] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    if (svgCache[uri]) {
      setSvgText(svgCache[uri]);
      return;
    }
    fetch(uri)
      .then((res) => res.text())
      .then((text) => {
        if (!mounted) return;
        svgCache[uri] = text;
        setSvgText(text);
      })
      .catch((err) => {
        console.warn('Failed to load SVG', uri, err);
      });
    return () => {
      mounted = false;
    };
  }, [uri]);

  if (!svgText) return <View style={[{ width, height }, style]} />;

  const colored = svgText
    .replace(/fill="[^"]*"/gi, `fill="${color}"`)
    .replace(/stroke="[^"]*"/gi, `stroke="${color}"`)
    .replace(/fill='[^']*'/gi, `fill="${color}"`)
    .replace(/stroke='[^']*'/gi, `stroke="${color}"`);

  return <SvgXml xml={colored} width={width} height={height} style={style} />;
}

const BOOTSTRAP_ICONS_BASE = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons';
const SEARCH_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/search.svg`;
/* resolveArtworkUrl unchanged */
function resolveArtworkUrl(artwork) {
  if (!artwork) return null;
  if (artwork.startsWith('http://') || artwork.startsWith('https://')) return artwork;
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const path = artwork.startsWith('/') ? artwork : `/${artwork}`;
    return `${window.location.origin}${path}`;
  }
  const path = artwork.startsWith('/') ? artwork : `/${artwork}`;
  return `http://127.0.0.1:8000${path}`;
}

/* Memoized Artwork component */
const Artwork = React.memo(function Artwork({ artwork, imageStyle, placeholderStyle }) {
  const uri = useMemo(() => (artwork ? resolveArtworkUrl(artwork) : null), [artwork]);
  const source = useMemo(() => (uri ? { uri } : null), [uri]);

  if (!source) {
    return <View style={placeholderStyle || styles.trackThumbPlaceholder} />;
  }

  return <Image source={source} style={imageStyle || styles.trackThumb} />;
});

/* Playlist row component with hover highlight */
function PlaylistRow({ item, onPress }) {
  const [hovered, setHovered] = useState(false);

  const firstTrackArtwork = item.tracks && item.tracks.length > 0 ? item.tracks[0].artwork : null;
  const raw = item.image || firstTrackArtwork || null;
  const artUrl = resolveArtworkUrl(raw);
  const thumbSource = artUrl ? { uri: artUrl } : null;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          { flexDirection: 'row', flex: 1, alignItems: 'center' },
          hovered || pressed ? styles.rowHover : null,
        ]}
        accessibilityRole="button"
      >
        {thumbSource ? <Image source={thumbSource} style={styles.thumb} /> : <View style={styles.thumbPlaceholder} />}

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.count}>{(item.tracks || []).length} tracks</Text>
        </View>
      </Pressable>
    </View>
  );
}

const TrackItem = React.memo(function TrackItem({ item, onAddToPlaylist, queue, index }) {
  const { currentTrack, isPlaying, play } = usePlayer();
  const isCurrent = currentTrack && currentTrack.id === item.id && isPlaying;
  const [hovered, setHovered] = useState(false);

  const handlePlay = useCallback(async () => {
    try {
      await play(item, { queue, index });
    } catch (err) {
      console.warn('play error', err);
      Alert.alert('Play error', 'Unable to play this song');
    }
  }, [item, play, queue, index]);

  return (
    <Pressable
      onPress={handlePlay}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.trackRow,
        isCurrent ? styles.trackRowActive : null,
        (hovered || pressed) ? styles.trackRowHover : null,
      ]}
      accessibilityLabel={`Play ${item.title} by ${item.artist}`}
      accessibilityRole="button"
    >
      <Artwork artwork={item.artwork} imageStyle={styles.trackThumb} placeholderStyle={styles.trackThumbPlaceholder} />

      <View style={{ flex: 1 }}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>

      <View style={styles.recentButtons}>
        <TouchableOpacity
          onPress={() => onAddToPlaylist(item)}
          style={styles.addButton}
          accessibilityLabel="Add to playlist"
        >
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}, (prev, next) => {
  const a = prev.item;
  const b = next.item;
  return a.id === b.id && a.artwork === b.artwork && a.title === b.title && a.artist === b.artist;
});

/* OutlinedButton - shows as green border (transparent) and fills with green on hover/press */
function OutlinedButton({ title, onPress, style, textStyle, color = colors.accent, accessibilityLabel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => {
        const filled = pressed || hovered;
        return [
          styles.outlinedButton,
          { borderColor: color },
          filled ? { backgroundColor: color } : { backgroundColor: 'transparent' },
          style,
        ];
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {({ pressed }) => {
        const filled = pressed || hovered;
        return (
          <Text style={[styles.outlinedButtonText, textStyle, filled ? styles.outlinedButtonTextFilled : null]}>
            {title}
          </Text>
        );
      }}
    </Pressable>
  );
}

export default function PlaylistsScreen({ navigation }) {
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('recent'); // 'recent' | 'title' | 'artist'
  const [loading, setLoading] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState(null);

  // Set header to match body and remove bottom border / shadow
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background || '#121212',
        borderBottomWidth: 0,
        elevation: 0, // Android
        shadowOpacity: 0, // iOS
      },
      headerTintColor: colors.textPrimary || '#fff',
      headerTitleStyle: { color: colors.textPrimary || '#fff' },
    });
  }, [navigation]);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get('playlists/');
      setPlaylists(res.data || []);
    } catch (e) {
      console.warn('fetchPlaylists', e);
      Alert.alert('Error', 'Failed to load playlists');
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await api.get('tracks/');
      setTracks(res.data || []);
    } catch (e) {
      console.warn('fetchTracks', e);
    }
  };

  useEffect(() => {
    const onFocus = () => {
      setLoading(true);
      Promise.all([fetchPlaylists(), fetchTracks()]).finally(() => setLoading(false));
    };

    onFocus();
    const unsub = navigation.addListener('focus', onFocus);
    return () => unsub && unsub();
  }, [navigation]);

  // Memoized filtered lists based on the search query
  const queryLower = (searchQuery || '').trim().toLowerCase();
  const filteredPlaylists = useMemo(() => {
    if (!queryLower) return playlists;
    return (playlists || []).filter((p) => (p.name || '').toLowerCase().includes(queryLower));
  }, [playlists, queryLower]);

  const filteredTracks = useMemo(() => {
    const base = (tracks || []).filter((t) => {
      if (!queryLower) return true;
      const title = (t.title || '').toLowerCase();
      const artist = (t.artist || '').toLowerCase();
      return title.includes(queryLower) || artist.includes(queryLower);
    });

    // Apply sorting based on selected filter
    const sorted = [...base];
    if (trackFilter === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (trackFilter === 'artist') {
      sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    } else {
      // 'recent' fallback: assume higher id is newer when no created_at available
      sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return sorted;
  }, [tracks, queryLower, trackFilter]);

  const renderPlaylistItem = ({ item }) => {
    return <PlaylistRow item={item} onPress={() => navigation.navigate('PlaylistDetail', { id: item.id })} />;
  };

  const openAddToPlaylistModal = useCallback(
    async (track) => {
      setSelectedTrackToAdd(track);
      if (playlists.length === 0) {
        setPlaylistsLoading(true);
        try {
          await fetchPlaylists();
        } finally {
          setPlaylistsLoading(false);
        }
      }
      setPlaylistModalVisible(true);
    },
    [playlists.length]
  );

  const attachTrackToPlaylist = async (playlist) => {
    if (!selectedTrackToAdd) return;
    try {
      const existing = (playlist.tracks || []).map((t) => t.id);
      if (existing.includes(selectedTrackToAdd.id)) {
        Alert.alert('Already added', `"${selectedTrackToAdd.title}" is already in "${playlist.name}"`);
        setPlaylistModalVisible(false);
        setSelectedTrackToAdd(null);
        return;
      }
      existing.push(selectedTrackToAdd.id);
      await api.patch(`/playlists/${playlist.id}/`, { track_ids: existing });
      await Promise.all([fetchPlaylists(), fetchTracks()]);
      Alert.alert('Added', `"${selectedTrackToAdd.title}" was added to "${playlist.name}"`);
    } catch (err) {
      console.error('attachTrackToPlaylist error', err?.response || err);
      Alert.alert('Error', 'Failed to add to playlist');
    } finally {
      setPlaylistModalVisible(false);
      setSelectedTrackToAdd(null);
    }
  };

  const renderTrackItem = useCallback(
    ({ item, index }) => <TrackItem item={item} onAddToPlaylist={openAddToPlaylistModal} queue={filteredTracks} index={index} />,
    [openAddToPlaylistModal, filteredTracks]
  );

  const TracksFooter = () => (
    <View style={{ paddingVertical: 12 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent tracks</Text>
      </View>

      {filteredTracks.length === 0 ? (
        <Text style={styles.emptyText}>
          {queryLower ? 'No songs match your search.' : 'No songs yet. Use "Add Song" (header) to upload music.'}
        </Text>
      ) : (
        <FlatList data={filteredTracks} keyExtractor={(t) => String(t.id)} renderItem={renderTrackItem} ItemSeparatorComponent={() => <View style={styles.separator} />} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Your Library</Text>
          <Text style={styles.headerSubtitle}>Playlists</Text>
        </View>

        <View style={styles.headerButtons}>
          <View style={styles.smallButton}>
            <OutlinedButton title="Create" onPress={() => navigation.navigate('PlaylistForm')} color={colors.accent} />
          </View>

          <View style={styles.smallButton}>
            <OutlinedButton title="Add Song" onPress={() => navigation.navigate('TrackForm')} color={colors.accent} />
          </View>

          {/* ADDED: All Tracks button placed between Add Song and Most Played */}
          <View style={styles.smallButton}>
            <OutlinedButton title="All Tracks" onPress={() => navigation.navigate('AllTracks')} color={colors.accent} />
          </View>

          <View style={styles.smallButton}>
            <OutlinedButton title="Most Played" onPress={() => navigation.navigate('MostPlayed')} color={colors.accent} />
          </View>
        </View>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 8 }}>
          {/* replaced Unicode search emoji with Bootstrap SVG icon */}
          <RemoteSvgIcon uri={SEARCH_SVG_URL} color="#888" width={16} height={16} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search playlists or tracks"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, color: '#fff', paddingVertical: 8 }}
            returnKeyType="search"
            accessible={true}
            accessibilityLabel="Search"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 6 }} accessibilityLabel="Clear search">
              <Text style={{ color: '#fff' }}>✖</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter controls: Recently added / Title A–Z / Artist A–Z */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        {[
          { key: 'recent', label: 'Recently added' },
          { key: 'title', label: 'Title A–Z' },
          { key: 'artist', label: 'Artist A–Z' },
        ].map((opt) => {
          const selected = trackFilter === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setTrackFilter(opt.key)}
              style={({ pressed }) => [
                {
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  marginRight: 8,
                  backgroundColor: selected ? colors.accent : pressed ? '#333' : 'transparent',
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={{ color: selected ? '#000' : '#ccc', fontSize: 13 }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredPlaylists}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderPlaylistItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<TracksFooter />}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          Promise.all([fetchPlaylists(), fetchTracks()]).finally(() => setLoading(false));
        }}
      />

      <Modal visible={playlistModalVisible} animationType="slide" transparent={true} onRequestClose={() => { setPlaylistModalVisible(false); setSelectedTrackToAdd(null); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add "{selectedTrackToAdd?.title}" to playlist</Text>

            {playlistsLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.playlistOption} onPress={() => attachTrackToPlaylist(item)} activeOpacity={0.7}>
                    <Text style={styles.playlistOptionText}>
                      {item.name} <Text style={styles.playlistOptionCount}>({(item.tracks || []).length})</Text>
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}

            <View style={{ marginTop: 12 }}>
              <OutlinedButton title="Cancel" onPress={() => { setPlaylistModalVisible(false); setSelectedTrackToAdd(null); }} color={colors.accent} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}