import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../context/PlayerContext';

export default function NowPlayingModal() {
  const navigation = useNavigation();
  const {
    currentTrack,
    isPlaying,
    play,
    pause,
    positionMillis,
    durationMillis,
    playPrev,
    playNext,
  } = usePlayer();

  if (!currentTrack) return null;

  // hide the mini modal when the active route is NowPlaying
  const navState = navigation.getState?.();
  const activeRouteName = navState && navState.routes && navState.routes[navState.index] ? navState.routes[navState.index].name : null;
  if (activeRouteName === 'NowPlaying') return null;

  const format = (ms) => {
    if (!ms && ms !== 0) return '0:00';
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={() => navigation.navigate('NowPlaying')}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {currentTrack?.artwork ? (
            <Image source={{ uri: currentTrack.artwork }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={() => playPrev()} style={styles.iconButton}>
            <Text style={styles.icon}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => isPlaying ? pause() : play(currentTrack)} style={styles.playButton}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => playNext()} style={styles.iconButton}>
            <Text style={styles.icon}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.timeText}>{format(positionMillis)}</Text>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: durationMillis ? `${(positionMillis / durationMillis) * 100}%` : '0%' }]} />
        </View>
        <Text style={styles.timeTextRight}>{format(durationMillis)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    backgroundColor: '#0b0b0b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 8,
    zIndex: 9999,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  left: {
    width: 56,
    marginRight: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#333',
  },

  meta: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  artist: {
    color: '#cfcfcf',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  icon: {
    color: '#d6d6d6',
    fontSize: 16,
  },

  playButton: {
    marginHorizontal: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    color: '#cfcfcf',
    fontSize: 11,
    width: 36,
    textAlign: 'left',
  },
  timeTextRight: {
    color: '#cfcfcf',
    fontSize: 11,
    width: 36,
    textAlign: 'right',
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#2d2d2d',
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#fff',
  },
});