import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121212',
  surface: '#181818',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  placeholder: '#7a7a7a',
  accent: '#1DB954',
  mutedBorder: '#2a2a2a',
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

  button: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },

  buttonHover: {
    backgroundColor: '#18a84a',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },

  buttonTextHover: {
    color: colors.textPrimary,
  },

  buttonTextDisabled: {
    color: colors.textPrimary,
  },

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

  cancelButtonHover: {
    backgroundColor: 'transparent',
    borderColor: colors.accent,
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  cancelButtonTextHover: {
    color: colors.textSecondary,
  },
});