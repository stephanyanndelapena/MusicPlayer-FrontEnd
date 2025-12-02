import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, PanResponder, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../context/PlayerContext';
import { SvgXml } from 'react-native-svg';
import styles from './NowPlayingModal.styles';

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
const VOLUME_UP_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/volume-up-fill.svg';
const VOLUME_MUTE_SVG_URL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/volume-mute-fill.svg';

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
    volume,
    setVolume,
  } = usePlayer();

  if (!currentTrack) return null;

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

  const onVolumeLayout = (ev) => {
    const l = ev.nativeEvent.layout;
    volLayoutRef.current = l;
  };

  const inactiveColor = '#d6d6d6';
  const activeColor = ACCENT_GREEN;
  const playBtnIconColor = '#000000';

  const shuffleColor = useMemo(() => (isShuffled ? activeColor : inactiveColor), [isShuffled]);
  const repeatColor = useMemo(() => (isRepeat ? activeColor : inactiveColor), [isRepeat]);
  const transportColor = inactiveColor;

  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const volLayoutRef = useRef(null);
  const volPanResponder = useRef(null);
  const [isVolDragging, setIsVolDragging] = useState(false);
  const [volDragPct, setVolDragPct] = useState(null);

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

  const onVolPressToggle = () => {
    setIsVolumeOpen((s) => !s);
  };

  const isMuted = (typeof volume === 'number' ? volume <= 0.001 : false);

  const handleVolDrag = (ev) => {
    const l = volLayoutRef.current;
    if (!l) return;
    const y = ev.nativeEvent.locationY ?? 0;
    const pct = Math.max(0, Math.min(1, 1 - y / l.height));
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
    const y = ev.nativeEvent.locationY ?? 0;
    const pct = Math.max(0, Math.min(1, 1 - y / l.height));
    if (setVolume) setVolume(pct);
    setIsVolDragging(false);
    setVolDragPct(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          activeOpacity={0.95}
          onPress={() => navigation.navigate('NowPlaying')}
        >
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
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity onPress={() => toggleShuffle()} style={styles.iconButton}>
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
            <RemoteSvgIcon uri={REPEAT_SVG_URL} color={repeatColor} width={16} height={16} />
          </TouchableOpacity>

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
                  <View style={[styles.volumeSliderFill, { height: `${Math.max(0, Math.min(100, isVolDragging && volDragPct != null ? volDragPct * 100 : (volume || 0) * 100))}%` }]} />
                </View>
              </View>
            ) : null}
          </View>
          
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
    </View>
  );
}