import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import api from '../api';
import styles, { colors } from './PlaylistFormScreen.styles';

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

  // Make header match the screen body and remove bottom border/shadow
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background || '#121212',
        borderBottomWidth: 0,
        elevation: 0, // Android - remove shadow
        shadowOpacity: 0, // iOS - remove shadow
      },
      headerTintColor: colors.textPrimary || '#fff',
      headerTitleStyle: { color: colors.textPrimary || '#fff' },
    });
  }, [navigation]);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a playlist name');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), description };
      if (playlist && playlist.id) {
        // PATCH existing playlist
        await api.patch(`/playlists/${playlist.id}/`, payload);
      } else {
        // POST new playlist
        await api.post('/playlists/', payload);
      }

      // go back and trigger refresh where appropriate
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 88, android: 0 })}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Playlist name</Text>
        <TextInput
          placeholder="Name"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          style={styles.input}
          returnKeyType="next"
          accessibilityLabel="Playlist name"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Description"
          placeholderTextColor={colors.placeholder}
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          accessibilityLabel="Playlist description"
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, saving ? styles.buttonDisabled : null]}
            onPress={submit}
            activeOpacity={0.8}
            disabled={saving}
            accessibilityLabel="Save playlist"
          >
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}