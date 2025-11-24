import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import api from '../api';
import { incrementPlayCount } from '../utils/playCounts';

/**
 * PlayerContext with centralized play counting and robust URI handling.
 * - Builds full URIs for artwork/audio when backend returns relative paths.
 * - Tries multiple likely audio fields so it will work with common APIs.
 */

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const soundRef = useRef(null);
  const positionTimerRef = useRef(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  useEffect(() => {
    return () => {
      stopAndUnload();
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
        positionTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAndUnload = async () => {
    try {
      if (soundRef.current) {
        // stop then unload
        try { await soundRef.current.stopAsync(); } catch (_) {}
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.warn('stopAndUnload error', e);
    }
  };

  const startPositionTimer = () => {
    if (positionTimerRef.current) return;
    positionTimerRef.current = setInterval(async () => {
      try {
        if (!soundRef.current) return;
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded) return;
        setPositionMillis(status.positionMillis ?? 0);
        setDurationMillis(status.durationMillis ?? 0);
        setIsPlaying(status.isPlaying ?? false);
      } catch (e) {
        // non-fatal
      }
    }, 500);
  };

  const stopPositionTimer = () => {
    if (positionTimerRef.current) {
      clearInterval(positionTimerRef.current);
      positionTimerRef.current = null;
    }
  };

  const makeFullUrl = (maybePath) => {
    if (!maybePath) return null;
    if (maybePath.startsWith('http://') || maybePath.startsWith('https://')) return maybePath;
    const base = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : '';
    // ensure leading slash
    const path = maybePath.startsWith('/') ? maybePath : `/${maybePath}`;
    return base ? `${base}${path}` : path;
  };

  const findAudioUri = (track) => {
    if (!track) return null;
    // common property names used by different backends
    const candidates = [
      track.url,
      track.audio_url,
      track.audio_file_url,
      track.stream_url,
      track.audio_file,
      track.audio,
      track.file,
      track.file_url,
      track.src,
    ];
    for (const c of candidates) {
      if (c) return makeFullUrl(c);
    }
    return null;
  };

  /**
   * Play a track.
   * track: object (required)
   * opts: { queue: arrayOfTracks, index: number } optional
   */
  const play = async (track, opts = {}) => {
    if (!track) return;

    if (Array.isArray(opts.queue)) {
      setQueue(opts.queue);
      if (typeof opts.index === 'number') {
        setQueueIndex(opts.index);
      }
    }

    try {
      // If same track loaded, resume
      if (currentTrack && track.id === currentTrack.id && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          startPositionTimer();
          incrementPlayCount(track);
          return;
        }
      }

      await stopAndUnload();

      const sound = new Audio.Sound();
      soundRef.current = sound;

      const uri = findAudioUri(track);
      if (!uri) {
        console.warn('play: no playable URL found on track', track);
        return;
      }

      const loadedStatus = await sound.loadAsync({ uri }, { shouldPlay: true });
      setCurrentTrack(track);
      setIsPlaying(true);
      setPositionMillis(0);
      setDurationMillis(loadedStatus.durationMillis ?? 0);

      // central increment
      incrementPlayCount(track);

      startPositionTimer();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status) return;
        setPositionMillis(status.positionMillis ?? 0);
        setDurationMillis(status.durationMillis ?? 0);
        setIsPlaying(status.isPlaying ?? false);

        if (status.didJustFinish && !status.isLooping) {
          playNext();
        }
      });
    } catch (e) {
      console.warn('PlayerContext.play error', e);
    }
  };

  const pause = async () => {
    try {
      if (!soundRef.current) return;
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (e) {
      console.warn('pause error', e);
    }
  };

  const seekTo = async (ms) => {
    try {
      if (!soundRef.current) return;
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        await soundRef.current.setPositionAsync(ms);
        setPositionMillis(ms);
      }
    } catch (e) {
      console.warn('seekTo error', e);
    }
  };

  const playNext = async () => {
    try {
      if (!queue || queue.length === 0) return;
      const nextIndex = (queueIndex + 1) % queue.length;
      const nextTrack = queue[nextIndex];
      setQueueIndex(nextIndex);
      await play(nextTrack, { queue, index: nextIndex });
    } catch (e) {
      console.warn('playNext error', e);
    }
  };

  const playPrev = async () => {
    try {
      if (!queue || queue.length === 0) return;
      const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
      const prevTrack = queue[prevIndex];
      setQueueIndex(prevIndex);
      await play(prevTrack, { queue, index: prevIndex });
    } catch (e) {
      console.warn('playPrev error', e);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        positionMillis,
        durationMillis,
        play,
        pause,
        seekTo,
        playNext,
        playPrev,
        queue,
        queueIndex,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}