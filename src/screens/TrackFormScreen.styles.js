import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121212',
  surface: '#181818',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  placeholder: '#7A7A7A',
  accent: '#1DB954',
  mutedBorder: '#2a2a2a',
  danger: '#E53935',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 16,
    paddingTop: 22,
  },

  label: {
    color: colors.textSecondary,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },

  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.mutedBorder,
    marginBottom: 12,
    fontSize: 15,
  },

  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },

  pickButton: {
    backgroundColor: colors.card || '#1E1E1E',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.mutedBorder,
    alignItems: 'center',
  },
  pickButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  /* Hover state for pick buttons: only change border color to green (accent) */
  pickButtonHover: {
    backgroundColor: 'transparent', // keep background same
    borderColor: colors.accent,
  },

  saveButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },

  /* Normal hover/darker effect for save button */
  saveButtonHover: {
    backgroundColor: '#18a84a',
  },

  saveButtonText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
});