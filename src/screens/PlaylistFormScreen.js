import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import api from '../api';

export default function PlaylistFormScreen({ route, navigation }) {
  // If route.params.playlist exists, we're editing
  const playlist = route.params?.playlist;
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: playlist ? 'Edit Playlist' : 'Create Playlist',
    });
  }, [navigation, playlist]);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a playlist name');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), description };
      let res;
      if (playlist && playlist.id) {
        // PATCH existing playlist
        res = await api.patch(`/playlists/${playlist.id}/`, payload);
      } else {
        // POST new playlist
        res = await api.post('/playlists/', payload);
      }

      // go back and trigger refresh where appropriate
      // send a flag so the previous screen can refresh if it wants
      navigation.goBack();
    } catch (err) {
      console.error('Playlist save error', err?.response || err.message || err);
      Alert.alert(
        'Save failed',
        err?.response?.data ? JSON.stringify(err.response.data) : String(err?.message || 'Unknown error')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ marginBottom: 6 }}>Playlist name</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />

      <Text style={{ marginBottom: 6 }}>Description</Text>
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />

      <Button title={saving ? 'Saving...' : 'Save'} onPress={submit} disabled={saving} />
    </View>
  );
}