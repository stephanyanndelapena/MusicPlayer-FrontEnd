import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Button, Alert } from 'react-native';
import api from '../api';

export default function PlaylistsScreen({ navigation }) {
  const [playlists, setPlaylists] = useState([]);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get('/playlists/');
      setPlaylists(res.data);
    } catch (e) {
      console.warn('fetchPlaylists', e);
      Alert.alert('Error', 'Failed to load playlists');
    }
  };

  useEffect(() => {
    fetchPlaylists();
    const unsub = navigation.addListener('focus', fetchPlaylists);
    return () => unsub && unsub();
  }, [navigation]);

  const renderItem = ({ item }) => {
    const firstTrackArtwork = item.tracks && item.tracks.length > 0 ? item.tracks[0].artwork : item.image || null;
    const thumbSource = firstTrackArtwork ? { uri: firstTrackArtwork } : null;

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
          onPress={() => navigation.navigate('PlaylistDetail', { id: item.id })}
        >
          {thumbSource ? (
            <Image source={thumbSource} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.count}>{(item.tracks || []).length} tracks</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.rowButtons}>
          <View style={styles.smallButton}>
            <Button title="Open" onPress={() => navigation.navigate('PlaylistDetail', { id: item.id })} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Playlists</Text>

        <View style={styles.headerButtons}>
          <View style={styles.smallButton}>
            <Button title="Create Playlist" onPress={() => navigation.navigate('PlaylistForm')} />
          </View>

          <View style={styles.smallButton}>
            <Button title="Add Song" onPress={() => navigation.navigate('TrackForm')} />
          </View>
        </View>
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  headerTitle: { fontSize: 20, fontWeight: '600' },

  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  smallButton: { marginLeft: 8 },

  row: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 4, marginRight: 12, backgroundColor: '#333' },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#333',
  },
  title: { fontSize: 16 },
  count: { color: '#666', marginTop: 4 },

  rowButtons: { flexDirection: 'row', alignItems: 'center' },
});