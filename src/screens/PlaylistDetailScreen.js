import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Image,
  Pressable,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';
import styles, { colors } from './PlaylistDetailScreen.styles';
import { SvgXml } from 'react-native-svg';

const svgCache = {};
function RemoteSvgIcon({ uri, color = '#fff', width = 18, height = 18, style }) {
  const [svgText, setSvgText] = React.useState(null);

  React.useEffect(() => {
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
      .catch((err) => {
        console.warn('Failed to load SVG', uri, err);
      });
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

const BOOTSTRAP_ICONS_BASE = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons';
const SEARCH_SVG_URL = `${BOOTSTRAP_ICONS_BASE}/search.svg`;

export default function PlaylistDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [removingTrackId, setRemovingTrackId] = useState(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedForMenu, setSelectedForMenu] = useState(null);

  const [hoverEdit, setHoverEdit] = useState(false);
  const [hoverAdd, setHoverAdd] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [hoverDelete, setHoverDelete] = useState(false);

  const [hoveredTrackId, setHoveredTrackId] = useState(null);

  const { currentTrack, isPlaying, play, pause } = usePlayer();

  const fetchPlaylist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/playlists/${id}/`);
      setPlaylist(res.data);
    } catch (err) {
      console.warn('fetchPlaylist error', err?.response || err?.message || err);
      Alert.alert('Error', 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
    const unsubscribe = navigation.addListener('focus', fetchPlaylist);
    return () => unsubscribe && unsubscribe();
  }, [fetchPlaylist, navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Playlist',
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

  const tracks = Array.isArray(playlist?.tracks) ? playlist.tracks : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('recent');
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

  const togglePlayFor = async (track) => {
    try {
      if (currentTrack && currentTrack.id === track.id && isPlaying) {
        await pause();
        return;
      }

      const queue = filteredTracks.length > 0 ? filteredTracks : tracks;
      const idx = queue.findIndex((t) => t.id === track.id);

      await play(track, {
        queue,
        index: idx >= 0 ? idx : 0,
      });
    } catch (e) {
      console.warn('togglePlayFor error', e);
      Alert.alert('Play error', 'Unable to play this track');
    }
  };

  const handleRemoveFromPlaylist = useCallback(
    async (track) => {
      if (!playlist) return;
      if (removingTrackId) return;

      const previousTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
      const remainingTracks = previousTracks.filter((t) => t.id !== track.id);
      const remainingIds = remainingTracks.map((t) => t.id);

      setPlaylist((prev) => ({ ...prev, tracks: remainingTracks }));
      setRemovingTrackId(track.id);

      try {
        await api.patch(`/playlists/${playlist.id}/`, { track_ids: remainingIds });
        fetchPlaylist().catch((err) => console.warn('refresh failed', err));
      } catch (err) {
        console.error('remove track failed', err);
        setPlaylist((prev) => ({ ...prev, tracks: previousTracks }));
        Alert.alert('Error', 'Failed to remove track. Please try again.');
      } finally {
        setRemovingTrackId(null);
      }
    },
    [playlist, removingTrackId, fetchPlaylist]
  );

  const handleDeletePlaylist = useCallback(async () => {
    let confirmed = true;

    if (Platform.OS === 'web') {
      confirmed = window.confirm('Delete this playlist?');
    } else {
      Alert.alert('Delete playlist', 'Are you sure you want to delete this playlist?', [
        { text: 'Cancel', style: 'cancel', onPress: () => (confirmed = false) },
        { text: 'Delete', style: 'destructive', onPress: () => (confirmed = true) },
      ]);
    }

    if (!confirmed) return;

    if (deletingPlaylist) return;
    setDeletingPlaylist(true);

    try {
      await api.delete(`/playlists/${id}/`);
      navigation.goBack();
    } catch (err) {
      console.warn('deletePlaylist error', err);
      if (Platform.OS === 'web') alert('Failed to delete playlist.');
      else Alert.alert('Error', 'Failed to delete playlist.');
    } finally {
      setDeletingPlaylist(false);
    }
  }, [id, deletingPlaylist, navigation]);

  const openTrackMenu = (track) => {
    setSelectedForMenu(track);
    setMenuVisible(true);
  };
  const closeTrackMenu = () => {
    setSelectedForMenu(null);
    setMenuVisible(false);
  };
  const onEditTrack = () => {
    if (!selectedForMenu) return;
    closeTrackMenu();
    navigation.navigate('TrackForm', { track: selectedForMenu, playlistId: playlist?.id });
  };
  const onRemoveFromPlaylist = async () => {
    if (!selectedForMenu) return;
    closeTrackMenu();
    await handleRemoveFromPlaylist(selectedForMenu);
  };

  if (!playlist && loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No playlist found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlist.name}</Text>
      {playlist.description ? <Text style={styles.description}>{playlist.description}</Text> : null}

      <View style={styles.spacer12} />

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => navigation.navigate('PlaylistForm', { playlist })}
          onHoverIn={() => setHoverEdit(true)}
          onHoverOut={() => setHoverEdit(false)}
          style={({ pressed }) => [
            styles.headerAction,
            pressed && styles.headerActionPressed,
            hoverEdit && styles.headerActionHover,
          ]}
        >
          <Text style={styles.headerActionText}>Edit Playlist</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('TrackForm', { playlistId: playlist.id })}
          onHoverIn={() => setHoverAdd(true)}
          onHoverOut={() => setHoverAdd(false)}
          style={({ pressed }) => [
            styles.headerAction,
            pressed && styles.headerActionPressed,
            hoverAdd && styles.headerActionHover,
          ]}
        >
          <Text style={styles.headerActionText}>Add Track (Upload)</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('NowPlaying')}
          onHoverIn={() => setHoverOpen(true)}
          onHoverOut={() => setHoverOpen(false)}
          style={({ pressed }) => [
            styles.headerAction,
            pressed && styles.headerActionPressed,
            hoverOpen && styles.headerActionHover,
          ]}
        >
          <Text style={styles.headerActionText}>Open Player</Text>
        </Pressable>

        <Pressable
          onPress={handleDeletePlaylist}
          onHoverIn={() => setHoverDelete(true)}
          onHoverOut={() => setHoverDelete(false)}
          style={({ pressed }) => [
            styles.deleteButton,
            deletingPlaylist && styles.deleteButtonDisabled,
            pressed && styles.deleteButtonPressed,
            hoverDelete && styles.deleteButtonHover,
          ]}
          disabled={deletingPlaylist}
        >
          <Text style={styles.deleteButtonText}>{deletingPlaylist ? 'Deleting...' : 'Delete Playlist'}</Text>
        </Pressable>
      </View>

      <View style={styles.spacer12} />
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 8 }}>
          <RemoteSvgIcon uri={SEARCH_SVG_URL} color="#888" width={16} height={16} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search tracks in playlist"
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

      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const artwork = item?.artwork;
          let artUri = null;
          if (artwork) {
            if (typeof artwork === 'string' && artwork.startsWith('http')) {
              artUri = artwork;
            } else if (typeof window !== 'undefined' && typeof artwork === 'string') {
              artUri = `${window.location.origin}${artwork}`;
            } else if (typeof artwork === 'string') {
              artUri = artwork;
            }
          }

          const removing = removingTrackId === item.id;
          const isHovered = hoveredTrackId === item.id;
          const isCurrent = currentTrack && currentTrack.id === item.id && isPlaying;

          return (
            <Pressable
              onPress={() => togglePlayFor(item)}
              onHoverIn={() => setHoveredTrackId(item.id)}
              onHoverOut={() => setHoveredTrackId(null)}
              style={({ pressed }) => [
                styles.trackItem,
                isCurrent ? styles.trackItemActive : null,
                pressed && styles.trackItemPressed,
                isHovered ? styles.trackItemHover : null,
              ]}
            >
              {artUri ? <Image source={{ uri: artUri }} style={styles.trackThumb} /> : <View style={styles.trackThumbPlaceholder} />}

              <View style={styles.trackText}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>

              <View style={styles.controls}>
                <Pressable
                  onPress={(e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    openTrackMenu(item);
                  }}
                  style={styles.kebabButton}
                >
                  <Text style={styles.kebabIcon}>⋮</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptyText}>{queryLower ? 'No tracks match your search.' : 'No tracks in this playlist'}</Text>}
        contentContainerStyle={filteredTracks.length === 0 ? styles.listEmptyContainer : null}
      />

      <Modal visible={menuVisible} animationType="slide" transparent onRequestClose={closeTrackMenu}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedForMenu ? selectedForMenu.title : 'Track'}</Text>

            <Pressable style={({ pressed }) => [styles.modalOption, pressed && styles.modalOptionPressed]} onPress={onEditTrack}>
              <Text style={styles.modalOptionText}>Edit track details</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.modalOption, pressed && styles.modalOptionPressed]} onPress={onRemoveFromPlaylist}>
              <Text style={[styles.modalOptionText, styles.modalOptionDanger]}>Remove from playlist</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.modalCancel, pressed && styles.modalCancelPressed]} onPress={closeTrackMenu}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}