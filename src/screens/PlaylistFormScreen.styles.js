import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121212', // Spotify-like deep bg
  surface: '#181818',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  placeholder: '#7a7a7a',
  accent: '#1DB954', // Spotify green
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

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  actions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Primary (Save) button - filled by default */
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },

  /* Hover/darker state for primary button */
  buttonHover: {
    backgroundColor: '#18a84a', // slightly darker/more saturated green on hover/press
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },

  /* Optional text tweaks when filled and hovered (keeps white) */
  buttonTextHover: {
    color: colors.textPrimary,
  },

  buttonTextDisabled: {
    color: colors.textPrimary,
  },

  /* Cancel button - outlined by default */
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.mutedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    backgroundColor: 'transparent',
  },

  /* When hovered/pressed, fill the cancel button with danger (red) and invert text */
  cancelButtonHover: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  cancelButtonTextHover: {
    color: colors.textPrimary,
  },
});