import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import MapScreen from '../screens/MapScreen';
import ListScreen from '../screens/ListScreen';
import MyPlacesScreen from '../screens/MyPlacesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

export type TabParamList = {
  Map: undefined;
  List: undefined;
  MyPlaces: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'List') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'MyPlaces') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6b6b',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e9ecef',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 88 : 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ 
          tabBarLabel: 'Carte',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'map' : 'map-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="List"
        component={ListScreen}
        options={{ 
          tabBarLabel: 'Liste',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'list' : 'list-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyPlaces"
        component={MyPlacesScreen}
        options={{ 
          tabBarLabel: 'Mes lieux',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'heart' : 'heart-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ 
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'person-circle' : 'person-circle-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
