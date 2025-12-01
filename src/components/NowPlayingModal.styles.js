import { StyleSheet } from 'react-native';

const ACCENT_GREEN = '#1DB954';

export default StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    backgroundColor: '#0b0b0b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 8,
    zIndex: 9999,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  left: {
    width: 56,
    marginRight: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#333',
  },

  meta: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  artist: {
    color: '#cfcfcf',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  playButton: {
    marginHorizontal: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    color: '#cfcfcf',
    fontSize: 11,
    width: 36,
    textAlign: 'left',
  },
  timeTextRight: {
    color: '#cfcfcf',
    fontSize: 11,
    width: 36,
    textAlign: 'right',
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#2d2d2d',
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#fff',
  },

  volumeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 6,
  },
  volumeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeSliderWrap: {
    position: 'absolute',
    bottom: 56,
    right: 1,
    width: 36,
    height: 140,
    padding: 8,
    backgroundColor: '#0b0b0b',
    borderRadius: 8,
    elevation: 6,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  volumeSliderBackground: {
    width: 6,
    height: '100%',
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  volumeSliderFill: {
    width: '100%',
    backgroundColor: ACCENT_GREEN,
    position: 'absolute',
    bottom: 0,
  },
});