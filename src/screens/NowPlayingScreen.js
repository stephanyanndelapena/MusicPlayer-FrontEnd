import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, PanResponder, Pressable } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { usePlayer } from '../context/PlayerContext';
import { incrementPlayCount } from '../utils/playCounts';
import makeFullUrl from '../utils/makeFullUrl';
import styles, { colors } from './NowPlayingScreen.styles';

/**
 * RemoteSvgIcon - fetches SVG markup from a URL once and caches it in-memory.
 * Replace fill/stroke attributes at render time so color can be applied dynamically.
 */
function RemoteSvgIcon({ uri, color = '#fff', width = 22, height = 22, style }) {
  const [svgText, setSvgText] = useState(null);

  useEffect(() => {
    let mounted = true;
    // Fetch once per URI
    fetch(uri)
      .then((res) => res.text())
      .then((text) => {
        if (!mounted) return;
        setSvgText(text);
      })
      .catch((err) => {
        console.warn('Failed to load SVG', uri, err);
      });
    return () => {
      mounted = false;
    };
  }, [uri]);

  if (!svgText) {
    // empty placeholder while loading
    return <View style={[{ width, height }, style]} />;
  }

  // Replace any explicit stroke/fill colors with the requested color.
  // This is a simple approach; depending on the SVG you might need more robust transformations.
  const colored = svgText
    .replace(/fill="[^"]*"/gi, `fill="${color}"`)
    .replace(/stroke="[^"]*"/gi, `stroke="${color}"`)
    .replace(/fill='[^']*'/gi, `fill="${color}"`)
    .replace(/stroke='[^']*'/gi, `stroke="${color}"`);

  return <SvgXml xml={colored} width={width} height={height} style={style} />;
}

