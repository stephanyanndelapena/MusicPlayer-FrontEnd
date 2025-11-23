import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, Text, Platform, Alert } from 'react-native';
import api from '../api';

/**
 * TrackFormScreen - web-friendly
 * - If route.params.track is passed, this screen edits the existing track via PATCH /tracks/{id}/
 * - If no track is passed, it creates a new track via POST /tracks/
 * - Uses a hidden <input type="file"> on web to pick the real File object.
 * - On native, prompt to install expo-document-picker if you need native picking.
 */

export default function TrackFormScreen({ route, navigation }) {
  const track = route.params?.track;
  const playlistId = route.params?.playlistId;
  const [title, setTitle] = useState(track?.title || '');
  const [artist, setArtist] = useState(track?.artist || '');
  const [file, setFile] = useState(null); // { webFile, name, uri }
  const webInputRef = useRef(null);

  useEffect(() => {
    // if editing, pre-fill fields (file not prefilled)
    setTitle(track?.title || '');
    setArtist(track?.artist || '');
  }, [track]);

  const pickFile = () => {
    if (Platform.OS === 'web') {
      webInputRef.current && webInputRef.current.click();
    } else {
      Alert.alert('Native picker', 'Install expo-document-picker for native file picking and restart the app.');
    }
  };

  const onWebFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile({ webFile: f, name: f.name, uri: URL.createObjectURL(f) });
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a title');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);

      // If file selected, append it; for edits file is optional (keeps old audio if omitted)
      if (file && file.webFile) {
        formData.append('audio_file', file.webFile, file.name);
      }

      let res;
      if (track && track.id) {
        // PATCH existing track - allow multipart PATCH
        res = await api.patch(`/tracks/${track.id}/`, formData);
      } else {
        // create new track
        res = await api.post('/tracks/', formData);
      }

      const createdOrUpdated = res.data;

      // If we created a new track and playlistId is provided, append it
      if (!track && playlistId) {
        try {
          await api.post(`/playlists/${playlistId}/add_track/`, { track_id: createdOrUpdated.id });
        } catch (err) {
          // fallback: merge ids and patch
          const pl = await api.get(`/playlists/${playlistId}/`);
          const existingIds = (pl.data.tracks || []).map(t => t.id);
          await api.patch(`/playlists/${playlistId}/`, { track_ids: [...existingIds, createdOrUpdated.id] });
        }
      }

      navigation.goBack();
    } catch (err) {
      console.error('save track error', err?.response || err.message || err);
      Alert.alert('Save failed', err?.response?.data ? JSON.stringify(err.response.data) : String(err.message || err));
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>{track ? 'Edit Track' : 'New Track'}</Text>

      <Text>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={{ borderBottomWidth: 1, marginBottom: 12 }} />

      <Text>Artist</Text>
      <TextInput value={artist} onChangeText={setArtist} style={{ borderBottomWidth: 1, marginBottom: 12 }} />

      <Button title={file ? `Selected: ${file.name}` : (track ? 'Replace Audio File (optional)' : 'Pick Audio File')} onPress={pickFile} />

      {Platform.OS === 'web' && (
        <input
          ref={webInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={onWebFileChange}
        />
      )}

      <View style={{ height: 12 }} />
      <Button title="Save" onPress={submit} />
    </View>
  );
}