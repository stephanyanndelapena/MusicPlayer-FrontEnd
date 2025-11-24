import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { usePlayer } from '../context/PlayerContext';
import { incrementPlayCount } from '../utils/playCounts';
import makeFullUrl from '../utils/makeFullUrl';

export default function NowPlayingScreen({ navigation }) {
  const {
    currentTrack,
    isPlaying,
    play,
    pause,
    positionMillis,
    durationMillis,
    seekTo,
    playNext,
    playPrev,
  } = usePlayer();

  const [layout, setLayout] = useState(null);

  // Add header back arrow
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
        >
          <Text style={styles.headerBackText}>{'←'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // If no track playing
  if (!currentTrack)
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>No track playing</Text>
      </View>
    );

  // FIXED: correct artwork URL building
  const artUri = currentTrack?.artwork ? makeFullUrl(currentTrack.artwork) : null;

  // FIXED: progress calculation
  const progress = durationMillis
    ? (positionMillis / durationMillis) * 100
    : 0;

  const format = (ms) => {
    if (!ms && ms !== 0) return '0:00';
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  };

  const onProgressLayout = (ev) => {
    setLayout(ev.nativeEvent.layout);
  };

  const onProgressPress = (ev) => {
    if (!layout || !durationMillis) return;
    const x = ev.nativeEvent.locationX ?? ev.nativeEvent.pageX;
    const pct = Math.max(0, Math.min(1, x / layout.width));
    const newMs = Math.round(pct * durationMillis);
    seekTo(newMs);
  };

  const handlePlayToggle = async () => {
    if (isPlaying) {
      pause();
      return;
    }
    try {
      await play(currentTrack);
      incrementPlayCount(currentTrack); // track stats
    } catch (e) {
      console.warn('play error', e);
    }
  };

  
  return (
    <View style={styles.container}>
      {artUri ? (
        <Image source={{ uri: artUri }} style={styles.art} />
      ) : (
        <View style={styles.artPlaceholder} />
      )}

      <Text style={styles.title}>{currentTrack.title}</Text>
      <Text style={styles.artist}>{currentTrack.artist}</Text>

      <Pressable style={styles.progressWrap} onLayout={onProgressLayout} onPress={onProgressPress}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </Pressable>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{format(positionMillis)}</Text>
        <Text style={styles.timeText}>{format(durationMillis)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={playPrev} style={styles.transportButton}>
          <Text style={styles.transportIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayToggle} style={styles.playBigButton}>
          <Text style={styles.playBigIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={styles.transportButton}>
          <Text style={styles.transportIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: '#000' },

  art: {
    width: 320,
    height: 320,
    borderRadius: 8,
    marginTop: 20,
  },
  artPlaceholder: {
    width: 320,
    height: 320,
    borderRadius: 8,
    backgroundColor: '#222',
    marginTop: 20,
  },

  title: { marginTop: 18, color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  artist: { marginTop: 6, color: '#ccc', fontSize: 14, textAlign: 'center' },

  progressWrap: { width: '100%', paddingHorizontal: 8, marginTop: 24 },
  progressBackground: { height: 6, width: '100%', backgroundColor: '#333', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#fff' },

  timeRow: { width: '100%', paddingHorizontal: 6, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: '#bbb', fontSize: 12 },

  controlsRow: {
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  transportButton: { padding: 12, alignItems: 'center', justifyContent: 'center' },
  transportIcon: { color: '#fff', fontSize: 22 },

  playBigButton: {
    backgroundColor: '#fff',
    borderRadius: 40,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  playBigIcon: { fontSize: 28, color: '#000', fontWeight: '700' },

  headerBackButton: { paddingHorizontal: 16, paddingVertical: 6 },
  headerBackText: { color: '#000', fontSize: 20, fontWeight: '600' },
});
