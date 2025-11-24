import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlayerProvider } from './src/context/PlayerContext';
import NowPlayingModal from './src/components/NowPlayingModal';

// Import your existing screens
import PlaylistsScreen from './src/screens/PlaylistsScreen';
import PlaylistDetailScreen from './src/screens/PlaylistDetailScreen';
import TrackFormScreen from './src/screens/TrackFormScreen';
import PlaylistFormScreen from './src/screens/PlaylistFormScreen';
import NowPlayingScreen from './src/screens/NowPlayingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PlayerProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Playlists">
          <Stack.Screen name="Playlists" component={PlaylistsScreen} />
          <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
          <Stack.Screen name="TrackForm" component={TrackFormScreen} />
          <Stack.Screen name="PlaylistForm" component={PlaylistFormScreen} />
          <Stack.Screen name="NowPlaying" component={NowPlayingScreen} />
        </Stack.Navigator>

        {/* Global Now Playing mini-player, visible over all screens */}
        <NowPlayingModal />
      </NavigationContainer>
    </PlayerProvider>
  );
}