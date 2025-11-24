// src/utils/playCounts.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'play_counts_v1';

// Normalizes artwork urls so they always point to the Django server
function normalizeArtworkUrl(url) {
  if (!url) return null;

  // If already correct, return
  if (url.startsWith('http://127.0.0.1:8000') || url.startsWith('https://127.0.0.1:8000')) {
    return url;
  }

  // Fix common wrong localhost:8081 or :8080 cases
  if (/https?:\/\/(127\.0\.0\.1|localhost):\d+\//.test(url)) {
    return url.replace(/(127\.0\.0\.1|localhost):\d+/, '127.0.0.1:8000');
  }

  // If relative path like /media/artworks/..., prefix with backend base
  if (url.startsWith('/')) {
    return `http://127.0.0.1:8000${url}`;
  }

  return url;
}

export async function incrementPlayCount(track) {
  if (!track || track.id == null) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const id = String(track.id);

    const fixedArtwork = normalizeArtworkUrl(track.artwork);

    const existing = obj[id] || {
      count: 0,
      title: track.title || '',
      artist: track.artist || '',
      artwork: fixedArtwork,
      lastPlayedAt: null,
    };

    existing.count = (existing.count || 0) + 1;
    existing.title = track.title || existing.title;
    existing.artist = track.artist || existing.artist;
    existing.artwork = fixedArtwork || existing.artwork;
    existing.lastPlayedAt = new Date().toISOString();

    obj[id] = existing;
    await AsyncStorage.setItem(KEY, JSON.stringify(obj));
    return existing.count;
  } catch (e) {
    console.warn('incrementPlayCount error', e);
  }
}

export async function getAllPlayCounts() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return Object.entries(obj)
      .map(([id, data]) => ({ id, ...data, artwork: normalizeArtworkUrl(data.artwork) }))
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  } catch (e) {
    console.warn('getAllPlayCounts error', e);
    return [];
  }
}

export async function getMostPlayed() {
  const all = await getAllPlayCounts();
  return all.length ? all[0] : null;
}

export async function clearPlayCounts() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn('clearPlayCounts error', e);
  }
}
