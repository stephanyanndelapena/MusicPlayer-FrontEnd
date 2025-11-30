import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';
import styles, { colors } from './PlaylistsScreen.styles';
import { SvgXml } from 'react-native-svg';

const BOOTSTRAP_ICONS_BASE = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons';
const SEARCH_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/search.svg`;
const svgCache = {};
function RemoteSvgIcon({ uri, color = '#fff', width = 16, height = 16, style }) {
  const [svgText, setSvgText] = useState(null);

  useEffect(() => {
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

const Artwork = React.memo(function Artwork({ artwork, imageStyle, placeholderStyle }) {
  const uri = useMemo(() => (artwork ? resolveArtworkUrl(artwork) : null), [artwork]);
  const source = useMemo(() => (uri ? { uri } : null), [uri]);

  if (!source) {
    return <View style={placeholderStyle || styles.trackThumbPlaceholder} />;
  }

  return <Image source={source} style={imageStyle || styles.trackThumb} />;
});

function TrackRow({ item, index, onPlay, onAddToPlaylist }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPlay}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.trackRow, hovered || pressed ? styles.trackRowHover : null]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title || item.name || 'track'}`}
    >
      <Artwork
        artwork={item.artwork || item.image || (item.tracks && item.tracks[0] && item.tracks[0].artwork)}
        imageStyle={styles.trackThumb}
        placeholderStyle={styles.trackThumbPlaceholder}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.title ?? item.name ?? 'Untitled'}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist ?? item.author ?? ''}
        </Text>
      </View>

      <View style={styles.recentButtons}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation && e.stopPropagation();
            onAddToPlaylist && onAddToPlaylist(item);
          }}
          style={styles.addButton}
          accessibilityLabel="Add to playlist"
        >
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

export default function AllTracksScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: 'rgba(20, 20, 20, 1)0',
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#fff',
      headerTitleStyle: { color: '#fff' },
    });
  }, [navigation]);

  const player = usePlayer ? usePlayer() : null;
  const playFn = player && typeof player.play === 'function' ? player.play : null;

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('recent');

  const [playlists, setPlaylists] = useState([]);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (api && typeof api.get === 'function') {
          const res = await api.get('tracks/');
          if (!mounted) return;
          setTracks(res?.data || []);
        } else {
          const res = await fetch('http://127.0.0.1:8000/tracks/');
          const json = await res.json();
          if (!mounted) return;
          setTracks(json || []);
        }
      } catch (err) {
        console.warn('AllTracksScreen load error', err);
        Alert.alert('Error', 'Could not load tracks. See Metro/console for details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get('playlists/');
      setPlaylists(res.data || []);
    } catch (e) {
      console.warn('fetchPlaylists', e);
      Alert.alert('Error', 'Failed to load playlists');
    }
  };

  const openAddToPlaylistModal = async (track) => {
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
  };

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
      await Promise.all([
        fetchPlaylists(),
        (async () => {
          const r = await api.get('tracks/');
          setTracks(r.data || []);
        })(),
      ]);
      Alert.alert('Added', `"${selectedTrackToAdd.title}" was added to "${playlist.name}"`);
    } catch (err) {
      console.error('attachTrackToPlaylist error', err?.response || err);
      Alert.alert('Error', 'Failed to add to playlist');
    } finally {
      setPlaylistModalVisible(false);
      setSelectedTrackToAdd(null);
    }
  };

  const queryLower = (searchQuery || '').trim().toLowerCase();
  const filteredTracks = useMemo(() => {
    const base = (tracks || []).filter((t) => {
      if (!queryLower) return true;
      const title = (t.title || '').toLowerCase();
      const artist = (t.artist || '').toLowerCase();
      return title.includes(queryLower) || artist.includes(queryLower);
    });

    const sorted = [...base];
    if (trackFilter === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (trackFilter === 'artist') {
      sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    } else {
      sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return sorted;
  }, [tracks, queryLower, trackFilter]);

  const handlePlay = useCallback(
    async (item, index) => {
      try {
        if (playFn) {
          await playFn(item, { queue: filteredTracks, index });
          navigation.navigate('NowPlaying');
        } else {
          navigation.navigate('NowPlaying', { track: item, queue: filteredTracks, index });
        }
      } catch (err) {
        console.warn('Play error', err);
        Alert.alert('Play error', 'Unable to play this song. Check console for details.');
      }
    },
    [playFn, filteredTracks, navigation]
  );

  const renderItem = ({ item, index }) => (
    <TrackRow item={item} index={index} onPlay={() => handlePlay(item, index)} onAddToPlaylist={openAddToPlaylistModal} />
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>All Tracks</Text>
          <Text style={[styles.headerSubtitle, { color: '#fff' }]}>{filteredTracks.length} songs</Text>
        </View>

        <View style={{ width: 220 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 8 }}>
            <RemoteSvgIcon uri={SEARCH_SVG_URL} color="#888" width={16} height={16} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search tracks"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, color: '#fff', paddingVertical: 8 }}
              returnKeyType="search"
              accessible={true}
              accessibilityLabel="Search tracks"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 6 }} accessibilityLabel="Clear search">
                <Text style={{ color: '#fff' }}>✖</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

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

      {filteredTracks.length === 0 ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={styles.emptyText}>{queryLower ? 'No songs match your search.' : 'No songs found.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTracks}
          keyExtractor={(t) => String(t.id ?? t._id ?? t.name ?? Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

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
              <TouchableOpacity
                onPress={() => { setPlaylistModalVisible(false); setSelectedTrackToAdd(null); }}
                style={[styles.outlinedButton, { borderColor: colors.accent }]}
              >
                <Text style={[styles.outlinedButtonText, { color: colors.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}