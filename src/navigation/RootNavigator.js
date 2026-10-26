import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Core Screens matching 15 Provided Screens
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import SelectServicesScreen from '../screens/onboarding/SelectServicesScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LogoutScreen from '../screens/auth/LogoutScreen';
import PendingScreen from '../screens/onboarding/PendingScreen';
import KycScreen from '../screens/onboarding/KycScreen';

import RoleTabs from './RoleTabs';

// Domain Specific Screens (Pandit, Mandali, Astrologer)
import MandaliManagementScreen from '../screens/mandali/MandaliManagementScreen';
import BookingsListScreen from '../screens/bookings/BookingsListScreen';
import BookingDetailsScreen from '../screens/bookings/BookingDetailsScreen';
import LiveLocationTrackingScreen from '../screens/bookings/LiveLocationTrackingScreen';
import AstrologyServicesScreen from '../screens/astro/AstrologyServicesScreen';
import PoojaServicesScreen from '../screens/pandit/PoojaServicesScreen';
import WalletEarningsScreen from '../screens/earnings/WalletEarningsScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import HelpSupportScreen from '../screens/support/HelpSupportScreen';

// Secondary Utility Screens
import EditProfileScreen from '../screens/EditProfileScreen';
import ActiveJobScreen from '../screens/pandit/ActiveJobScreen';
import AcceptPoojaScreen from '../screens/pandit/AcceptPoojaScreen';
import EnRouteScreen from '../screens/pandit/EnRouteScreen';
import StartOtpScreen from '../screens/pandit/StartOtpScreen';
import PoojaInProgressScreen from '../screens/pandit/PoojaInProgressScreen';
import CompletionOtpScreen from '../screens/pandit/CompletionOtpScreen';
import PoojaCompletedScreen from '../screens/pandit/PoojaCompletedScreen';
import DailyRouteScreen from '../screens/pandit/DailyRouteScreen';
import InCallScreen from '../screens/astro/InCallScreen';
import AstroSessionScreen from '../screens/astro/AstroSessionScreen';
import KundaliToolsScreen from '../screens/astro/KundaliToolsScreen';
import ChatScreen from '../screens/common/ChatScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Onboarding & Auth Flow (Screens 1, 2, 3, Login, Register, 15) */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="SelectServices" component={SelectServicesScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Pending" component={PendingScreen} />
        <Stack.Screen name="Kyc" component={KycScreen} />
        <Stack.Screen name="Logout" component={LogoutScreen} />

        {/* Main Dashboard & Tabs (Screen 4 Dashboard, Screen 6 Bookings, Calendar, Screen 12 Profile) */}
        <Stack.Screen name="Main" component={RoleTabs} />

        {/* Feature Screens (Screens 5 - 14) */}
        <Stack.Screen name="MandaliManagement" component={MandaliManagementScreen} />
        <Stack.Screen name="BookingsList" component={BookingsListScreen} />
        <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
        <Stack.Screen name="LiveLocationTracking" component={LiveLocationTrackingScreen} />
        <Stack.Screen name="AstrologyServices" component={AstrologyServicesScreen} />
        <Stack.Screen name="PoojaServices" component={PoojaServicesScreen} />
        <Stack.Screen name="WalletEarnings" component={WalletEarningsScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />

        {/* Secondary Flows */}
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
        <Stack.Screen name="AcceptPooja" component={AcceptPoojaScreen} />
        <Stack.Screen name="EnRoute" component={EnRouteScreen} />
        <Stack.Screen name="StartOtp" component={StartOtpScreen} />
        <Stack.Screen name="PoojaInProgress" component={PoojaInProgressScreen} />
        <Stack.Screen name="CompletionOtp" component={CompletionOtpScreen} />
        <Stack.Screen name="PoojaCompleted" component={PoojaCompletedScreen} />
        <Stack.Screen name="DailyRoute" component={DailyRouteScreen} />
        <Stack.Screen name="InCall" component={InCallScreen} />
        <Stack.Screen name="AstroSession" component={AstroSessionScreen} />
        <Stack.Screen name="KundaliTools" component={KundaliToolsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
