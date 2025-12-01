import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlayerProvider } from './src/context/PlayerContext';
import NowPlayingModal from './src/components/NowPlayingModal';

import PlaylistsScreen from './src/screens/PlaylistsScreen';
import PlaylistDetailScreen from './src/screens/PlaylistDetailScreen';
import TrackFormScreen from './src/screens/TrackFormScreen';
import PlaylistFormScreen from './src/screens/PlaylistFormScreen';
import NowPlayingScreen from './src/screens/NowPlayingScreen';
import MostPlayedScreen from './src/screens/MostPlayedScreen';
import AllTracksScreen from './src/screens/AllTracksScreen';
const Stack = createNativeStackNavigator();

export default function Dashboard() {
  return (
    <PlayerProvider>
      <NavigationContainer>
        
        <Stack.Navigator initialRouteName="Stopify - The Spotify Dupe">
          <Stack.Screen name="Stopify - The Spotify Dupe" component={PlaylistsScreen} />
          <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
          <Stack.Screen name="TrackForm" component={TrackFormScreen} />
          <Stack.Screen name="PlaylistForm" component={PlaylistFormScreen} />
          <Stack.Screen name="NowPlaying" component={NowPlayingScreen} />
          <Stack.Screen name="MostPlayed" component={MostPlayedScreen} />
          <Stack.Screen name="AllTracks" component={AllTracksScreen} options={{ title: 'All Tracks' }} />
        </Stack.Navigator>

        <NowPlayingModal />
      </NavigationContainer>
    </PlayerProvider>
  );
}