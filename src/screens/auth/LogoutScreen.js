import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePartner } from '../../context/PartnerContext';
import { serif } from '../../theme/styles';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');

export default function LogoutScreen({ navigation, route }) {
  const { logout } = usePartner();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (_) {}
    setLoggingOut(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <View style={s.container}>
        {/* Top Temple Silhouette Artwork matching Screen 15 */}
        <View style={s.artworkWrap}>
          <Image source={TEMPLE_IMAGE} style={s.templeArt} resizeMode="contain" />
        </View>

        {/* Center Confirmation Message */}
        <View style={s.centerCard}>
          <Text style={s.heading}>Are you sure you{'\n'}want to logout?</Text>
          <Text style={s.subtitle}>
            You will need to login again{'\n'}to access your account.
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleConfirmLogout}
            disabled={loggingOut}
            style={s.logoutBtn}
          >
            {loggingOut ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.logoutBtnText}>Logout</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCancel}
            disabled={loggingOut}
            style={s.cancelBtn}
          >
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  container: {
    flex: 1,
    backgroundColor: '#FBF6EE',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 28,
  },
  artworkWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  templeArt: {
    width: 240,
    height: 170,
    opacity: 0.9,
  },
  centerCard: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: -24,
  },
  heading: {
    fontSize: 23,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#7D686B',
    textAlign: 'center',
    lineHeight: 21,
  },
  actions: {
    gap: 12,
  },
  logoutBtn: {
    backgroundColor: '#67101F',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#FFFDF8',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DAC8',
  },
  cancelBtnText: {
    color: '#4A2B2F',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
