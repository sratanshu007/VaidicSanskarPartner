import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import VendorHomeScreen from '../screens/dashboard/VendorHomeScreen';
import BookingsListScreen from '../screens/bookings/BookingsListScreen';
import SlotManagerScreen from '../screens/pandit/SlotManagerScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function RoleTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || (Platform.OS === 'android' ? 6 : 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#67101F',
        tabBarInactiveTintColor: '#8A7577',
        tabBarStyle: {
          height: 60 + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset : 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EDE4DA',
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={VendorHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsListScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={SlotManagerScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileSettingsScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size || 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
