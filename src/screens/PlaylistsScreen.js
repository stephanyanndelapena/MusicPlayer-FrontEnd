import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Button,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';
import styles, { colors } from './PlaylistsScreen.styles';

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

const TrackItem = React.memo(function TrackItem({ item, onAddToPlaylist, queue, index }) {
  const { currentTrack, isPlaying, play } = usePlayer();
  const isCurrent = currentTrack && currentTrack.id === item.id && isPlaying;

  const handlePlay = useCallback(async () => {
    try {
      await play(item, { queue, index });
    } catch (err) {
      console.warn('play error', err);
      Alert.alert('Play error', 'Unable to play this song');
    }
  }, [item, play, queue, index]);

  return (
    <TouchableOpacity
      style={[styles.trackRow, isCurrent ? styles.trackRowActive : null]}
      onPress={handlePlay}
      activeOpacity={0.7}
      accessibilityLabel={`Play ${item.title} by ${item.artist}`}
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
    </TouchableOpacity>
  );
}, (prev, next) => {
  const a = prev.item;
  const b = next.item;
  return a.id === b.id && a.artwork === b.artwork && a.title === b.title && a.artist === b.artist;
});

export default function PlaylistsScreen({ navigation }) {
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
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

  const renderPlaylistItem = ({ item }) => {
    const firstTrackArtwork = item.tracks && item.tracks.length > 0 ? item.tracks[0].artwork : null;
    const raw = item.image || firstTrackArtwork || null;
    const artUrl = resolveArtworkUrl(raw);
    const thumbSource = artUrl ? { uri: artUrl } : null;

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
          onPress={() => navigation.navigate('PlaylistDetail', { id: item.id })}
          activeOpacity={0.8}
        >
          {thumbSource ? <Image source={thumbSource} style={styles.thumb} /> : <View style={styles.thumbPlaceholder} />}

          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.count}>{(item.tracks || []).length} tracks</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
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
    ({ item, index }) => <TrackItem item={item} onAddToPlaylist={openAddToPlaylistModal} queue={tracks} index={index} />,
    [openAddToPlaylistModal, tracks]
  );

  const TracksFooter = () => (
    <View style={{ paddingVertical: 12 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent tracks</Text>
      </View>

      {tracks.length === 0 ? (
        <Text style={styles.emptyText}>No songs yet. Use "Add Song" (header) to upload music.</Text>
      ) : (
        <FlatList data={tracks} keyExtractor={(t) => String(t.id)} renderItem={renderTrackItem} ItemSeparatorComponent={() => <View style={styles.separator} />} />
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
            <Button title="Create" onPress={() => navigation.navigate('PlaylistForm')} color={colors.accent} />
          </View>

          <View style={styles.smallButton}>
            <Button title="Add Song" onPress={() => navigation.navigate('TrackForm')} color={colors.accent} />
          </View>

          <View style={styles.smallButton}>
            <Button title="Most Played" onPress={() => navigation.navigate('MostPlayed')} color={colors.accent} />
          </View>
        </View>
      </View>

      <FlatList
        data={playlists}
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
              <Button title="Cancel" onPress={() => { setPlaylistModalVisible(false); setSelectedTrackToAdd(null); }} color={colors.accent} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}