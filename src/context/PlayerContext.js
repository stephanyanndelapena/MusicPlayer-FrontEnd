import AsyncStorage from '@react-native-async-storage/async-storage';

const VOLUME_STORAGE_KEY = 'player:volume';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import api from '../api';
import { incrementPlayCount } from '../utils/playCounts';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const soundRef = useRef(null);
  const positionTimerRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const isRepeatRef = useRef(false);
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [originalQueue, setOriginalQueue] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [volume, setVolumeState] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(VOLUME_STORAGE_KEY);
        if (stored != null) {
          const num = Number(stored);
          if (!Number.isNaN(num)) {
            const clamped = Math.max(0, Math.min(1, num));
            setVolumeState(clamped);
            try {
              if (soundRef.current && soundRef.current.setVolumeAsync) {
                await soundRef.current.setVolumeAsync(clamped);
              }
            } catch (e) {
            }
          }
        }
      } catch (e) {
      }
    })();

    return () => {
      stopAndUnload();
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
        positionTimerRef.current = null;
      }
    };
  }, []);

  const stopAndUnload = async () => {
    try {
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); } catch (_) {}
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.warn('stopAndUnload error', e);
    }
  };

  const setVolume = async (v) => {
    try {
      const val = Math.max(0, Math.min(1, Number(v) || 0));
      setVolumeState(val);
      if (soundRef.current && soundRef.current.setVolumeAsync) {
        await soundRef.current.setVolumeAsync(val);
      }
      try {
        await AsyncStorage.setItem(VOLUME_STORAGE_KEY, String(val));
      } catch (e) {
      }
    } catch (e) {
      console.warn('setVolume error', e);
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
    const path = maybePath.startsWith('/') ? maybePath : `/${maybePath}`;
    return base ? `${base}${path}` : path;
  };

  const findAudioUri = (track) => {
    if (!track) return null;
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

  const shuffleArray = (array) => {
    if (!array || array.length <= 1) return [...array];

    const shuffled = [...array];

    const getRandomInt = (max) => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        return randomArray[0] % max;
      }
      return Math.floor(Math.random() * max);
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };

  const arraysEqual = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((val, index) => {
      const other = b[index];
      if (val && other && val.id !== undefined && other.id !== undefined) {
        return val.id === other.id;
      }
      return val === other;
    });
  };

  const toggleShuffle = () => {
    if (!queue || queue.length === 0) return;

    console.log('Toggling shuffle:', { isShuffled, queueLength: queue.length });

    if (isShuffled) {
      if (originalQueue && originalQueue.length > 0) {
        const restored = [...originalQueue];

        let currentIndexInOriginal = -1;
        if (currentTrack) {
          currentIndexInOriginal = restored.findIndex(t => {
            if (t && currentTrack && t.id !== undefined && currentTrack.id !== undefined) {
              return t.id === currentTrack.id;
            }
            return t === currentTrack;
          });
        }

        if (currentIndexInOriginal !== -1) {
          setQueue(restored);
          queueRef.current = restored;
          setQueueIndex(currentIndexInOriginal);
          queueIndexRef.current = currentIndexInOriginal;
        } else {
          const nextInShuffled = queue.length > 0 ? queue[(queueIndex + 1) % queue.length] : null;
          if (nextInShuffled) {
            const nextIndexInOriginal = restored.findIndex(t => {
              if (t && nextInShuffled && t.id !== undefined && nextInShuffled.id !== undefined) {
                return t.id === nextInShuffled.id;
              }
              return t === nextInShuffled;
            });
            if (nextIndexInOriginal !== -1) {
              const newIndex = (nextIndexInOriginal - 1 + restored.length) % restored.length;
              setQueue(restored);
              queueRef.current = restored;
              setQueueIndex(newIndex);
              queueIndexRef.current = newIndex;
            } else {
              setQueue(restored);
              queueRef.current = restored;
              setQueueIndex(0);
              queueIndexRef.current = 0;
            }
          } else {
            setQueue(restored);
            queueRef.current = restored;
            setQueueIndex(0);
            queueIndexRef.current = 0;
          }
        }
      }

  setOriginalQueue([]);
  setIsShuffled(false);
      console.log('Shuffle OFF - restored original order');
    } else {
  setOriginalQueue([...queue]);
  queueRef.current = queue;

      const currentTrackId = currentTrack?.id;
      let shuffledQueue = shuffleArray(queue);

      let attempts = 0;
      const maxAttempts = queue.length > 3 ? 1 : 3;

      while (attempts < maxAttempts && arraysEqual(shuffledQueue, queue)) {
        shuffledQueue = shuffleArray(queue);
        attempts++;
      }

      if (currentTrackId || currentTrack) {
        const currentTrackIndex = shuffledQueue.findIndex(track => {
          if (track && currentTrack && track.id !== undefined && currentTrack.id !== undefined) {
            return track.id === currentTrack.id;
          }
          return track === currentTrack;
        });

        if (currentTrackIndex !== -1 && currentTrackIndex !== queueIndex) {
          const current = shuffledQueue[currentTrackIndex];
          shuffledQueue.splice(currentTrackIndex, 1);

          const insertIndex = Math.min(queueIndex, shuffledQueue.length);
          shuffledQueue.splice(insertIndex, 0, current);

          setQueueIndex(insertIndex);
          queueIndexRef.current = insertIndex;
        }
      }

      setQueue(shuffledQueue);
      queueRef.current = shuffledQueue;
      setIsShuffled(true);
      console.log('Shuffle ON - new shuffled order');
    }
  };

  const toggleRepeat = async () => {
    const newVal = !isRepeat;
    setIsRepeat(newVal);
    isRepeatRef.current = newVal;

    try {
      if (soundRef.current && soundRef.current.setIsLoopingAsync) {
        await soundRef.current.setIsLoopingAsync(newVal);
      }
    } catch (e) {
      console.warn('toggleRepeat error', e);
    }
  };

  const play = async (track, opts = {}) => {
    if (!track) return;

    if (Array.isArray(opts.queue)) {
      setQueue(opts.queue);
      queueRef.current = opts.queue;

      if (!isShuffled) {
        setOriginalQueue([...opts.queue]);
      }

      if (typeof opts.index === 'number') {
        setQueueIndex(opts.index);
        queueIndexRef.current = opts.index;
      }
    }

    if (isShuffled && !(opts && opts._internal)) {
      setIsShuffled(false);
      setOriginalQueue([]);

    }

    try {
      if (currentTrack && track.id === currentTrack.id && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
          try {
            if (soundRef.current.setIsLoopingAsync) {
              await soundRef.current.setIsLoopingAsync(isRepeatRef.current);
            }
          } catch (e) {
          }
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
      try {
        if (typeof volume === 'number' && sound.setVolumeAsync) {
          await sound.setVolumeAsync(volume);
        }
      } catch (e) {
      }
      try {
        if (sound.setIsLoopingAsync) {
          await sound.setIsLoopingAsync(isRepeatRef.current);
        }
      } catch (e) {
      }
      try {
        if (pendingSeekRef.current != null) {
          const requested = pendingSeekRef.current;
          const hasDuration = (loadedStatus.durationMillis ?? 0) > 0;
          if (typeof requested === 'number' && requested >= 0 && requested <= 1 && !hasDuration) {
          } else {
            pendingSeekRef.current = null;
            let targetMs = requested;
            if (typeof requested === 'number' && requested >= 0 && requested <= 1) {
              const dur = loadedStatus.durationMillis ?? 0;
              targetMs = Math.round(requested * dur);
            }
            if (typeof targetMs === 'number' && sound.setPositionAsync) {
              await sound.setPositionAsync(targetMs);
              setPositionMillis(targetMs);
            }
          }
        }
      } catch (e) {
      }
      setCurrentTrack(track);
      setIsPlaying(true);
      setPositionMillis(0);
      setDurationMillis(loadedStatus.durationMillis ?? 0);

      incrementPlayCount(track);

      startPositionTimer();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status) return;
        if (status.isLoaded && pendingSeekRef.current != null) {
          (async () => {
            try {
              const requested = pendingSeekRef.current;
              const dur = status.durationMillis ?? 0;
              if (typeof requested === 'number' && requested >= 0 && requested <= 1 && dur === 0) {
                return;
              }
              pendingSeekRef.current = null;
              let targetMs = requested;
              if (typeof requested === 'number' && requested >= 0 && requested <= 1) {
                targetMs = Math.round(requested * dur);
              }
              if (typeof targetMs === 'number' && soundRef.current && soundRef.current.setPositionAsync) {
                await soundRef.current.setPositionAsync(targetMs);
                setPositionMillis(targetMs);
              }
            } catch (e) {
            }
          })();
        }
        setPositionMillis(status.positionMillis ?? 0);
        setDurationMillis(status.durationMillis ?? 0);
        setIsPlaying(status.isPlaying ?? false);

        if (status.didJustFinish && !isRepeatRef.current) {
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
      if (typeof ms === 'number' && ms >= 0 && ms <= 1) {
        const duration = status.durationMillis ?? durationMillis ?? 0;
        if (status.isLoaded && duration > 0) {
          const targetMs = Math.round(ms * duration);
          await soundRef.current.setPositionAsync(targetMs);
          setPositionMillis(targetMs);
        } else {
          pendingSeekRef.current = ms;
        }
        return;
      }

      if (status.isLoaded) {
        if (typeof ms === 'number') {
          await soundRef.current.setPositionAsync(ms);
          setPositionMillis(ms);
        }
      } else {
        pendingSeekRef.current = ms;
      }
    } catch (e) {
      console.warn('seekTo error', e);
    }
  };

  const playNext = async () => {
    try {
      if (isRepeatRef.current) {
        setIsRepeat(false);
        isRepeatRef.current = false;
        try {
          if (soundRef.current && soundRef.current.setIsLoopingAsync) {
            await soundRef.current.setIsLoopingAsync(false);
          }
        } catch (e) {
        }
      }
      const q = queueRef.current ?? queue;
      if (!q || q.length === 0) return;
      const currentIdx = queueIndexRef.current ?? queueIndex;
      const nextIndex = (currentIdx + 1) % q.length;
      const nextTrack = q[nextIndex];
      setQueueIndex(nextIndex);
      queueIndexRef.current = nextIndex;
      await play(nextTrack, { queue: q, index: nextIndex, _internal: true });
    } catch (e) {
      console.warn('playNext error', e);
    }
  };

  const playPrev = async () => {
    try {
      if (isRepeatRef.current) {
        setIsRepeat(false);
        isRepeatRef.current = false;
        try {
          if (soundRef.current && soundRef.current.setIsLoopingAsync) {
            await soundRef.current.setIsLoopingAsync(false);
          }
        } catch (e) {
        }
      }
      const q = queueRef.current ?? queue;
      if (!q || q.length === 0) return;
      const currentIdx = queueIndexRef.current ?? queueIndex;
      const prevIndex = currentIdx > 0 ? currentIdx - 1 : q.length - 1;
      const prevTrack = q[prevIndex];
      setQueueIndex(prevIndex);
      queueIndexRef.current = prevIndex;
      await play(prevTrack, { queue: q, index: prevIndex, _internal: true });
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
        isShuffled,
        toggleShuffle,
        isRepeat,
        toggleRepeat,
        volume,
        setVolume,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}