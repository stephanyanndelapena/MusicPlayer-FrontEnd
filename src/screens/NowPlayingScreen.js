import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { usePlayer } from '../context/PlayerContext';

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

  // add header back arrow
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          accessibilityLabel="Back"
        >
          <TextAccessible style={styles.headerBackText}>{'←'}</TextAccessible>
        </TouchableOpacity>
      ),
      // keep title if you want; you can also set headerShown: false to hide the bar entirely
    });
  }, [navigation]);

  if (!currentTrack) return (
    <View style={styles.container}><Text style={{ color: '#fff' }}>No track playing</Text></View>
  );

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

  return (
    <View style={styles.container}>
      {currentTrack?.artwork ? (
        <Image source={{ uri: currentTrack.artwork }} style={styles.art} />
      ) : (
        <View style={styles.artPlaceholder} />
      )}

      <Text style={styles.title}>{currentTrack.title}</Text>
      <Text style={styles.artist}>{currentTrack.artist}</Text>

      <Pressable style={styles.progressWrap} onLayout={onProgressLayout} onPress={onProgressPress}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: durationMillis ? `${(positionMillis / durationMillis) * 100}%` : '0%' }]} />
        </View>
      </Pressable>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{format(positionMillis)}</Text>
        <Text style={styles.timeText}>{format(durationMillis)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={() => playPrev()} style={styles.transportButton}>
          <Text style={styles.transportIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => isPlaying ? pause() : play(currentTrack)} style={styles.playBigButton}>
          <Text style={styles.playBigIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => playNext()} style={styles.transportButton}>
          <Text style={styles.transportIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// tiny accessible Text wrapper (in case your project blocks raw Text in header)
function TextAccessible({ children, style }) {
  return <Text style={style}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: '#000' },
  art: { width: 320, height: 320, borderRadius: 8, marginTop: 20 },
  artPlaceholder: { width: 320, height: 320, borderRadius: 8, backgroundColor: '#222', marginTop: 20 },
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
  transportButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportIcon: { color: '#fff', fontSize: 22 },
  playBigButton: { backgroundColor: '#fff', borderRadius: 40, width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  playBigIcon: { fontSize: 28, color: '#000', fontWeight: '700' },

  headerBackButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerBackText: {
    color: '#000', // header text color; change to '#fff' if your header is dark
    fontSize: 20,
    fontWeight: '600',
  },
});