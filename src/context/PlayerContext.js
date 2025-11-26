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
  const [originalQueue, setOriginalQueue] = useState([]); // Store original order
  const [isShuffled, setIsShuffled] = useState(false);

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
          setQueueIndex(currentIndexInOriginal);
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
              setQueueIndex(newIndex);
            } else {
              // completely fallback: restore and place current at index 0
              setQueue(restored);
              setQueueIndex(0);
            }
          } else {
            setQueue(restored);
            setQueueIndex(0);
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
        }
      }

      setQueue(shuffledQueue);
      setIsShuffled(true);
      console.log('Shuffle ON - new shuffled order');
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

      // Only snapshot originalQueue when NOT in shuffled mode.
      // This avoids playNext/playPrev during shuffle from overwriting originalQueue.
      if (!isShuffled) {
        setOriginalQueue([...opts.queue]); // Store original order (copy)
      }

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
        isShuffled,
        toggleShuffle,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}