import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TouchableOpacity, TextInput } from 'react-native';
import api from '../api';

export default function PlaylistsScreen({ navigation }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await api.get('/playlists/');
      // res.data is expected to be a list
      setPlaylists(res.data);
    } catch (err) {
      console.warn('fetchPlaylists error', err?.response?.data || err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const submitCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a name');
      return;
    }
    setCreating(true);
    try {
      await api.post('/playlists/', { name: name.trim(), description });
      setName('');
      setDescription('');
      await fetchPlaylists();
    } catch (err) {
      console.warn('create playlist error', err?.response?.data || err.message || err);
      alert('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    const unsubscribe = navigation.addListener('focus', fetchPlaylists);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 8 }}>Playlists</Text>

      <View style={{ marginBottom: 12 }}>
        <TextInput placeholder="Playlist name" value={name} onChangeText={setName} style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
        <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
        <Button title={creating ? 'Creating...' : 'Create Playlist'} onPress={submitCreate} disabled={creating} />
      </View>

      <Button title="Refresh" onPress={fetchPlaylists} />

      {loading ? <Text>Loading...</Text> :
        <FlatList
          data={playlists}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('PlaylistDetail', { id: item.id, name: item.name })}>
              <View style={{ padding: 12, borderBottomWidth: 1 }}>
                <Text style={{ fontSize: 18 }}>{item.name}</Text>
                <Text>{item.description}</Text>
                <Text>{item.tracks ? `${item.tracks.length} tracks` : '0 tracks'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>No playlists</Text>}
        />
      }
    </View>
  );
}