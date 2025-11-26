// src/screens/MostPlayedScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { getMostPlayed, getAllPlayCounts, clearPlayCounts } from '../utils/playCounts';
import styles, { colors } from './MostPlayedScreen.styles';

/**
 * MostPlayedScreen - moved controls into the topCard container (bottom-right).
 * Header now matches screen background and has no bottom border/shadow.
 */

export default function MostPlayedScreen({ navigation }) {
  const [top, setTop] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTrackId, setHoveredTrackId] = useState(null);

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
    // set title and make header match screen background; remove bottom border/shadow
    navigation.setOptions({
      title: 'Most Played Track',
      headerStyle: {
        backgroundColor: colors.background || '#121212',
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
        elevation: 0, // Android
        shadowOpacity: 0, // iOS
      },
      headerTintColor: colors.textPrimary || '#fff',
      headerTitleStyle: { color: colors.textPrimary || '#fff' },
    });

    load();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!top) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No plays recorded yet.</Text>
        <View style={styles.spacer12} />
        <View style={styles.centeredControls}>
          <Pressable onPress={load} style={({ pressed }) => [styles.refreshButton, pressed && styles.controlPressed]} accessibilityLabel="Refresh">
            <Text style={styles.refreshIcon}>⟳</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await clearPlayCounts();
              await load();
            }}
            style={({ pressed }) => [styles.clearButton, pressed && styles.controlPressed]}
            accessibilityLabel="Clear"
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function RemoteImage({ uri, style, placeholderStyle, resizeMode = 'cover' }) {
    const [errored, setErrored] = useState(false);
    const safeUri = uri || null;

    React.useEffect(() => {
      setErrored(false);
    }, [uri]);

    if (!safeUri || errored) {
      return <View style={[styles.thumbPlaceholder, placeholderStyle]} />;
    }

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

  const renderItem = ({ item }) => {
    const id = item?.id ?? String(item?.title ?? Math.random());
    const isHovered = hoveredTrackId === id;

    return (
      <Pressable
        onHoverIn={() => setHoveredTrackId(id)}
        onHoverOut={() => setHoveredTrackId(null)}
        onPress={() => {}}
        style={({ pressed }) => [
          styles.row,
          (isHovered || pressed) ? styles.rowHover : null,
        ]}
        accessibilityRole="button"
      >
        <RemoteImage uri={item.artwork} style={styles.thumb} placeholderStyle={styles.thumbPlaceholder} />
        <View style={styles.rowText}>
          <Text style={styles.title}>{item.title || '(unknown)'}</Text>
          <Text style={styles.subtitle}>{item.artist || ''}</Text>
          <Text style={styles.count}>Plays: {item.count || 0}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Top Track</Text>

      <View style={styles.topCard}>
        <RemoteImage uri={top.artwork} style={styles.topArt} placeholderStyle={styles.topArtPlaceholder} resizeMode="cover" />
        <Text style={styles.topTitle}>{top.title || '(unknown)'}</Text>
        <Text style={styles.topArtist}>{top.artist || ''}</Text>
        <Text style={styles.topCount}>Plays: {top.count || 0}</Text>

        {/* Controls placed inside topCard at bottom-right */}
        <View style={styles.topCardControls} pointerEvents="box-none">
          <Pressable onPress={load} style={({ pressed }) => [styles.topIconButton, pressed && styles.controlPressed]} accessibilityLabel="Refresh">
            <Text style={styles.topIcon}>⟳</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await clearPlayCounts();
              await load();
            }}
            style={({ pressed }) => [styles.topClearButton, pressed && styles.controlPressed]}
            accessibilityLabel="Clear"
          >
            <Text style={styles.topClearText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.spacer12} />

      <Text style={styles.heading}>Other Tracks</Text>
      <FlatList
        data={all}
        keyExtractor={(i, idx) => String(i?.id ?? idx)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}