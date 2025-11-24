import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet, Image } from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';

/**
 * PlaylistDetailScreen — shows small artwork thumbnail per track and allows deleting the playlist immediately.
 *
 * NOTE: play counts are incremented centrally inside PlayerContext.play(), so this screen
 * no longer touches incrementPlayCount to avoid double-counting.
 */

export default function PlaylistDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { currentTrack, isPlaying, play, pause } = usePlayer();

  const fetchPlaylist = async () => {
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
  };

  useEffect(() => {
    fetchPlaylist();
    const unsubscribe = navigation.addListener('focus', fetchPlaylist);
    return () => unsubscribe && unsubscribe();
  }, [id, navigation]);

  const togglePlayFor = async (track) => {
    try {
      if (currentTrack && currentTrack.id === track.id && isPlaying) {
        await pause();
        return;
      }
      await play(track, { queue: playlist.tracks, index: playlist.tracks.findIndex(t => t.id === track.id) });
      // play counts are handled in PlayerContext.play()
    } catch (e) {
      console.warn('togglePlayFor error', e);
      Alert.alert('Play error', 'Unable to play this track');
    }
  };

  const makeFullUrl = (maybePath) => {
    if (!maybePath) return null;
    if (maybePath.startsWith('http://') || maybePath.startsWith('https://')) return maybePath;
    const base = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : '';
    const path = maybePath.startsWith('/') ? maybePath : `/${maybePath}`;
    return base ? `${base}${path}` : path;
  };

  // Proper delete handler with confirmation
  const handleDeletePlaylist = () => {
    Alert.alert('Delete playlist', 'Are you sure you want to delete this playlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/playlists/${id}/`);
            navigation.goBack();
          } catch (err) {
            console.warn('deletePlaylist error', err);
            Alert.alert('Error', 'Failed to delete playlist');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (!playlist && loading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (!playlist) return <View style={{ padding: 16 }}><Text>No playlist found</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlist.name}</Text>
      <Text style={styles.description}>{playlist.description}</Text>

      <View style={{ height: 12 }} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Edit Playlist" onPress={() => navigation.navigate('PlaylistForm', { playlist })} />
        <View style={{ width: 8 }} />
        <Button title="Add Track (Upload)" onPress={() => navigation.navigate('TrackForm', { playlistId: playlist.id })} />
        <View style={{ width: 8 }} />
        <Button title="Open Player" onPress={() => navigation.navigate('NowPlaying')} />
      </View>

      <View style={{ height: 12 }} />

      <Button
        title={deleting ? 'Deleting...' : 'Delete Playlist'}
        color="#d9534f"
        onPress={handleDeletePlaylist}
        disabled={deleting}
      />

      <FlatList
        data={playlist.tracks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.trackItem}>
            {item.artwork ? (
              <Image
                source={{ uri: makeFullUrl(item.artwork) }}
                style={styles.trackThumb}
                resizeMode="cover"
              />
            ) : (
              // transparent / minimal placeholder (removes dark "box" look)
              <View style={styles.trackThumbPlaceholder} />
            )}

            <View style={styles.trackText}>
              <Text style={styles.trackTitle}>{item.title}</Text>
              <Text style={styles.trackArtist}>{item.artist}</Text>
            </View>

            <View style={styles.controls}>
              <Button
                title={currentTrack?.id === item.id && isPlaying ? 'Pause' : 'Play'}
                onPress={() => togglePlayFor(item)}
              />

              <View style={{ height: 8 }} />
              <Button title="Edit" onPress={() => navigation.navigate('TrackForm', { track: item, playlistId: playlist.id })} />
              <View style={{ height: 8 }} />
              <Button title="Delete Track" color="red" onPress={async () => {
                try {
                  await api.delete(`/tracks/${item.id}/`);
                  await fetchPlaylist();
                } catch (err) {
                  console.warn('deleteTrack error', err);
                  Alert.alert('Error', 'Failed to delete track');
                }
              }} />
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={{ marginTop: 12 }}>No tracks in this playlist</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, marginBottom: 4 },
  description: { marginBottom: 12, color: '#666' },
  trackItem: { padding: 12, flexDirection: 'row', alignItems: 'center' },
  // when artwork exists we render the Image with resizeMode cover,
  // otherwise render a subtle empty placeholder (transparent background + light border)
  trackThumb: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  trackThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#eee',
  },
  trackText: { flex: 1 },
  trackTitle: { fontSize: 18 },
  trackArtist: { color: '#666', marginTop: 4 },
  controls: { width: 140, justifyContent: 'flex-start' },
  separator: { height: 1, backgroundColor: '#ddd', marginTop: 12, marginBottom: 12 },
});