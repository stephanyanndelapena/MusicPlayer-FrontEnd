import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121212',
  surface: '#181818',

  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',

  progressBg: '#333333',
  accent: '#1DB954',

  headerTint: '#FFFFFF',

  controlIcon: '#FFFFFF',
  controlPrimaryBackground: '#1DB954',
  controlPrimaryIcon: '#FFFFFF',
  controlButtonBackground: 'transparent',
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
    color: colors.controlIcon,
    fontSize: 22,
  },

  playBigButton: {
    backgroundColor: colors.controlPrimaryBackground,
    borderRadius: 40,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  volumeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible', 
  },
  volumeButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.controlButtonBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },

  volumeSliderWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  volumeSliderBackground: {
    backgroundColor: colors.muted,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  volumeSliderFill: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  playBigIcon: {
    fontSize: 28,
    color: colors.controlPrimaryIcon,
    fontWeight: '700',
  },

  headerBackButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerBackText: {
    color: colors.headerTint,
    fontSize: 20,
    fontWeight: '600',
  },

  emptyText: {
    color: colors.textPrimary,
  },
});