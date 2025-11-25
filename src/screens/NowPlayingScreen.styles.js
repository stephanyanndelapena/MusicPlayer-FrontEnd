import { StyleSheet } from 'react-native';

/**
 * Exports:
 * - colors: named export for tokens (header, controls, text, etc.)
 * - default: StyleSheet (import as: import styles, { colors } from './NowPlayingScreen.styles')
 */

export const colors = {
  // layout / surfaces
  background: '#121212',
  surface: '#181818',

  // typography
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',

  // progress / accent
  progressBg: '#333333',
  accent: '#1DB954', // Spotify green

  // header-specific token (separate from control icons)
  headerTint: '#FFFFFF',

  // control-specific tokens (separate from header to avoid accidental overrides)
  controlIcon: '#FFFFFF', // prev / next icon color
  controlPrimaryBackground: '#1DB954', // play button background
  controlPrimaryIcon: '#FFFFFF', // play icon color on primary background
  controlButtonBackground: 'transparent', // optional small control background
  muted: '#2a2a2a',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  art: {
    width: 320,
    height: 320,
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: '#222',
  },

  artPlaceholder: {
    width: 320,
    height: 320,
    borderRadius: 8,
    backgroundColor: '#222',
    marginTop: 20,
  },

  title: {
    marginTop: 18,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  artist: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  progressWrap: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 24,
  },
  progressBackground: {
    height: 6,
    width: '100%',
    backgroundColor: colors.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.accent,
  },

  timeRow: {
    width: '100%',
    paddingHorizontal: 6,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  controlsRow: {
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  transportButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.controlButtonBackground,
  },
  transportIcon: {
    color: colors.controlIcon, // uses control-specific token
    fontSize: 22,
  },

  playBigButton: {
    backgroundColor: colors.controlPrimaryBackground, // separated token
    borderRadius: 40,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  playBigIcon: {
    fontSize: 28,
    color: colors.controlPrimaryIcon, // separated token
    fontWeight: '700',
  },

  headerBackButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerBackText: {
    color: colors.headerTint, // header uses its own token
    fontSize: 20,
    fontWeight: '600',
  },

  emptyText: {
    color: colors.textPrimary,
  },
});