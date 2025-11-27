import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, PanResponder } from 'react-native';
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
    isShuffled,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
  } = usePlayer();

  const [layout, setLayout] = useState(null);
  const layoutRef = useRef(null);
  const panResponder = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(null);

  // Make header same color as body and remove bottom border/shadow (no white line)
  useEffect(() => {
    navigation.setOptions({
      title: 'Now Playing',
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
    const l = ev.nativeEvent.layout;
    setLayout(l);
    layoutRef.current = l;
  };

  const handleDrag = (ev) => {
    const l = layoutRef.current;
    if (!l) return;
    const x = ev.nativeEvent.locationX ?? 0;
    const pct = Math.max(0, Math.min(1, x / l.width));
    setIsDragging(true);
    setDragPct(pct);
    // Continually update position while dragging
    seekTo(pct);
  };

  const handleDragEnd = (ev) => {
    const l = layoutRef.current;
    if (!l) {
      setIsDragging(false);
      setDragPct(null);
      return;
    }
    const x = ev.nativeEvent.locationX ?? 0;
    const pct = Math.max(0, Math.min(1, x / l.width));
    // Final seek
    seekTo(pct);
    setIsDragging(false);
    setDragPct(null);
  };

  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleDrag(evt),
      onPanResponderMove: (evt) => handleDrag(evt),
      onPanResponderRelease: (evt) => handleDragEnd(evt),
      onPanResponderTerminate: (evt) => handleDragEnd(evt),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekTo]);

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

      <View
        style={styles.progressWrap}
        onLayout={onProgressLayout}
        {...(panResponder.current ? panResponder.current.panHandlers : {})}
        accessibilityLabel="Seek bar"
      >
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(0, Math.min(100, isDragging && dragPct != null ? dragPct * 100 : progress))}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{format(positionMillis)}</Text>
        <Text style={styles.timeText}>{format(durationMillis)}</Text>
      </View>

      <View style={styles.controlsRow}>
        {/* Shuffle button */}
        <TouchableOpacity onPress={toggleShuffle} style={styles.transportButton} accessibilityLabel="Toggle shuffle">
          <Text
            style={[
              styles.transportIcon,
              { color: isShuffled ? (colors.textPrimary || '#fff') : (colors.textSecondary || '#9e9e9e') },
            ]}
          >
            {isShuffled ? '🔀' : '🔁'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playPrev} style={styles.transportButton} accessibilityLabel="Previous track">
          <Text style={styles.transportIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayToggle} style={styles.playBigButton} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          <Text style={styles.playBigIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} style={styles.transportButton} accessibilityLabel="Next track">
          <Text style={styles.transportIcon}>⏭</Text>
        </TouchableOpacity>

        {/* Repeat (single-track) button - same style as prev/next */}
        <TouchableOpacity onPress={toggleRepeat} style={styles.transportButton} accessibilityLabel={isRepeat ? 'Repeat on' : 'Repeat off'}>
          <Text
            style={[
              styles.transportIcon,
              { color: isRepeat ? (colors.textPrimary || '#fff') : (colors.textSecondary || '#9e9e9e') },
            ]}
          >
            {isRepeat ? '🔂' : '⟳'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}