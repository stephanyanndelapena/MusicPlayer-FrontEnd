import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Button, Text, Platform, Alert } from 'react-native';
import api from '../api';

export default function TrackFormScreen({ route, navigation }) {
  const track = route.params?.track;
  const playlistId = route.params?.playlistId;
  const [title, setTitle] = useState(track?.title || '');
  const [artist, setArtist] = useState(track?.artist || '');
  const [audioFile, setAudioFile] = useState(null); // web File
  const [artwork, setArtwork] = useState(null); // web File
  const webAudioRef = useRef(null);
  const webArtworkRef = useRef(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(track?.title || '');
    setArtist(track?.artist || '');
  }, [track]);

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
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setAudioFile(f);
  };
  const onWebArtworkChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setArtwork(f);
  };

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Validation', 'Please enter title'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      // IMPORTANT: field names must match serializer: 'audio_file' and 'artwork'
      if (audioFile) formData.append('audio_file', audioFile, audioFile.name);
      if (artwork) formData.append('artwork', artwork, artwork.name);

      if (track && track.id) {
        // PATCH with FormData — do NOT set Content-Type manually
        await api.patch(`/tracks/${track.id}/`, formData);
      } else {
        const res = await api.post('/tracks/', formData);
        const created = res.data;
        if (playlistId && created && created.id) {
          // attach created track to playlist (use your endpoint if available)
          try {
            await api.post(`/playlists/${playlistId}/add_track/`, { track_id: created.id });
          } catch {
            const pl = await api.get(`/playlists/${playlistId}/`);
            const existingIds = (pl.data.tracks || []).map(t => t.id);
            await api.patch(`/playlists/${playlistId}/`, { track_ids: [...existingIds, created.id] });
          }
        }
      }

      navigation.goBack();
    } catch (err) {
      console.error('save track error', err?.response || err);
      Alert.alert('Save failed', err?.response?.data ? JSON.stringify(err.response.data) : String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={{ borderBottomWidth: 1, marginBottom: 12 }} />
      <Text>Artist</Text>
      <TextInput value={artist} onChangeText={setArtist} style={{ borderBottomWidth: 1, marginBottom: 12 }} />

      <Button title={audioFile ? `Selected: ${audioFile.name}` : 'Pick Audio File'} onPress={pickAudio} />
      {Platform.OS === 'web' && (
        <input ref={webAudioRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={onWebAudioChange} />
      )}

      <View style={{ height: 12 }} />
      <Button title={artwork ? `Selected artwork: ${artwork.name}` : 'Pick Cover Image (optional)'} onPress={pickArtwork} />
      {Platform.OS === 'web' && (
        <input ref={webArtworkRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onWebArtworkChange} />
      )}

      <View style={{ height: 12 }} />
      <Button title={saving ? 'Saving...' : 'Save'} onPress={submit} disabled={saving} />
    </View>
  );
}