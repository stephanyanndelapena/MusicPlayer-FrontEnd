import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Platform,
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from 'react-native';
import api from '../api';
import styles, { colors } from './TrackFormScreen.styles';

export default function TrackFormScreen({ route, navigation }) {
  const track = route.params?.track;
  const playlistId = route.params?.playlistId;

  const [title, setTitle] = useState(track?.title || '');
  const [artist, setArtist] = useState(track?.artist || '');
  const [audioFile, setAudioFile] = useState(null);
  const [artwork, setArtwork] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const webAudioRef = useRef(null);
  const webArtworkRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [pickAudioHovered, setPickAudioHovered] = useState(false);
  const [pickArtworkHovered, setPickArtworkHovered] = useState(false);
  const [saveHovered, setSaveHovered] = useState(false);

  useEffect(() => {
    setTitle(track?.title || '');
    setArtist(track?.artist || '');
    if (track?.artwork) {
      setPreviewUrl(makeFullUrl(track.artwork));
    }
  }, [track]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Add a Song',
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
  
  useEffect(() => {
    return () => {
      if (previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [previewUrl]);

  const pickAudio = () => {
    if (Platform.OS === 'web') {
      webAudioRef.current && webAudioRef.current.click();
    } else {
      Alert.alert('Native picker', 'Install expo-document-picker for native audio picking.');
    }
  };

  const pickArtwork = () => {
    if (Platform.OS === 'web') {
      webArtworkRef.current && webArtworkRef.current.click();
    } else {
      Alert.alert('Native picker', 'Install expo-image-picker for native artwork uploads.');
    }
  };

  const onWebAudioChange = (e) => {
    const f = e?.target?.files && e.target.files[0];
    if (!f) return;
    setAudioFile(f);
  };

  const onWebArtworkChange = (e) => {
    const f = e?.target?.files && e.target.files[0];
    if (!f) return;
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (err) {}
    }
    setArtwork(f);
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  };

  const makeFullUrl = (maybePath) => {
    if (!maybePath) return null;
    if (maybePath.startsWith('http://') || maybePath.startsWith('https://')) return maybePath;
    const base = api?.defaults?.baseURL ? api.defaults.baseURL.replace(/\/$/, '') : '';
    const path = maybePath.startsWith('/') ? maybePath : `/${maybePath}`;
    return base ? `${base}${path}` : path;
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter title');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);

      if (audioFile) formData.append('audio_file', audioFile, audioFile.name);
      if (artwork) formData.append('artwork', artwork, artwork.name || 'artwork.jpg');

      if (track && track.id) {
        await api.patch(`/tracks/${track.id}/`, formData);
      } else {
        const res = await api.post('/tracks/', formData);
        const created = res.data;
        if (playlistId && created && created.id) {
          try {
            await api.post(`/playlists/${playlistId}/add_track/`, { track_id: created.id });
          } catch {
            const pl = await api.get(`/playlists/${playlistId}/`);
            const existingIds = (pl.data.tracks || []).map((t) => t.id);
            await api.patch(`/playlists/${playlistId}/`, { track_ids: [...existingIds, created.id] });
          }
        }
      }

      navigation.goBack();
    } catch (err) {
      console.error('save track error', err?.response || err);
      Alert.alert(
        'Save failed',
        err?.response?.data ? JSON.stringify(err.response.data) : String(err?.message || err)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 88, android: 0 })}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Track title"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Track title"
        />

        <Text style={styles.label}>Artist</Text>
        <TextInput
          value={artist}
          onChangeText={setArtist}
          style={styles.input}
          placeholder="Artist name"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Artist name"
        />

        {previewUrl ? (
          Platform.OS === 'web' ? (
            <div style={{ marginBottom: 12 }}>
              <img
                src={previewUrl}
                alt="Artwork preview"
                style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 8 }}
              />
            </div>
          ) : (
            <Image source={{ uri: previewUrl }} style={styles.previewImage} />
          )
        ) : (
          <View style={{ height: 12 }} />
        )}

        <Pressable
          onPress={pickAudio}
          onHoverIn={() => setPickAudioHovered(true)}
          onHoverOut={() => setPickAudioHovered(false)}
          onPressIn={() => setPickAudioHovered(true)}
          onPressOut={() => setPickAudioHovered(false)}
          style={({ pressed }) => [
            styles.pickButton,
            (pickAudioHovered || pressed) ? styles.pickButtonHover : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Pick audio file"
        >
          <Text style={styles.pickButtonText}>
            {audioFile ? `Selected: ${audioFile.name}` : 'Upload Audio File'}
          </Text>
        </Pressable>
        {Platform.OS === 'web' && (
          <input ref={webAudioRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={onWebAudioChange} />
        )}

        <View style={{ height: 12 }} />

        <Pressable
          onPress={pickArtwork}
          onHoverIn={() => setPickArtworkHovered(true)}
          onHoverOut={() => setPickArtworkHovered(false)}
          onPressIn={() => setPickArtworkHovered(true)}
          onPressOut={() => setPickArtworkHovered(false)}
          style={({ pressed }) => [
            styles.pickButton,
            (pickArtworkHovered || pressed) ? styles.pickButtonHover : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Pick artwork"
        >
          <Text style={styles.pickButtonText}>
            {artwork ? `Selected artwork: ${artwork.name}` : 'Upload Cover Image'}
          </Text>
        </Pressable>
        {Platform.OS === 'web' && (
          <input ref={webArtworkRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onWebArtworkChange} />
        )}

        <View style={{ height: 12 }} />

        <Pressable
          onPress={submit}
          disabled={saving}
          onHoverIn={() => setSaveHovered(true)}
          onHoverOut={() => setSaveHovered(false)}
          onPressIn={() => setSaveHovered(true)}
          onPressOut={() => setSaveHovered(false)}
          style={({ pressed }) => [
            styles.saveButton,
            saving ? styles.saveButtonDisabled : null,
            (saveHovered || pressed) && !saving ? styles.saveButtonHover : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save track"
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}