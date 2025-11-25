import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121212',
  surface: '#181818',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  accent: '#1DB954',
  separator: '#252525',
  dangerBg: '#3b1b1b',
  dangerText: '#ff6b6b',
  muted: '#2a2a2a',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },

  emptyContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  description: {
    marginBottom: 12,
    color: colors.textSecondary,
  },

  spacer12: {
    height: 12,
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  headerAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  headerActionPressed: {
    opacity: 0.85,
  },
  headerActionText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },

  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.dangerBg,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  deleteButtonPressed: {
    opacity: 0.9,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: colors.dangerText,
    fontWeight: '700',
    fontSize: 13,
  },

  trackItem: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 10,
  },
  trackItemPressed: {
    opacity: 0.95,
  },
  trackThumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#222',
  },
  trackThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#222',
  },

  trackText: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  trackArtist: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  kebabButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kebabIcon: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 20,
  },

  separator: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 12,
  },

  listEmptyContainer: {
    paddingTop: 24,
  },

  /* Modal styles for kebab menu */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderColor: colors.muted,
    borderWidth: 1,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  modalOptionPressed: {
    backgroundColor: '#222',
  },
  modalOptionText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalOptionDanger: {
    color: colors.dangerText,
    fontWeight: '700',
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#101010',
  },
  modalCancelPressed: {
    opacity: 0.9,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});