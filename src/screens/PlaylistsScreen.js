import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Button,
  Alert,
  Modal,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';

/**
 * PlaylistsScreen — fixes blinking artwork while music is playing.
 *
 * Key fixes:
 * 1) Do NOT subscribe to PlayerContext at the top-level screen (removed usePlayer() call here).
 *    Subscribing here caused the whole screen to re-render on player progress updates.
 * 2) Artwork is isolated into a memoized component that:
 *    - resolves the artwork URL with useMemo
 *    - memoizes the Image source object ({ uri }) so its identity does not change between renders
 *    - returns a placeholder view when no artwork exists
 * 3) TrackItem is memoized and renders Artwork as a child. TrackItem consumes PlayerContext
 *    so it can update Play/Pause state, but because Artwork's props don't change, the Image won't reload.
 *
 * With these changes the artwork image will not be recreated or given a new source object when the
 * player updates position; that removes the blinking you saw while music is playing.
 */

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
  // compute uri only when artwork string changes
  const uri = useMemo(() => (artwork ? resolveArtworkUrl(artwork) : null), [artwork]);

  // memoize the source object so Image receives the same object identity across renders
  const source = useMemo(() => (uri ? { uri } : null), [uri]);

  if (!source) {
    return <View style={placeholderStyle || styles.trackThumbPlaceholder} />;
  }

  return <Image source={source} style={imageStyle || styles.trackThumb} />;
});

/* TrackItem consumes player context (so its play/pause state updates) but Artwork is insulated */
const TrackItem = React.memo(function TrackItem({ item, onAddToPlaylist, queue, index }) {
  const { currentTrack, isPlaying, play, pause } = usePlayer();

  const isCurrent = currentTrack && currentTrack.id === item.id && isPlaying;

  const handlePlay = useCallback(async () => {
    try {
      if (isCurrent) {
        await pause();
        return;
      }
      await play(item, { queue, index });
    } catch (err) {
      console.warn('play error', err);
      Alert.alert('Play error', 'Unable to play this song');
    }
  }, [isCurrent, item, play, pause, queue, index]);

  return (
    <View style={styles.trackRow}>
      <Artwork artwork={item.artwork} imageStyle={styles.trackThumb} placeholderStyle={styles.trackThumbPlaceholder} />

      <View style={{ flex: 1 }}>
        <Text style={styles.trackTitle}>{item.title}</Text>
        <Text style={styles.trackArtist}>{item.artist}</Text>
      </View>

      <View style={styles.recentButtons}>
        <View style={{ marginRight: 8 }}>
          <Button title={isCurrent ? 'Pause' : 'Play'} onPress={handlePlay} />
        </View>

        <View>
          <Button title="+" onPress={() => onAddToPlaylist(item)} />
        </View>
      </View>
    </View>
  );
}, (prev, next) => {
  const a = prev.item;
  const b = next.item;
  // Only re-render when relevant item fields change
  return a.id === b.id && a.artwork === b.artwork && a.title === b.title && a.artist === b.artist;
});

export default function PlaylistsScreen({ navigation }) {
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal and selected track state for "Add to playlist"
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState(null);

  // IMPORTANT: do not call usePlayer() here — keeping the screen subscribed to player context
  // causes the entire screen to re-render on playback progress updates which can trigger image reloads.
  // TrackItem uses usePlayer() itself.

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
      // non-fatal
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
        >
          {thumbSource ? (
            <Image source={thumbSource} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.count}>{(item.tracks || []).length} tracks</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.rowButtons}>
          <View style={styles.smallButton}>
            <Button title="Open" onPress={() => navigation.navigate('PlaylistDetail', { id: item.id })} />
          </View>
        </View>
      </View>
    );
  };

  // open modal to choose playlist for this track
  const openAddToPlaylistModal = useCallback(async (track) => {
    setSelectedTrackToAdd(track);
    // ensure playlists are loaded for the modal
    if (playlists.length === 0) {
      setPlaylistsLoading(true);
      try {
        await fetchPlaylists();
      } catch (e) {
        // handled in fetchPlaylists
      } finally {
        setPlaylistsLoading(false);
      }
    }
    setPlaylistModalVisible(true);
  }, [playlists.length]);

  // attach track to playlist (append to track_ids)
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
        <Text style={{ color: '#666', paddingHorizontal: 12, paddingTop: 6 }}>
          No songs yet. Use "Add Song" (header) to upload music.
        </Text>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderTrackItem}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Playlists</Text>

        <View style={styles.headerButtons}>
          <View style={styles.smallButton}>
            <Button title="Create Playlist" onPress={() => navigation.navigate('PlaylistForm')} />
          </View>

          <View style={styles.smallButton}>
            <Button title="Add Song" onPress={() => navigation.navigate('TrackForm')} />
          </View>

          <View style={styles.smallButton}>
            <Button title="Most Played" onPress={() => navigation.navigate('MostPlayed')} />
          </View>
        </View>
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderPlaylistItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
        ListFooterComponent={<TracksFooter />}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          Promise.all([fetchPlaylists(), fetchTracks()]).finally(() => setLoading(false));
        }}
      />

      {/* Add to Playlist Modal */}
      <Modal
        visible={playlistModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setPlaylistModalVisible(false);
          setSelectedTrackToAdd(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add "{selectedTrackToAdd?.title}" to playlist</Text>

            {playlistsLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.playlistOption}
                    onPress={() => attachTrackToPlaylist(item)}
                  >
                    <Text style={styles.playlistOptionText}>{item.name} ({(item.tracks || []).length})</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
              />
            )}

            <View style={{ marginTop: 12 }}>
              <Button title="Cancel" onPress={() => { setPlaylistModalVisible(false); setSelectedTrackToAdd(null); }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  headerTitle: { fontSize: 20, fontWeight: '600' },

  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  smallButton: { marginLeft: 8 },

  row: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 4, marginRight: 12, backgroundColor: '#333' },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#333',
  },
  title: { fontSize: 16 },
  count: { color: '#666', marginTop: 4 },

  rowButtons: { flexDirection: 'row', alignItems: 'center' },

  // track styles
  trackRow: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  trackThumb: { width: 48, height: 48, borderRadius: 4, marginRight: 12, backgroundColor: '#333' },
  trackThumbPlaceholder: { width: 48, height: 48, borderRadius: 4, marginRight: 12, backgroundColor: '#333' },
  trackTitle: { fontSize: 15 },
  trackArtist: { color: '#666', marginTop: 4 },

  recentButtons: { flexDirection: 'row', alignItems: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },

  // modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 16, maxHeight: '60%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  playlistOption: { paddingVertical: 12, paddingHorizontal: 8 },
  playlistOptionText: { fontSize: 15 },
});