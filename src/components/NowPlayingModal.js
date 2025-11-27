import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../context/PlayerContext';
import { SvgXml } from 'react-native-svg';

// simple in-memory cache for fetched SVGs
const svgCache = {};
function RemoteSvgIcon({ uri, color = '#fff', width = 18, height = 18, style }) {
  const [svgText, setSvgText] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    if (svgCache[uri]) {
      setSvgText(svgCache[uri]);
      return;
    }
    fetch(uri)
      .then((res) => res.text())
      .then((text) => {
        if (!mounted) return;
        svgCache[uri] = text;
        setSvgText(text);
      })
      .catch((err) => {
        console.warn('Failed to load SVG', uri, err);
      });
    return () => {
      mounted = false;
    };
  }, [uri]);

  if (!svgText) return <View style={[{ width, height }, style]} />;

  const colored = svgText
    .replace(/fill="[^"]*"/gi, `fill="${color}"`)
    .replace(/stroke="[^"]*"/gi, `stroke="${color}"`)
    .replace(/fill='[^']*'/gi, `fill="${color}"`)
    .replace(/stroke='[^']*'/gi, `stroke="${color}"`);

  return <SvgXml xml={colored} width={width} height={height} style={style} />;
}

const BOOTSTRAP_ICONS_BASE = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons';
const SHUFFLE_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/shuffle.svg`;
const REPEAT_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/repeat.svg`;
const PLAY_FILL_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/play-fill.svg`;
const PAUSE_FILL_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/pause-fill.svg`;
const SKIP_START_FILL_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/skip-start-fill.svg`;
const SKIP_END_FILL_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/skip-end-fill.svg`;

// Inline accent so we don't rely on resolving the styles file
const ACCENT_GREEN = '#1DB954';

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
    isShuffled,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
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

  const inactiveColor = '#d6d6d6';
  const activeColor = ACCENT_GREEN; // use inline accent
  const playBtnIconColor = '#000000';

  const shuffleColor = useMemo(() => (isShuffled ? activeColor : inactiveColor), [isShuffled]);
  const repeatColor = useMemo(() => (isRepeat ? activeColor : inactiveColor), [isRepeat]);
  const transportColor = inactiveColor;

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
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={() => toggleShuffle()} style={styles.iconButton}>
            {/* direct color change when active, no circle badge */}
            <RemoteSvgIcon uri={SHUFFLE_SVG_URL} color={shuffleColor} width={16} height={16} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => playPrev()} style={styles.iconButton}>
            <RemoteSvgIcon uri={SKIP_START_FILL_SVG_URL} color={transportColor} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => (isPlaying ? pause() : play(currentTrack))} style={styles.playButton}>
            <RemoteSvgIcon uri={isPlaying ? PAUSE_FILL_SVG_URL : PLAY_FILL_SVG_URL} color={playBtnIconColor} width={20} height={20} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => playNext()} style={styles.iconButton}>
            <RemoteSvgIcon uri={SKIP_END_FILL_SVG_URL} color={transportColor} width={18} height={18} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleRepeat()} style={styles.iconButton}>
            {/* direct color change when active, no circle badge */}
            <RemoteSvgIcon uri={REPEAT_SVG_URL} color={repeatColor} width={16} height={16} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.timeText}>{format(positionMillis)}</Text>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: durationMillis ? `${(positionMillis / durationMillis) * 100}%` : '0%',
              },
            ]}
          />
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