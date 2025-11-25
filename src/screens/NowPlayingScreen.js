import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, TouchableOpacity } from 'react-native';
import { usePlayer } from '../context/PlayerContext';
import { incrementPlayCount } from '../utils/playCounts';
import makeFullUrl from '../utils/makeFullUrl';
import styles, { colors } from './NowPlayingScreen.styles';

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

  // Make header same color as body and remove bottom border/shadow (no white line)
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background || '#121212',
        borderBottomWidth: 0,
        elevation: 0, // Android: remove shadow
        shadowOpacity: 0, // iOS: remove shadow
      },
      headerTintColor: colors.textPrimary || '#fff',
      headerTitleStyle: { color: colors.textPrimary || '#fff' },
      // do not override headerLeft so native back button is used and tinted correctly
    });
  }, [navigation]);

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No track playing</Text>
      </View>
    );
  }

  const artUri = currentTrack?.artwork ? makeFullUrl(currentTrack.artwork) : null;

  const progress = durationMillis ? (positionMillis / durationMillis) * 100 : 0;

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
      incrementPlayCount(currentTrack);
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

      <Text style={styles.title} numberOfLines={2}>
        {currentTrack.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {currentTrack.artist}
      </Text>

      <Pressable style={styles.progressWrap} onLayout={onProgressLayout} onPress={onProgressPress} accessibilityLabel="Seek bar">
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
        </View>
      </Pressable>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{format(positionMillis)}</Text>
        <Text style={styles.timeText}>{format(durationMillis)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={playPrev} style={styles.transportButton} accessibilityLabel="Previous track">
          <Text style={styles.transportIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayToggle} style={styles.playBigButton} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          <Text style={styles.playBigIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={styles.transportButton} accessibilityLabel="Next track">
          <Text style={styles.transportIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}