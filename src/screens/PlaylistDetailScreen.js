import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Image,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';
import styles, { colors } from './PlaylistDetailScreen.styles';

export default function PlaylistDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [removingTrackId, setRemovingTrackId] = useState(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);

  // kebab menu modal state
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedForMenu, setSelectedForMenu] = useState(null);

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

  // Make header the same color as the screen body and remove the bottom border/shadow
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background || '#121212',
        borderBottomWidth: 0,
        elevation: 0, // Android: remove shadow
        shadowOpacity: 0, // iOS: remove shadow
      },
      headerTintColor: colors.textPrimary || '#fff',
      headerTitleStyle: { color: colors.textPrimary || '#fff' },
    });
  }, [navigation]);

  const togglePlayFor = async (track) => {
    try {
      if (currentTrack && currentTrack.id === track.id && isPlaying) {
        await pause();
        return;
      }
      await play(track, {
        queue: playlist?.tracks || [],
        index: playlist?.tracks ? playlist.tracks.findIndex((t) => t.id === track.id) : 0,
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

  // modal handlers for kebab menu
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

  // Loading / empty states
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

  const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlist.name}</Text>
      {playlist.description ? <Text style={styles.description}>{playlist.description}</Text> : null}

      <View style={styles.spacer12} />

      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          onPress={() => navigation.navigate('PlaylistForm', { playlist })}
        >
          <Text style={styles.headerActionText}>Edit Playlist</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          onPress={() => navigation.navigate('TrackForm', { playlistId: playlist.id })}
        >
          <Text style={styles.headerActionText}>Add Track (Upload)</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          onPress={() => navigation.navigate('NowPlaying')}
        >
          <Text style={styles.headerActionText}>Open Player</Text>
        </Pressable>

        <Pressable
          onPress={handleDeletePlaylist}
          style={({ pressed }) => [
            styles.deleteButton,
            deletingPlaylist && styles.deleteButtonDisabled,
            pressed && styles.deleteButtonPressed,
          ]}
          disabled={deletingPlaylist}
        >
          <Text style={styles.deleteButtonText}>{deletingPlaylist ? 'Deleting...' : 'Delete Playlist'}</Text>
        </Pressable>
      </View>

      <View style={styles.spacer12} />

      <FlatList
        data={tracks}
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

          return (
            <Pressable
              onPress={() => togglePlayFor(item)}
              style={({ pressed }) => [styles.trackItem, pressed && styles.trackItemPressed]}
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
                {/* Kebab menu (three vertical dots). stopPropagation attempt to prevent row press */}
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
        ListEmptyComponent={<Text style={styles.emptyText}>No tracks in this playlist</Text>}
        contentContainerStyle={tracks.length === 0 ? styles.listEmptyContainer : null}
      />

      {/* Track kebab menu modal */}
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