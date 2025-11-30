import { StyleSheet } from 'react-native';
import { colors as playlistColors } from './PlaylistsScreen.styles';

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

  headerRow: {
    padding: 16,
    paddingTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },

  headerTitle: {
    color: '#ffffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#FFFFFF',
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

  trackRowPressed: {
    backgroundColor: '#0b0b0b',
  },

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