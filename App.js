import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlaylistsScreen from './src/screens/PlaylistsScreen';
import PlaylistDetailScreen from './src/screens/PlaylistDetailScreen';
import TrackFormScreen from './src/screens/TrackFormScreen';
import PlaylistFormScreen from './src/screens/PlaylistFormScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Playlists">
        <Stack.Screen name="Playlists" component={PlaylistsScreen} />
        <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} options={({route}) => ({title: route.params?.name || 'Playlist'})}/>
        <Stack.Screen name="TrackForm" component={TrackFormScreen} options={{title: 'Add / Edit Track'}}/>
        <Stack.Screen name="PlaylistForm" component={PlaylistFormScreen} options={{title: 'Add / Edit Playlist'}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}