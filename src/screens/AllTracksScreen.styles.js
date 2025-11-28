import { StyleSheet } from 'react-native';
import { colors as playlistColors } from './PlaylistsScreen.styles';

// Reuse the app's playlist color tokens so AllTracks matches PlaylistsScreen
const c = {
  background: playlistColors.background,
  surface: playlistColors.surface,
  muted: playlistColors.textSecondary,
  textPrimary: playlistColors.textPrimary,
  accent: playlistColors.accent,
  separator: playlistColors.separator,
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
    paddingTop: 8,
  },

  // Header row to match PlaylistsScreen but with black background + white text
  headerRow: {
    padding: 16,
    paddingTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000', // forced black
    borderBottomWidth: 1,
    borderBottomColor: '#000', // match black header
  },

  // Keep headerTitle and headerSubtitle white
  headerTitle: {
    color: '#ffffffff', // white text
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#FFFFFF', // white text
    fontSize: 12,
  },

  listContent: {
    paddingBottom: 48,
    paddingTop: 8,
    backgroundColor: c.background,
  },

  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: c.surface,
  },
  // Hover / pressed state similar to PlaylistsScreen.trackRowHover
  trackRowPressed: {
    backgroundColor: '#0b0b0b',
  },
  // Match playlist hover highlight tone
  trackRowHover: {
    backgroundColor: '#162a1a',
  },
  trackRowActive: {
    backgroundColor: '#162115',
  },

  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbInitials: {
    color: c.textPrimary,
    fontWeight: '700',
    fontSize: 18,
  },

  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  trackSubtitle: {
    color: c.muted,
    fontSize: 12,
    marginTop: 2,
  },

  playHint: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playHintText: {
    color: c.muted,
    fontSize: 16,
  },

  separator: {
    height: 1,
    backgroundColor: c.separator,
    marginLeft: 72,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.background,
  },
  emptyText: {
    color: c.muted,
  },
});