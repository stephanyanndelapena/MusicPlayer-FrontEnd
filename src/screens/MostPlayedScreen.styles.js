import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121212',
  surface: '#181818',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  accent: '#1DB954',
  separator: '#272727',
  danger: '#d9534f',
  muted: '#2a2a2a',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },

  listContent: {
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 16,
  },

  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.textPrimary,
  },

  topCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.muted,
    borderWidth: 1,
    position: 'relative',
  },

  topArt: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#222',
  },

  topArtPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.muted,
  },

  topTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  topArtist: {
    marginTop: 4,
    color: colors.textSecondary,
  },

  topCount: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
  },

  spacer12: {
    height: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
  },

  rowHover: {
    backgroundColor: '#162a1a',
    borderRadius: 8,
    paddingHorizontal: 8,
  },

  rowText: {
    flex: 1,
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.muted,
  },

  title: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },

  count: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },

  message: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  separator: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 8,
  },

  topCardControls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 50,
  },

  topIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  topIcon: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 20,
  },

  topClearButton: {
    marginLeft: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topClearText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  centeredControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  refreshButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 22,
  },

  clearButton: {
    marginLeft: 12,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  controlPressed: {
    opacity: 0.9,
  },
});