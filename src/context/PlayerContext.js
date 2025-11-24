import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [queue, setQueueState] = useState([]); // array of track objects
  const [currentIndex, setCurrentIndex] = useState(-1); // index in queue
  const [currentTrack, setCurrentTrack] = useState(null); // current track object
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(null);
  const [shuffle, setShuffle] = useState(false);

  const webAudioRef = useRef(null);
  const nativeSoundRef = useRef(null);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (Platform.OS === 'web') {
        if (webAudioRef.current) {
          try { webAudioRef.current.pause(); } catch (e) {}
        }
      } else {
        if (nativeSoundRef.current) {
          try { nativeSoundRef.current.unloadAsync(); } catch (e) {}
        }
      }
    };
  }, []);

  // internal helper: load and play track object
  const _loadAndPlay = async (track) => {
    setCurrentTrack(track);
    if (!track) {
      setIsPlaying(false);
      setPositionMillis(0);
      setDurationMillis(null);
      return;
    }

    if (Platform.OS === 'web') {
      if (!webAudioRef.current) {
        webAudioRef.current = new window.Audio();
        webAudioRef.current.crossOrigin = 'anonymous';
        webAudioRef.current.addEventListener('timeupdate', () => {
          setPositionMillis(Math.floor(webAudioRef.current.currentTime * 1000));
          setDurationMillis(webAudioRef.current.duration ? Math.floor(webAudioRef.current.duration * 1000) : null);
        });
        webAudioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setPositionMillis(0);
        });
      }
      if (webAudioRef.current.src !== track.audio_file) {
        webAudioRef.current.src = track.audio_file;
      }
      try {
        await webAudioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn('web play error', e);
        setIsPlaying(false);
      }
    } else {
      try {
        if (nativeSoundRef.current) {
          try { await nativeSoundRef.current.stopAsync(); } catch (e) {}
          try { await nativeSoundRef.current.unloadAsync(); } catch (e) {}
          nativeSoundRef.current = null;
        }
        const { sound, status } = await Audio.Sound.createAsync({ uri: track.audio_file }, { shouldPlay: true });
        nativeSoundRef.current = sound;
        setIsPlaying(true);
        setDurationMillis(status.durationMillis || null);
        sound.setOnPlaybackStatusUpdate((s) => {
          if (!s) return;
          setPositionMillis(s.positionMillis || 0);
          setDurationMillis(s.durationMillis || null);
          if (s.didJustFinish) {
            setIsPlaying(false);
            setPositionMillis(0);
            // automatically play next when a track finishes
            playNext();
          }
        });
      } catch (e) {
        console.warn('native play error', e);
        setIsPlaying(false);
      }
    }
  };

  // set a new queue (array of tracks) and optional start index
  const setQueue = async (newQueue = [], startIndex = 0) => {
    setQueueState(newQueue || []);
    if (!newQueue || newQueue.length === 0) {
      setCurrentIndex(-1);
      await _loadAndPlay(null);
      return;
    }
    const index = Math.max(0, Math.min(startIndex, newQueue.length - 1));
    setCurrentIndex(index);
    await _loadAndPlay(newQueue[index]);
  };

  // play a specific index in the current queue (if exists)
  const playAtIndex = async (index) => {
    if (!queue || queue.length === 0) return;
    const idx = Math.max(0, Math.min(index, queue.length - 1));
    setCurrentIndex(idx);
    await _loadAndPlay(queue[idx]);
  };

  // play a track; optional args: provide a queue and startIndex
  const play = async (track, opts = {}) => {
    // opts: { queue: [...], index: n }
    try {
      if (opts.queue && Array.isArray(opts.queue) && opts.queue.length > 0) {
        // use provided queue
        await setQueue(opts.queue, typeof opts.index === 'number' ? opts.index : 0);
        return;
      }

      // If queue contains the track, play that index
      const foundIndex = queue.findIndex((t) => t.id === track?.id);
      if (foundIndex !== -1) {
        await playAtIndex(foundIndex);
        return;
      }

      // otherwise append track to current queue and play it
      const newQueue = [...(queue || []), track];
      setQueueState(newQueue);
      const idx = newQueue.length - 1;
      setCurrentIndex(idx);
      await _loadAndPlay(track);
    } catch (e) {
      console.warn('play error', e);
    }
  };

  const pause = async () => {
    if (Platform.OS === 'web') {
      if (webAudioRef.current && !webAudioRef.current.paused) {
        try { webAudioRef.current.pause(); setIsPlaying(false); } catch (e) { console.warn(e); }
      }
    } else {
      if (nativeSoundRef.current) {
        try { await nativeSoundRef.current.pauseAsync(); setIsPlaying(false); } catch (e) { console.warn(e); }
      }
    }
  };

  const stop = async () => {
    if (Platform.OS === 'web') {
      if (webAudioRef.current) {
        try { webAudioRef.current.pause(); webAudioRef.current.currentTime = 0; setIsPlaying(false); setPositionMillis(0); } catch (e) { console.warn(e); }
      }
    } else {
      if (nativeSoundRef.current) {
        try { await nativeSoundRef.current.stopAsync(); await nativeSoundRef.current.unloadAsync(); nativeSoundRef.current = null; setIsPlaying(false); setPositionMillis(0); } catch (e) { console.warn(e); }
      }
    }
  };

  const seekTo = async (millis) => {
    if (Platform.OS === 'web') {
      if (webAudioRef.current && webAudioRef.current.duration) {
        webAudioRef.current.currentTime = millis / 1000;
        setPositionMillis(millis);
      }
    } else {
      if (nativeSoundRef.current) {
        try { await nativeSoundRef.current.setPositionAsync(millis); setPositionMillis(millis); } catch (e) { console.warn(e); }
      }
    }
  };

  // next/prev controls with shuffle support
  const playNext = async () => {
    if (!queue || queue.length === 0) return;
    if (shuffle && queue.length > 1) {
      // pick a random index different from currentIndex
      let next;
      do {
        next = Math.floor(Math.random() * queue.length);
      } while (next === currentIndex && queue.length > 1);
      setCurrentIndex(next);
      await _loadAndPlay(queue[next]);
      return;
    }
    // normal next
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
    await _loadAndPlay(queue[nextIndex]);
  };

  const playPrev = async () => {
    if (!queue || queue.length === 0) return;
    if (shuffle && queue.length > 1) {
      let prev;
      do {
        prev = Math.floor(Math.random() * queue.length);
      } while (prev === currentIndex && queue.length > 1);
      setCurrentIndex(prev);
      await _loadAndPlay(queue[prev]);
      return;
    }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIndex);
    await _loadAndPlay(queue[prevIndex]);
  };

  const toggleShuffle = () => {
    setShuffle((s) => !s);
  };

  return (
    <PlayerContext.Provider value={{
      queue,
      currentIndex,
      currentTrack,
      isPlaying,
      positionMillis,
      durationMillis,
      shuffle,
      setQueue,
      playAtIndex,
      play,
      pause,
      stop,
      seekTo,
      playNext,
      playPrev,
      toggleShuffle,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}