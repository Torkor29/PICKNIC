import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import PlaceFormScreen from '../screens/PlaceFormScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import EditPlaceScreen from '../screens/EditPlaceScreen';
import type { Place } from '../types';

export type RootStackParamList = {
  Main: undefined;
  PlaceForm: { latitude: number; longitude: number } | undefined;
  PlaceDetail: { placeId: string; place?: Place };
  EditPlace: { placeId: string; place: Place };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PlaceForm" 
          component={PlaceFormScreen} 
          options={{ 
            title: 'Ajouter un lieu',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="PlaceDetail" 
          component={PlaceDetailScreen} 
          options={{ 
            title: 'Détails du lieu',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="EditPlace" 
          component={EditPlaceScreen} 
          options={{ 
            title: 'Modifier le lieu',
            presentation: 'modal',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


