import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Button, Platform, Alert, StyleSheet } from 'react-native';
import api from '../api';
import { Audio } from 'expo-av';

/**
 * PlaylistDetailScreen — ensures only one track plays at a time.
 * - Native: uses expo-av and unloads the previous Sound before playing a new one.
 * - Web: stores refs to HTMLAudioElements and pauses any other audio when one plays.
 */

export default function PlaylistDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);

  // Native playback
  const [currentSound, setCurrentSound] = useState(null); // expo-av Sound instance
  const [playingTrackId, setPlayingTrackId] = useState(null);

  // Web playback refs: map of trackId -> HTMLAudioElement
  const audioRefs = useRef({});

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
    return () => {
      // cleanup native sound
      if (currentSound) {
        currentSound.unloadAsync().catch(() => {});
      }
      // pause any web audios
      if (Platform.OS === 'web') {
        Object.values(audioRefs.current).forEach((a) => {
          try { a && a.pause(); } catch (e) {}
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native: play or toggle a track
  const playNative = async (track) => {
    try {
      // If same track is playing, pause/unload it (toggle)
      if (playingTrackId === track.id && currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingTrackId(null);
        return;
      }

      // Unload previous sound if any
      if (currentSound) {
        try {
          await currentSound.stopAsync();
        } catch (e) {}
        try {
          await currentSound.unloadAsync();
        } catch (e) {}
        setCurrentSound(null);
        setPlayingTrackId(null);
      }

      // Create and play new sound
      const { sound } = await Audio.Sound.createAsync({ uri: track.audio_file });
      setCurrentSound(sound);
      setPlayingTrackId(track.id);
      await sound.playAsync();
      // when playback finishes, reset state
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status && status.didJustFinish) {
          try { sound.unloadAsync(); } catch (e) {}
          setCurrentSound(null);
          setPlayingTrackId(null);
        }
      });
    } catch (e) {
      console.warn('playNative error', e);
      Alert.alert('Play error', 'Unable to play this track');
    }
  };

  // Web: pause all audio elements except the one with exceptId
  const pauseAllWebExcept = (exceptId) => {
    Object.entries(audioRefs.current).forEach(([tid, audioEl]) => {
      if (!audioEl) return;
      if (String(tid) !== String(exceptId) && !audioEl.paused) {
        try { audioEl.pause(); } catch (e) {}
      }
    });
  };

  // Web: handler invoked when a web audio element begins playing (via its onPlay)
  const handleWebPlay = (trackId) => {
    // Pause others
    pauseAllWebExcept(trackId);
    setPlayingTrackId(trackId);
  };

  // Web: handler when the audio is paused/stopped to clear playingTrackId
  const handleWebPause = (trackId) => {
    // if the paused track was the playing one, clear state
    if (playingTrackId === trackId) {
      setPlayingTrackId(null);
    }
  };

  if (!playlist && loading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (!playlist) return <View style={{ padding: 16 }}><Text>No playlist found</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlist.name}</Text>
      <Text style={styles.description}>{playlist.description}</Text>

      <View style={{ height: 8 }} />

      <Button title="Edit Playlist" onPress={() => navigation.navigate('PlaylistForm', { playlist })} />
      <View style={{ height: 8 }} />
      <Button title="Add Track (Upload)" onPress={() => navigation.navigate('TrackForm', { playlistId: playlist.id })} />

      <FlatList
        data={playlist.tracks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.trackItem}>
            <View style={styles.trackText}>
              <Text style={styles.trackTitle}>{item.title}</Text>
              <Text style={styles.trackArtist}>{item.artist}</Text>
            </View>

            <View style={styles.controls}>
              {Platform.OS === 'web' ? (
                // Web: HTML audio element with refs and handlers that ensure only one audio plays
                <div style={{ width: '100%' }}>
                  <audio
                    ref={(el) => { if (el) audioRefs.current[item.id] = el; else delete audioRefs.current[item.id]; }}
                    controls
                    crossOrigin="anonymous"
                    src={item.audio_file}
                    style={{ width: '100%', height: 40 }}
                    onPlay={() => handleWebPlay(item.id)}
                    onPause={() => handleWebPause(item.id)}
                  />
                </div>
              ) : (
                // Native: single Play/Pause button managed by expo-av
                <Button
                  title={playingTrackId === item.id ? 'Pause' : 'Play'}
                  onPress={() => playNative(item)}
                />
              )}

              <View style={{ height: 8 }} />
              <Button title="Edit" onPress={() => navigation.navigate('TrackForm', { track: item, playlistId: playlist.id })} />
              <View style={{ height: 8 }} />
              <Button title="Delete Track" color="red" onPress={async () => {
                try {
                  await api.delete(`/tracks/${item.id}/`);
                  // refresh list
                  const res = await api.get(`/playlists/${playlist.id}/`);
                  setPlaylist(res.data);
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
  trackItem: { padding: 12 },
  trackText: { marginBottom: 8 },
  trackTitle: { fontSize: 18 },
  trackArtist: { color: '#666' },
  controls: { zIndex: 2, position: 'relative' },
  separator: { height: 1, backgroundColor: '#ddd', marginTop: 12, marginBottom: 12 },
});