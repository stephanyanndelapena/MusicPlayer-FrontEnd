import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121212',
  surface: '#181818',
  mutedSurface: '#202020',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  accent: '#1DB954',
  separator: '#2a2a2a',
  subtle: '#121212',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  headerRow: {
    padding: 16,
    paddingTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },

  headerButtonsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallButton: {
    marginLeft: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },

  outlinedButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  outlinedButtonText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  outlinedButtonTextFilled: {
    color: colors.textPrimary,
  },

  iconOutlined: {
    minWidth: 84,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  listContent: {
    paddingBottom: 140,
    backgroundColor: colors.background,
  },

  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  rowHover: {
    backgroundColor: '#222622',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#222',
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  count: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },

  separator: {
    height: 1,
    backgroundColor: colors.separator,
  },

  trackRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  trackRowHover: {
    backgroundColor: '#162a1a',
  },
  trackRowActive: {
    backgroundColor: '#162115',
  },
  trackThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#222',
  },
  trackThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#222',
  },
  trackTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  trackArtist: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },

  recentButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  emptyText: {
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 6,
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 16,
    maxHeight: '60%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderColor: colors.separator,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.textPrimary,
  },

  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },

  playlistOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  playlistOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  playlistOptionCount: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});