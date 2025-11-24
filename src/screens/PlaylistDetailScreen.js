import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, Image, Pressable, Platform } from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';

export default function PlaylistDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [removingTrackId, setRemovingTrackId] = useState(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);

  const { currentTrack, isPlaying, play, pause } = usePlayer();

  /** Fetch playlist */
  const fetchPlaylist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/playlists/${id}/`);
      setPlaylist(res.data);
    } catch (err) {
      console.warn('fetchPlaylist error', err?.response || err.message || err);
      Alert.alert('Error', 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
    const unsubscribe = navigation.addListener('focus', fetchPlaylist);
    return () => unsubscribe && unsubscribe();
  }, [fetchPlaylist, navigation]);

  /** Play/Pause */
  const togglePlayFor = async (track) => {
    try {
      if (currentTrack && currentTrack.id === track.id && isPlaying) {
        await pause();
        return;
      }
      await play(track, {
        queue: playlist.tracks,
        index: playlist.tracks.findIndex(t => t.id === track.id)
      });
    } catch (e) {
      console.warn('togglePlayFor error', e);
      Alert.alert('Play error', 'Unable to play this track');
    }
  };

  /** Remove from playlist only */
  const handleRemoveFromPlaylist = useCallback(async (track) => {
    if (!playlist) return;
    if (removingTrackId) return;

    const previousTracks = playlist.tracks;
    const remainingTracks = previousTracks.filter(t => t.id !== track.id);
    const remainingIds = remainingTracks.map(t => t.id);

    // Optimistic UI update
    setPlaylist(prev => ({ ...prev, tracks: remainingTracks }));
    setRemovingTrackId(track.id);

    try {
      await api.patch(`/playlists/${playlist.id}/`, { track_ids: remainingIds });
      fetchPlaylist().catch(err => console.warn('refresh failed', err));
    } catch (err) {
      console.error('remove track failed', err);
      setPlaylist(prev => ({ ...prev, tracks: previousTracks }));
      Alert.alert('Error', 'Failed to remove track. Please try again.');
    } finally {
      setRemovingTrackId(null);
    }
  }, [playlist, removingTrackId, fetchPlaylist]);

  /** Delete playlist */
  const handleDeletePlaylist = useCallback(async () => {
    let confirmed = true;

    if (Platform.OS === 'web') {
      confirmed = window.confirm('Delete this playlist?');
    } else {
      Alert.alert(
        "Delete playlist",
        "Are you sure you want to delete this playlist?",
        [
          { text: "Cancel", style: "cancel", onPress: () => confirmed = false },
          { text: "Delete", style: "destructive", onPress: () => confirmed = true }
        ]
      );
    }

    if (!confirmed) return;

    if (deletingPlaylist) return;
    setDeletingPlaylist(true);

    try {
      await api.delete(`/playlists/${id}/`);
      navigation.goBack();
    } catch (err) {
      console.warn("deletePlaylist error", err);
      if (Platform.OS === "web") alert("Failed to delete playlist.");
      else Alert.alert("Error", "Failed to delete playlist.");
    } finally {
      setDeletingPlaylist(false);
    }
  }, [id, deletingPlaylist, navigation]);

  if (!playlist && loading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (!playlist) return <View style={{ padding: 16 }}><Text>No playlist found</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlist.name}</Text>
      <Text style={styles.description}>{playlist.description}</Text>

      <View style={{ height: 12 }} />

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Pressable style={styles.headerAction} onPress={() => navigation.navigate('PlaylistForm', { playlist })}>
          <Text style={styles.headerActionText}>Edit Playlist</Text>
        </Pressable>

        <Pressable style={styles.headerAction} onPress={() => navigation.navigate('TrackForm', { playlistId: playlist.id })}>
          <Text style={styles.headerActionText}>Add Track (Upload)</Text>
        </Pressable>

        <Pressable style={styles.headerAction} onPress={() => navigation.navigate('NowPlaying')}>
          <Text style={styles.headerActionText}>Open Player</Text>
        </Pressable>

        <Pressable
          onPress={handleDeletePlaylist}
          style={[styles.deleteButton, deletingPlaylist && { opacity: 0.6 }]}
          disabled={deletingPlaylist}
        >
          <Text style={styles.deleteButtonText}>{deletingPlaylist ? 'Deleting...' : 'Delete Playlist'}</Text>
        </Pressable>
      </View>

      <View style={{ height: 12 }} />

      <FlatList
        data={playlist.tracks}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => {
          const artUri = item.artwork && (
            item.artwork.startsWith('http')
              ? item.artwork
              : typeof window !== 'undefined'
                ? `${window.location.origin}${item.artwork}`
                : item.artwork
          );

          const isCurrent = currentTrack && currentTrack.id === item.id;
          const removing = removingTrackId === item.id;

          return (
            <View style={styles.trackItem}>
              {artUri ? (
                <Image source={{ uri: artUri }} style={styles.trackThumb} />
              ) : (
                <View style={styles.trackThumbPlaceholder} />
              )}

              <View style={styles.trackText}>
                <Text style={styles.trackTitle}>{item.title}</Text>
                <Text style={styles.trackArtist}>{item.artist}</Text>
              </View>

              <View style={styles.controls}>
                <Pressable onPress={() => togglePlayFor(item)} style={styles.smallIcon}>
                  <Text>{isCurrent && isPlaying ? '⏸' : '▶️'}</Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('TrackForm', { track: item, playlistId: playlist.id })}
                  style={styles.smallIcon}
                >
                  <Text>✏️</Text>
                </Pressable>

                {/* REMOVE FROM PLAYLIST ONLY */}
                <Pressable
                  onPress={() => handleRemoveFromPlaylist(item)}
                  style={[styles.removeButton, removing && { opacity: 0.5 }]}
                >
                  <Text style={styles.removeText}>{removing ? 'Removing...' : '-'}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={{ marginTop: 12 }}>No tracks in this playlist</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 4 },
  description: { marginBottom: 12, color: '#666' },

  headerAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8
  },
  headerActionText: { color: '#333' },

  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fbd6d8',
    borderRadius: 6,
  },
  deleteButtonText: { color: '#b71c1c', fontWeight: '700' },

  trackItem: { padding: 12, flexDirection: 'row', alignItems: 'center' },
  trackThumb: { width: 56, height: 56, borderRadius: 4, marginRight: 12 },
  trackThumbPlaceholder: { width: 56, height: 56, borderRadius: 4, marginRight: 12, backgroundColor: '#ccc' },

  trackText: { flex: 1 },
  trackTitle: { fontSize: 18 },
  trackArtist: { fontSize: 14, color: '#666', marginTop: 2 },

  controls: { flexDirection: 'row', alignItems: 'center' },

  smallIcon: { padding: 8, marginLeft: 6 },

  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f7d8b6',
    marginLeft: 8
  },
  removeText: { color: '#8a3e00', fontWeight: '700' },

  separator: { height: 1, backgroundColor: '#ddd', marginVertical: 12 }
});
