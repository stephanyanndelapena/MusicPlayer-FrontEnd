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
  const pendingSeekRef = useRef(null);
  const isRepeatRef = useRef(false);
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [originalQueue, setOriginalQueue] = useState([]); // Store original order
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  // Volume (0.0 - 1.0)
  const [volume, setVolumeState] = useState(1);

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

  // Public setter that updates local state and active sound volume when possible
  const setVolume = async (v) => {
    try {
      const val = Math.max(0, Math.min(1, Number(v) || 0));
      setVolumeState(val);
      if (soundRef.current && soundRef.current.setVolumeAsync) {
        await soundRef.current.setVolumeAsync(val);
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

  // Enhanced shuffle array using Fisher-Yates with crypto randomization
  const shuffleArray = (array) => {
    if (!array || array.length <= 1) return [...array];

    const shuffled = [...array];

    // Use crypto.getRandomValues for better randomness if available
    const getRandomInt = (max) => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        return randomArray[0] % max;
      }
      return Math.floor(Math.random() * max);
    };

    // Fisher-Yates shuffle with enhanced randomization
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };

  // Helper function to check if two arrays are equal (for shuffle validation)
  const arraysEqual = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((val, index) => {
      const other = b[index];
      // Compare by id when available, otherwise by strict equality reference
      if (val && other && val.id !== undefined && other.id !== undefined) {
        return val.id === other.id;
      }
      return val === other;
    });
  };

  // Enhanced shuffle mode with better queue management
  const toggleShuffle = () => {
    if (!queue || queue.length === 0) return;

    console.log('Toggling shuffle:', { isShuffled, queueLength: queue.length });

    if (isShuffled) {
      // Turn off shuffle - restore original order
      if (originalQueue && originalQueue.length > 0) {
        // Restore a copy to avoid reference sharing
        const restored = [...originalQueue];

        // Find current track in original queue
        let currentIndexInOriginal = -1;
        if (currentTrack) {
          currentIndexInOriginal = restored.findIndex(t => {
            if (t && currentTrack && t.id !== undefined && currentTrack.id !== undefined) {
              return t.id === currentTrack.id;
            }
            return t === currentTrack;
          });
        }

        // If we found the current track in the original order, set queueIndex to that index
        // so that the next call to playNext() will play the original-next (index + 1).
        if (currentIndexInOriginal !== -1) {
          setQueue(restored);
          queueRef.current = restored;
          setQueueIndex(currentIndexInOriginal);
          queueIndexRef.current = currentIndexInOriginal;
        } else {
          // Fallback: try to map the next item from the shuffled queue into the original queue
          const nextInShuffled = queue.length > 0 ? queue[(queueIndex + 1) % queue.length] : null;
          if (nextInShuffled) {
            const nextIndexInOriginal = restored.findIndex(t => {
              if (t && nextInShuffled && t.id !== undefined && nextInShuffled.id !== undefined) {
                return t.id === nextInShuffled.id;
              }
              return t === nextInShuffled;
            });
            if (nextIndexInOriginal !== -1) {
              // set queueIndex so that playNext() will advance to nextIndexInOriginal
              const newIndex = (nextIndexInOriginal - 1 + restored.length) % restored.length;
              setQueue(restored);
              queueRef.current = restored;
              setQueueIndex(newIndex);
              queueIndexRef.current = newIndex;
            } else {
              // completely fallback: restore and place current at index 0
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

      // Clear the saved original queue since we're back to normal order
  setOriginalQueue([]);
  setIsShuffled(false);
      console.log('Shuffle OFF - restored original order');
    } else {
      // Turn on shuffle - always snapshot the current queue as the original
  setOriginalQueue([...queue]); // create a copy to preserve original order
  queueRef.current = queue;

      const currentTrackId = currentTrack?.id;
      let shuffledQueue = shuffleArray(queue);

      // Ensure we don't get the same order (try up to 3 times for small arrays)
      let attempts = 0;
      const maxAttempts = queue.length > 3 ? 1 : 3;

      while (attempts < maxAttempts && arraysEqual(shuffledQueue, queue)) {
        shuffledQueue = shuffleArray(queue);
        attempts++;
      }

      // Handle current track positioning
      if (currentTrackId || currentTrack) {
        const currentTrackIndex = shuffledQueue.findIndex(track => {
          if (track && currentTrack && track.id !== undefined && currentTrack.id !== undefined) {
            return track.id === currentTrack.id;
          }
          return track === currentTrack;
        });

        if (currentTrackIndex !== -1 && currentTrackIndex !== queueIndex) {
          // Move current track to maintain its position in the queue
          const current = shuffledQueue[currentTrackIndex];
          shuffledQueue.splice(currentTrackIndex, 1);

          // Insert at current queue index, but ensure it doesn't exceed array bounds
          const insertIndex = Math.min(queueIndex, shuffledQueue.length);
          shuffledQueue.splice(insertIndex, 0, current);

          // Update queue index to where we inserted the current track
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

  // Toggle repeat (loop current track)
  const toggleRepeat = async () => {
    const newVal = !isRepeat;
    setIsRepeat(newVal);
    isRepeatRef.current = newVal;

    // If a sound is loaded, update its looping status immediately
    try {
      if (soundRef.current && soundRef.current.setIsLoopingAsync) {
        // setIsLoopingAsync expects a boolean
        await soundRef.current.setIsLoopingAsync(newVal);
      }
    } catch (e) {
      console.warn('toggleRepeat error', e);
    }
  };

  /**
   * Play a track.
   * track: object (required)
   * opts: { queue: arrayOfTracks, index: number } optional
   */
  const play = async (track, opts = {}) => {
    if (!track) return;

    if (Array.isArray(opts.queue)) {
      // Always store a copy of the provided queue to avoid external mutation issues.
      setQueue(opts.queue);
      queueRef.current = opts.queue;

      // Only snapshot originalQueue when NOT in shuffled mode.
      // This avoids playNext/playPrev during shuffle from overwriting originalQueue.
      if (!isShuffled) {
        setOriginalQueue([...opts.queue]); // Store original order (copy)
      }

      if (typeof opts.index === 'number') {
        setQueueIndex(opts.index);
        queueIndexRef.current = opts.index;
      }
    }

    // If shuffle was active but this play call is a user-initiated selection (not internal next/prev),
    // turn off shuffle so the UI reflects that the user chose a specific song.
    // Internal calls (playNext/playPrev) pass opts._internal=true to avoid this.
    if (isShuffled && !(opts && opts._internal)) {
      setIsShuffled(false);
      // clear originalQueue snapshot since we're no longer in shuffled mode
      setOriginalQueue([]);
      // keep queueRef as the latest queue (opts.queue already set above when provided)
      // note: do not call toggleShuffle() here because the user explicitly selected a new song
      // and we should respect the provided queue order.
    }

    try {
      // If same track loaded, resume
      if (currentTrack && track.id === currentTrack.id && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
          // Ensure looping reflects current repeat setting when resuming
          try {
            if (soundRef.current.setIsLoopingAsync) {
              await soundRef.current.setIsLoopingAsync(isRepeatRef.current);
            }
          } catch (e) {
            // non-fatal
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
      // Apply saved volume preference immediately after load if available
      try {
        if (typeof volume === 'number' && sound.setVolumeAsync) {
          await sound.setVolumeAsync(volume);
        }
      } catch (e) {
        // non-fatal
      }
      // Apply repeat/looping preference immediately after load
      try {
        if (sound.setIsLoopingAsync) {
          await sound.setIsLoopingAsync(isRepeatRef.current);
        }
      } catch (e) {
        // non-fatal
      }
      // If there was a pending seek requested before the sound finished loading,
      // apply it now using the loaded status (which should include duration).
      try {
        if (pendingSeekRef.current != null) {
          const requested = pendingSeekRef.current;
          // If requested is a fraction but we don't yet have a valid duration, keep it pending
          const hasDuration = (loadedStatus.durationMillis ?? 0) > 0;
          if (typeof requested === 'number' && requested >= 0 && requested <= 1 && !hasDuration) {
            // leave pendingSeekRef as-is for the playback status handler to pick up later
          } else {
            // consume pending seek and apply now
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
        // non-fatal
      }
      setCurrentTrack(track);
      setIsPlaying(true);
      setPositionMillis(0);
      setDurationMillis(loadedStatus.durationMillis ?? 0);

      // central increment
      incrementPlayCount(track);

      startPositionTimer();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status) return;
        // If the sound just became loaded and there is a pending seek,
        // apply it now (use the status which contains the duration).
        if (status.isLoaded && pendingSeekRef.current != null) {
          (async () => {
            try {
              const requested = pendingSeekRef.current;
              // If requested is a fraction, wait until we have a non-zero duration
              const dur = status.durationMillis ?? 0;
              if (typeof requested === 'number' && requested >= 0 && requested <= 1 && dur === 0) {
                // keep pending
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
              // non-fatal
            }
          })();
        }
        setPositionMillis(status.positionMillis ?? 0);
        setDurationMillis(status.durationMillis ?? 0);
        setIsPlaying(status.isPlaying ?? false);

        // When a track finishes, advance to the next track unless repeat is enabled.
        // Use the stable ref `isRepeatRef` to avoid stale-closure issues inside this callback.
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
      // Handle fractional seeks (0..1) differently: if we don't know duration yet,
      // keep the fraction pending until duration is available.
      if (typeof ms === 'number' && ms >= 0 && ms <= 1) {
        const duration = status.durationMillis ?? durationMillis ?? 0;
        if (status.isLoaded && duration > 0) {
          const targetMs = Math.round(ms * duration);
          await soundRef.current.setPositionAsync(targetMs);
          setPositionMillis(targetMs);
        } else {
          // keep fraction pending until duration is known
          pendingSeekRef.current = ms;
        }
        return;
      }

      // ms is an absolute millisecond value. If the sound is loaded, seek now,
      // otherwise save it pending.
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
      // If repeat was enabled, disable it when the user presses next so playback advances
      if (isRepeatRef.current) {
        setIsRepeat(false);
        isRepeatRef.current = false;
        try {
          if (soundRef.current && soundRef.current.setIsLoopingAsync) {
            await soundRef.current.setIsLoopingAsync(false);
          }
        } catch (e) {
          // non-fatal
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
      // If repeat was enabled, disable it when the user presses previous so playback advances
      if (isRepeatRef.current) {
        setIsRepeat(false);
        isRepeatRef.current = false;
        try {
          if (soundRef.current && soundRef.current.setIsLoopingAsync) {
            await soundRef.current.setIsLoopingAsync(false);
          }
        } catch (e) {
          // non-fatal
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