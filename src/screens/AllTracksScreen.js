import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';
import styles, { colors } from './PlaylistsScreen.styles';
import { SvgXml } from 'react-native-svg';

const BOOTSTRAP_ICONS_BASE = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons';
const SEARCH_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/search.svg`;
const PENCIL_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/pencil.svg`;
const svgCache = {};

function RemoteSvgIcon({ uri, color = '#fff', width = 16, height = 16, style }) {
  const [svgText, setSvgText] = useState(null);

  useEffect(() => {
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
      .catch(() => { });
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

function resolveArtworkUrl(artwork) {
  if (!artwork) return null;
  if (artwork.startsWith('http://') || artwork.startsWith('https://')) return artwork;
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const path = artwork.startsWith('/') ? artwork : `/${artwork}`;
    return `${window.location.origin}${path}`;
  }
  const path = artwork.startsWith('/') ? artwork : `/${artwork}`;
  return `http://127.0.0.1:8000${path}`;
}

const Artwork = React.memo(function Artwork({ artwork, imageStyle, placeholderStyle }) {
  const uri = useMemo(() => (artwork ? resolveArtworkUrl(artwork) : null), [artwork]);
  const source = useMemo(() => (uri ? { uri } : null), [uri]);

  if (!source) {
    return <View style={placeholderStyle || styles.trackThumbPlaceholder} />;
  }

  return <Image source={source} style={imageStyle || styles.trackThumb} />;
});

function TrackRow({ item, index, onPlay, onAddToPlaylist, onEdit }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPlay}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.trackRow, hovered || pressed ? styles.trackRowHover : null]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title || item.name || 'track'}`}
    >
      <Artwork
        artwork={item.artwork || item.image || (item.tracks && item.tracks[0] && item.tracks[0].artwork)}
        imageStyle={styles.trackThumb}
        placeholderStyle={styles.trackThumbPlaceholder}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.title ?? item.name ?? 'Untitled'}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist ?? item.author ?? ''}
        </Text>
      </View>

      <View style={styles.recentButtons}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation && e.stopPropagation();
            onAddToPlaylist && onAddToPlaylist(item);
          }}
          style={[styles.addButton, { marginRight: 8 }]}
          accessibilityLabel="Add to playlist"
        >
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation && e.stopPropagation();
            if (typeof onEdit === 'function') onEdit(item);
          }}
          style={[styles.editButton]}
          accessibilityLabel="Edit track details"
        >
          <RemoteSvgIcon uri={PENCIL_SVG_URL} color="#fff" width={18} height={18} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

function OutlinedButton({ title, onPress, style, textStyle, color = colors.accent, accessibilityLabel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => {
        const filled = pressed || hovered;
        return [
          styles.outlinedButton,
          { borderColor: color },
          filled ? { backgroundColor: color } : { backgroundColor: 'transparent' },
          style,
        ];
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {({ pressed }) => {
        const filled = pressed || hovered;
        return (
          <Text style={[styles.outlinedButtonText, textStyle, filled ? styles.outlinedButtonTextFilled : null]}>
            {title}
          </Text>
        );
      }}
    </Pressable>
  );
}

export default function AllTracksScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: 'rgba(20, 20, 20, 1)0',
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#fff',
      headerTitleStyle: { color: '#fff' },
    });
  }, [navigation]);

  const player = usePlayer ? usePlayer() : null;
  const playFn = player && typeof player.play === 'function' ? player.play : null;

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('recent');

  const [playlists, setPlaylists] = useState([]);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editArtwork, setEditArtwork] = useState('');
  const [selectedArtworkFile, setSelectedArtworkFile] = useState(null);
  const [webArtworkFile, setWebArtworkFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const webArtworkRef = useRef(null);

  const reloadTracks = useCallback(async () => {
    try {
      if (api && typeof api.get === 'function') {
        const r = await api.get('tracks/');
        setTracks(r?.data || []);
      } else {
        const r = await fetch('http://127.0.0.1:8000/tracks/');
        if (!r.ok) return;
        const json = await r.json();
        setTracks(json || []);
      }
    } catch (err) {
      console.warn('reloadTracks error', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (api && typeof api.get === 'function') {
          const res = await api.get('tracks/');
          if (!mounted) return;
          setTracks(res?.data || []);
        } else {
          const res = await fetch('http://127.0.0.1:8000/tracks/');
          const json = await res.json();
          if (!mounted) return;
          setTracks(json || []);
        }
      } catch (err) {
        Alert.alert('Error', 'Could not load tracks. See Metro/console for details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get('playlists/');
      setPlaylists(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load playlists');
    }
  };

  const openAddToPlaylistModal = async (track) => {
    setSelectedTrackToAdd(track);
    if (playlists.length === 0) {
      setPlaylistsLoading(true);
      try {
        await fetchPlaylists();
      } finally {
        setPlaylistsLoading(false);
      }
    }
    setPlaylistModalVisible(true);
  };

  const attachTrackToPlaylist = async (playlist) => {
    if (!selectedTrackToAdd) return;
    try {
      const existing = (playlist.tracks || []).map((t) => t.id);
      if (existing.includes(selectedTrackToAdd.id)) {
        Alert.alert('Already added', `"${selectedTrackToAdd.title}" is already in "${playlist.name}"`);
        setPlaylistModalVisible(false);
        setSelectedTrackToAdd(null);
        return;
      }
      existing.push(selectedTrackToAdd.id);
      await api.patch(`/playlists/${playlist.id}/`, { track_ids: existing });
      await Promise.all([fetchPlaylists(), reloadTracks()]);
      Alert.alert('Added', `"${selectedTrackToAdd.title}" was added to "${playlist.name}"`);
    } catch (err) {
      Alert.alert('Error', 'Failed to add to playlist');
    } finally {
      setPlaylistModalVisible(false);
      setSelectedTrackToAdd(null);
    }
  };

  const queryLower = (searchQuery || '').trim().toLowerCase();
  const filteredTracks = useMemo(() => {
    const base = (tracks || []).filter((t) => {
      if (!queryLower) return true;
      const title = (t.title || '').toLowerCase();
      const artist = (t.artist || '').toLowerCase();
      return title.includes(queryLower) || artist.includes(queryLower);
    });

    const sorted = [...base];
    if (trackFilter === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (trackFilter === 'artist') {
      sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    } else {
      sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return sorted;
  }, [tracks, queryLower, trackFilter]);

  const handlePlay = useCallback(
    async (item, index) => {
      try {
        if (playFn) {
          await playFn(item, { queue: filteredTracks, index });
          navigation.navigate('NowPlaying');
        } else {
          navigation.navigate('NowPlaying', { track: item, queue: filteredTracks, index });
        }
      } catch (err) {
        Alert.alert('Play error', 'Unable to play this song. Check console for details.');
      }
    },
    [playFn, filteredTracks, navigation]
  );

  const openEditModal = useCallback((track) => {
    setEditingTrack(track);
    setEditTitle(track.title ?? track.name ?? '');
    setEditArtist(track.artist ?? track.author ?? '');
    setEditArtwork(track.artwork ?? track.image ?? '');
    setPreviewUrl(track.artwork && typeof track.artwork === 'string' ? resolveArtworkUrl(track.artwork) : null);
    setSelectedArtworkFile(null);
    setWebArtworkFile(null);
    setEditModalVisible(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalVisible(false);
    setEditingTrack(null);
    setEditTitle('');
    setEditArtist('');
    setEditArtwork('');
    setSelectedArtworkFile(null);
    setWebArtworkFile(null);
    if (previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) { }
    }
    setPreviewUrl(null);
    setSavingEdit(false);
  }, [previewUrl]);

  const pickFile = useCallback(async (type) => {
    try {
      const DP = require('react-native-document-picker');
      const DocumentPicker = DP.default || DP;
      const pickType =
        type === 'image'
          ? [DocumentPicker.types.images || 'image/*']
          : [DocumentPicker.types.audio || 'audio/*'];
      const res = await DocumentPicker.pickSingle({ type: pickType });
      if (!res) return null;
      const file = { uri: res.uri, name: res.name || (res.uri.split('/').pop() || 'file'), type: res.type || (type === 'image' ? 'image/jpeg' : 'audio/mpeg') };
      return file;
    } catch (err) {
      if (err && err.code === 'DOCUMENT_PICKER_CANCELED') return null;
      Alert.alert(
        'Pick file',
        'File picker not available or failed. Install react-native-document-picker and rebuild the app to enable selecting files, or use the web file input if on web.'
      );
      return null;
    }
  }, []);

  const pickArtwork = useCallback(async () => {
    if (Platform.OS === 'web') {
      webArtworkRef.current && webArtworkRef.current.click();
      return;
    }
    const f = await pickFile('image');
    if (f) {
      setSelectedArtworkFile(f);
      setEditArtwork(f.uri);
      if (Platform.OS === 'web' && f.uri) {
        setPreviewUrl(f.uri);
      }
    }
  }, [pickFile]);

  const onWebArtworkChange = (e) => {
    const f = e?.target?.files && e.target.files[0];
    if (!f) return;
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (err) { }
    }
    setWebArtworkFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setEditArtwork(url);
  };

  const saveEdit = useCallback(async () => {
    if (!editingTrack) {
      Alert.alert('Error', 'No track selected');
      return;
    }
    if (savingEdit) return;
    Keyboard.dismiss();
    setSavingEdit(true);

    const id = editingTrack.id ?? editingTrack._id;
    if (!id) {
      Alert.alert('Error', 'Track has no id');
      setSavingEdit(false);
      return;
    }

    try {
      const url = `/tracks/${id}/`;
      const hasNativeFile = selectedArtworkFile;
      const hasWebFile = webArtworkFile;
      const hasFiles = hasNativeFile || hasWebFile;

      if (hasFiles) {
        const form = new FormData();
        form.append('title', editTitle);
        form.append('artist', editArtist || '');

        if (webArtworkFile) {
          form.append('artwork', webArtworkFile);
        } else if (selectedArtworkFile) {
          form.append('artwork', {
            uri: selectedArtworkFile.uri,
            name: selectedArtworkFile.name || 'cover.jpg',
            type: selectedArtworkFile.type || 'image/jpeg',
          });
        } else if (editArtwork && editArtwork.startsWith('http')) {
          form.append('artwork', editArtwork);
        }

        try {
          if (api && typeof api.patch === 'function') {
            const res = await api.patch(url, form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            const updated = res?.data ?? res;
            if (updated) {
              const updatedId = updated?.id ?? updated?._id ?? id;
              setTracks((prev) =>
                prev.map((t) => {
                  const tId = t.id ?? t._id;
                  return tId === updatedId ? { ...t, ...updated } : t;
                })
              );
            } else {
              await reloadTracks();
            }
            Alert.alert('Saved', 'Track updated');
            closeEditModal();
            return;
          }
        } catch (err) { }

        const absoluteUrl = api?.defaults?.baseURL ? `${api.defaults.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : `http://127.0.0.1:8000/${url.replace(/^\//, '')}`;
        const resp = await fetch(absoluteUrl, {
          method: 'PATCH',
          body: form,
        });

        if (!resp.ok) {
          const body = await resp.text().catch(() => '');
          throw new Error(`Server ${resp.status}: ${body || resp.statusText}`);
        }

        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const updated = await resp.json();
          const updatedId = updated?.id ?? updated?._id ?? id;
          setTracks((prev) =>
            prev.map((t) => {
              const tId = t.id ?? t._id;
              return tId === updatedId ? { ...t, ...updated } : t;
            })
          );
        } else {
          await reloadTracks();
        }
        Alert.alert('Saved', 'Track updated');
        closeEditModal();
        return;
      }

      const payload = {
        title: editTitle,
        artist: editArtist || '',
        ...(editArtwork && editArtwork.startsWith('http') ? { artwork: editArtwork } : {}),
      };

      try {
        if (api && typeof api.patch === 'function') {
          const res = await api.patch(url, payload);
          const updated = res?.data ?? res;
          if (updated) {
            const updatedId = updated?.id ?? updated?._id ?? id;
            setTracks((prev) =>
              prev.map((t) => {
                const tId = t.id ?? t._id;
                return tId === updatedId ? { ...t, ...updated } : t;
              })
            );
          } else {
            await reloadTracks();
          }
          Alert.alert('Saved', 'Track updated');
          closeEditModal();
          return;
        }
      } catch (err) { }

      const absoluteUrl2 = api?.defaults?.baseURL ? `${api.defaults.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : `http://127.0.0.1:8000/${url.replace(/^\//, '')}`;
      const resp2 = await fetch(absoluteUrl2, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp2.ok) {
        let errBody = null;
        try {
          errBody = await resp2.json();
        } catch (e) {
          errBody = await resp2.text().catch(() => null);
        }
        throw new Error(`Server ${resp2.status}: ${JSON.stringify(errBody)}`);
      }
      const contentType2 = resp2.headers.get('content-type') || '';
      if (contentType2.includes('application/json')) {
        const updated = await resp2.json();
        const updatedId = updated?.id ?? updated?._id ?? id;
        setTracks((prev) =>
          prev.map((t) => {
            const tId = t.id ?? t._id;
            return tId === updatedId ? { ...t, ...updated } : t;
          })
        );
      } else {
        await reloadTracks();
      }
      Alert.alert('Saved', 'Track updated');
      closeEditModal();
    } catch (err) {
      console.error('saveEdit error', err);
      Alert.alert('Save failed', err?.message || 'Unknown error. Check console/network.');
    } finally {
      setSavingEdit(false);
    }
  }, [
    editingTrack,
    editTitle,
    editArtist,
    editArtwork,
    selectedArtworkFile,
    webArtworkFile,
    savingEdit,
    reloadTracks,
    closeEditModal,
  ]);

  const renderItem = ({ item, index }) => (
    <TrackRow
      item={item}
      index={index}
      onPlay={() => handlePlay(item, index)}
      onAddToPlaylist={openAddToPlaylistModal}
      onEdit={openEditModal}
    />
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>All Tracks</Text>
          <Text style={[styles.headerSubtitle, { color: '#fff' }]}>{filteredTracks.length} songs</Text>
        </View>

        <View style={{ width: 220 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 8 }}>
            <RemoteSvgIcon uri={SEARCH_SVG_URL} color="#888" width={16} height={16} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search tracks"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, color: '#fff', paddingVertical: 8 }}
              returnKeyType="search"
              accessible={true}
              accessibilityLabel="Search tracks"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 6 }} accessibilityLabel="Clear search">
                <Text style={{ color: '#fff' }}>✖</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        {[
          { key: 'recent', label: 'Recently added' },
          { key: 'title', label: 'Title A–Z' },
          { key: 'artist', label: 'Artist A–Z' },
        ].map((opt) => {
          const selected = trackFilter === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setTrackFilter(opt.key)}
              style={({ pressed }) => [
                {
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  marginRight: 8,
                  backgroundColor: selected ? colors.accent : pressed ? '#333' : 'transparent',
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={{ color: selected ? '#000' : '#ccc', fontSize: 13 }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {filteredTracks.length === 0 ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={styles.emptyText}>{queryLower ? 'No songs match your search.' : 'No songs found.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTracks}
          keyExtractor={(t) => String(t.id ?? t._id ?? t.name ?? Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <Modal visible={playlistModalVisible} animationType="slide" transparent={true} onRequestClose={() => { setPlaylistModalVisible(false); setSelectedTrackToAdd(null); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add "{selectedTrackToAdd?.title}" to playlist</Text>

            {playlistsLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.playlistOption} onPress={() => attachTrackToPlaylist(item)} activeOpacity={0.7}>
                    <Text style={styles.playlistOptionText}>
                      {item.name} <Text style={styles.playlistOptionCount}>({(item.tracks || []).length})</Text>
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}

            <View style={{ marginTop: 12 }}>
              <OutlinedButton title="Cancel" onPress={() => { setPlaylistModalVisible(false); setSelectedTrackToAdd(null); }} color={colors.accent} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={closeEditModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: colors.surface || '#111', borderRadius: 8, padding: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Edit Track</Text>

            <Text style={{ color: '#ccc', marginBottom: 4 }}>Title</Text>
            <TextInput
              placeholder="Title"
              placeholderTextColor="#888"
              value={editTitle}
              onChangeText={setEditTitle}
              style={{ color: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 8 }}
            />

            <Text style={{ color: '#ccc', marginBottom: 4 }}>Artist</Text>
            <TextInput
              placeholder="Artist"
              placeholderTextColor="#888"
              value={editArtist}
              onChangeText={setEditArtist}
              style={{ color: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 12 }}
            />

            {previewUrl ? (
              Platform.OS === 'web' ? (
                <div style={{ marginBottom: 12 }}>
                  <img src={previewUrl} alt="Artwork preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }} />
                </div>
              ) : (
                <Image source={{ uri: previewUrl }} style={{ width: 140, height: 140, borderRadius: 6, marginBottom: 12 }} />
              )
            ) : null}

            <TouchableOpacity
              onPress={pickArtwork}
              style={{ backgroundColor: '#222', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff' }}>{selectedArtworkFile ? `Cover: ${selectedArtworkFile.name}` : (webArtworkFile ? `Cover: ${webArtworkFile.name}` : 'Upload Cover Image')}</Text>
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <input ref={webArtworkRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onWebArtworkChange} />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Pressable
                onPress={closeEditModal}
                style={({ pressed }) => [{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, borderRadius: 6, backgroundColor: pressed ? '#333' : 'transparent' }]}
              >
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={saveEdit}
                disabled={savingEdit}
                style={({ pressed }) => [
                  { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: colors.accent, opacity: savingEdit ? 0.7 : 1 },
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={{ color: '#000' }}>{savingEdit ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}