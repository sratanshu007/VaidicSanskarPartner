import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { usePartner, ROLES } from '../context/PartnerContext';
import VendorHomeScreen from '../screens/dashboard/VendorHomeScreen';
import BookingsListScreen from '../screens/bookings/BookingsListScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen';

// Astrologer Dedicated Screens (Unified single AstroDashboard)
import AstroDashboard from '../screens/astro/AstroDashboard';
import KundaliToolsScreen from '../screens/astro/KundaliToolsScreen';
import WalletEarningsScreen from '../screens/earnings/WalletEarningsScreen';

const Tab = createBottomTabNavigator();

export default function RoleTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || (Platform.OS === 'android' ? 6 : 0);
  const { role, vendor } = usePartner();

  const isDirectAstro = role === ROLES.ASTRO || vendor?.role === ROLES.ASTRO || vendor?.role === 'astro';
  const isAstro = isDirectAstro || Boolean(vendor?.isAstroEnabled);

  const tabBarOptions = {
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
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
  };

  if (isAstro) {
    return (
      <Tab.Navigator screenOptions={tabBarOptions}>
        <Tab.Screen
          name="AstroHome"
          component={AstroDashboard}
          options={{
            tabBarLabel: 'Astro Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="creation" size={size || 24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="KundaliTools"
          component={KundaliToolsScreen}
          options={{
            tabBarLabel: 'Kundali',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="star-four-points-outline" size={size || 24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Wallet"
          component={WalletEarningsScreen}
          options={{
            tabBarLabel: 'Earnings',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="wallet-outline" size={size || 24} color={color} />
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

  // Pandit / Mandali 4-Tab Bar matching Screen 3 (Home, Bookings, Earnings, Profile)
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="Home"
        component={VendorHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size || 24} color={color} />
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
        name="Earnings"
        component={WalletEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet-outline" size={size || 24} color={color} />
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
