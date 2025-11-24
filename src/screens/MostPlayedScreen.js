// src/screens/MostPlayedScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Button, FlatList, ActivityIndicator } from 'react-native';
import api from '../api';
import { getMostPlayed, getAllPlayCounts, clearPlayCounts } from '../utils/playCounts';

/**
 * MostPlayedScreen - robust image handling plus logging.
 * Expects playCounts to store artwork as absolute URL (playCounts normalizes this).
 */

export default function MostPlayedScreen({ navigation }) {
  const [top, setTop] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const t = await getMostPlayed();
      const a = await getAllPlayCounts();
      setTop(t);
      setAll(a);
    } catch (err) {
      console.warn('MostPlayed load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: 'Most Played' });
    load();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!top) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No plays recorded yet.</Text>
        <View style={{ height: 12 }} />
        <Button title="Refresh" onPress={load} />
      </View>
    );
  }

  function RemoteImage({ uri, style, placeholderStyle, resizeMode = 'cover' }) {
    const [errored, setErrored] = useState(false);
    const safeUri = uri || null;

    useEffect(() => {
      setErrored(false);
    }, [uri]);

    if (!safeUri) {
      return <View style={[styles.thumbPlaceholder, placeholderStyle]} />;
    }

    // log so you can inspect the console's network tab
    console.log('[RemoteImage] loading:', safeUri);

    return (
      <Image
        source={{ uri: safeUri }}
        style={style}
        resizeMode={resizeMode}
        onError={(e) => {
          console.warn('[RemoteImage] onError', e.nativeEvent, safeUri);
          setErrored(true);
        }}
      />
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <RemoteImage uri={item.artwork} style={styles.thumb} placeholderStyle={styles.thumbPlaceholder} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title || '(unknown)'}</Text>
        <Text style={styles.subtitle}>{item.artist || ''}</Text>
        <Text style={styles.count}>Plays: {item.count || 0}</Text>
      </View>
      <View style={{ width: 8 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Top Track</Text>
      <View style={styles.topCard}>
        <RemoteImage uri={top.artwork} style={styles.topArt} placeholderStyle={styles.topArtPlaceholder} resizeMode="cover" />
        <Text style={styles.topTitle}>{top.title || '(unknown)'}</Text>
        <Text style={styles.topArtist}>{top.artist || ''}</Text>
        <Text style={styles.topCount}>Plays: {top.count || 0}</Text>
      </View>

      <View style={{ height: 12 }} />

      <Text style={styles.heading}>Other Tracks</Text>
      <FlatList
        data={all}
        keyExtractor={(i, idx) => String(i?.id ?? idx)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />}
      />

      <View style={{ height: 12 }} />
      <Button title="Refresh" onPress={load} />
      <View style={{ height: 8 }} />
      <Button title="Clear Counts" onPress={async () => { await clearPlayCounts(); await load(); }} color="#d9534f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  topCard: { alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: '#fafafa' },
  topArt: { width: 200, height: 200, borderRadius: 8, backgroundColor: '#ccc' },
  topArtPlaceholder: { width: 200, height: 200, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#eee' },
  topTitle: { marginTop: 12, fontSize: 20, fontWeight: '700' },
  topArtist: { marginTop: 4, color: '#666' },
  topCount: { marginTop: 6, fontSize: 14, color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  thumb: { width: 56, height: 56, borderRadius: 4, marginRight: 12 },
  thumbPlaceholder: { width: 56, height: 56, borderRadius: 4, marginRight: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16 },
  subtitle: { color: '#666' },
  count: { marginTop: 6, fontSize: 12, color: '#333' },
  message: { fontSize: 16, color: '#666' },
});
