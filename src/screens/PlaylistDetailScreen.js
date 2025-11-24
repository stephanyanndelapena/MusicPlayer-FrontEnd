import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';

/**
 * PlaylistDetailScreen — shows current playback time for the playing track
 * by reading positionMillis/durationMillis from PlayerContext.
 */

export default function PlaylistDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);

  // Player context (global single player)
  const { currentTrack, isPlaying, play, pause, positionMillis, durationMillis } = usePlayer();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigation]);

  if (!playlist && loading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (!playlist) return <View style={{ padding: 16 }}><Text>No playlist found</Text></View>;

  const format = (ms) => {
    if (!ms && ms !== 0) return '0:00';
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  };

  const togglePlayFor = async (track) => {
    try {
      if (currentTrack && currentTrack.id === track.id && isPlaying) {
        await pause();
        return;
      }
      await play(track);
    } catch (e) {
      console.warn('togglePlayFor error', e);
      Alert.alert('Play error', 'Unable to play this track');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlist.name}</Text>
      <Text style={styles.description}>{playlist.description}</Text>

      <View style={{ height: 8 }} />

      <Button title="Edit Playlist" onPress={() => navigation.navigate('PlaylistForm', { playlist })} />
      <View style={{ height: 8 }} />
      <Button title="Add Track (Upload)" onPress={() => navigation.navigate('TrackForm', { playlistId: playlist.id })} />
      <View style={{ height: 8 }} />
      <Button title="Open Player" onPress={() => navigation.navigate('NowPlaying')} />

      <FlatList
        data={playlist.tracks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isCurrent = currentTrack && currentTrack.id === item.id;
          return (
            <View style={styles.trackItem}>
              <View style={styles.trackText}>
                <Text style={styles.trackTitle}>{item.title}</Text>
                <Text style={styles.trackArtist}>{item.artist}</Text>
                {/* display time only for current track */}
                {isCurrent ? (
                  <Text style={styles.trackTime}>{format(positionMillis)} / {format(durationMillis)}</Text>
                ) : null}
              </View>

              <View style={styles.controls}>
                <Button
                  title={isCurrent && isPlaying ? 'Pause' : 'Play'}
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
  title: { fontSize: 22, marginBottom: 4 },
  description: { marginBottom: 12, color: '#666' },
  trackItem: { padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
  trackText: { flex: 1, marginRight: 12 },
  trackTitle: { fontSize: 18 },
  trackArtist: { color: '#666' },
  trackTime: { color: '#444', marginTop: 6 },
  controls: { width: 140, justifyContent: 'flex-start' },
  separator: { height: 1, backgroundColor: '#ddd', marginTop: 12, marginBottom: 12 },
});