// CDN icon URLs (Bootstrap Icons via jsDelivr).
// Using fill variants for the play/pause and skip icons so they render clearly on the colored play button.
const SHUFFLE_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/shuffle.svg';
const REPEAT_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/repeat.svg';
const PLAY_FILL_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/play-fill.svg';
const PAUSE_FILL_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/pause-fill.svg';
const SKIP_START_FILL_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/skip-start-fill.svg';
const SKIP_END_FILL_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/skip-end-fill.svg';
// Volume icons
const VOLUME_UP_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/volume-up-fill.svg';
const VOLUME_MUTE_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/volume-mute-fill.svg';

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
    volume,
    setVolume,
  } = usePlayer();

  const [layout, setLayout] = useState(null);
  const layoutRef = useRef(null);
  const panResponder = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(null);
  // Volume UI state
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const volLayoutRef = useRef(null);
  const volPanResponder = useRef(null);
  const [isVolDragging, setIsVolDragging] = useState(false);
  const [volDragPct, setVolDragPct] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'Now Playing',
      headerStyle: {
        backgroundColor: colors.background || '#121212',
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.textPrimary || '#fff',
      headerTitleStyle: { color: colors.textPrimary || '#fff' },
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

  const onVolumeLayout = (ev) => {
    const l = ev.nativeEvent.layout;
    volLayoutRef.current = l;
  };

  const handleDrag = (ev) => {
    const l = layoutRef.current;
    if (!l) return;
    const x = ev.nativeEvent.locationX ?? 0;
    const pct = Math.max(0, Math.min(1, x / l.width));
    setIsDragging(true);
    setDragPct(pct);
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
  }, [seekTo]);

  useEffect(() => {
    volPanResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleVolDrag(evt),
      onPanResponderMove: (evt) => handleVolDrag(evt),
      onPanResponderRelease: (evt) => handleVolDragEnd(evt),
      onPanResponderTerminate: (evt) => handleVolDragEnd(evt),
    });
  }, [setVolume]);

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

  const iconColorFor = (active) => (active ? colors.accent || colors.textPrimary : colors.textSecondary);

  // Memoize icon colors so strings passed into replace are stable
  const shuffleColor = useMemo(() => iconColorFor(isShuffled), [isShuffled]);
  const repeatColor = useMemo(() => iconColorFor(isRepeat), [isRepeat]);
  const transportColor = useMemo(() => colors.controlIcon || colors.textPrimary, []);
  const playIconColor = useMemo(() => colors.controlPrimaryIcon || '#fff', []);

  const onVolPressToggle = () => {
    // Toggle for touch devices
    setIsVolumeOpen((s) => !s);
  };

  const isMuted = (typeof volume === 'number' ? volume <= 0.001 : false);

  const handleVolDrag = (ev) => {
    const l = volLayoutRef.current;
    if (!l) return;
    // horizontal slider: use locationX and width
    const x = ev.nativeEvent.locationX ?? 0;
    const pct = Math.max(0, Math.min(1, x / l.width));
    setIsVolDragging(true);
    setVolDragPct(pct);
    if (setVolume) setVolume(pct);
  };

  const handleVolDragEnd = (ev) => {
    const l = volLayoutRef.current;
    if (!l) {
      setIsVolDragging(false);
      setVolDragPct(null);
      return;
    }
    const x = ev.nativeEvent.locationX ?? 0;
    const pct = Math.max(0, Math.min(1, x / l.width));
    if (setVolume) setVolume(pct);
    setIsVolDragging(false);
    setVolDragPct(null);
  };

  return (
    <View style={styles.container}>
      {artUri ? <Image source={{ uri: artUri }} style={styles.art} /> : <View style={styles.artPlaceholder} />}

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
              {
                width: `${Math.max(0, Math.min(100, isDragging && dragPct != null ? dragPct * 100 : progress))}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{format(positionMillis)}</Text>
        <Text style={styles.timeText}>{format(durationMillis)}</Text>
      </View>

      <View style={styles.controlsRow}>
        {/* Shuffle button - remote SVG */}
        <TouchableOpacity onPress={toggleShuffle} style={styles.transportButton} accessibilityLabel="Toggle shuffle">
          <RemoteSvgIcon uri={SHUFFLE_SVG_URL} color={shuffleColor} width={22} height={22} />
        </TouchableOpacity>

        {/* Previous (skip start) */}
        <TouchableOpacity onPress={playPrev} style={styles.transportButton} accessibilityLabel="Previous track">
          <RemoteSvgIcon uri={SKIP_START_FILL_SVG_URL} color={transportColor} width={22} height={22} />
        </TouchableOpacity>

        {/* Play / Pause (large button) */}
        <TouchableOpacity
          onPress={handlePlayToggle}
          style={styles.playBigButton}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <RemoteSvgIcon
            uri={isPlaying ? PAUSE_FILL_SVG_URL : PLAY_FILL_SVG_URL}
            color={playIconColor}
            width={28}
            height={28}
          />
        </TouchableOpacity>

        {/* Next (skip end) */}
        <TouchableOpacity onPress={playNext} style={styles.transportButton} accessibilityLabel="Next track">
          <RemoteSvgIcon uri={SKIP_END_FILL_SVG_URL} color={transportColor} width={22} height={22} />
        </TouchableOpacity>

        {/* Repeat button - remote SVG */}
        <TouchableOpacity onPress={toggleRepeat} style={styles.transportButton} accessibilityLabel={isRepeat ? 'Repeat on' : 'Repeat off'}>
          <RemoteSvgIcon uri={REPEAT_SVG_URL} color={repeatColor} width={22} height={22} />
        </TouchableOpacity>

        {/* Volume control (hover shows slider on web; press toggles on touch) */}
        <View style={styles.volumeWrap}>
          <Pressable onPress={onVolPressToggle} style={styles.volumeButton} accessibilityLabel={isMuted ? 'Muted' : 'Volume'}>
            <RemoteSvgIcon uri={isMuted ? VOLUME_MUTE_SVG_URL : VOLUME_UP_SVG_URL} color={transportColor} width={20} height={20} />
          </Pressable>

          {isVolumeOpen ? (
            <View
              style={styles.volumeSliderWrap}
              onLayout={onVolumeLayout}
              onStartShouldSetResponder={() => true}
              {...(volPanResponder.current ? volPanResponder.current.panHandlers : {})}
            >
              <View style={styles.volumeSliderBackground}>
                <View style={[styles.volumeSliderFill, { width: `${Math.max(0, Math.min(100, isVolDragging && volDragPct != null ? volDragPct * 100 : (volume || 0) * 100))}%` }]} />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}