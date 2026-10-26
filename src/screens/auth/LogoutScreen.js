import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');

export default function LogoutScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <View style={s.container}>
        {/* Upper Divine Emblem & Brand */}
        <View style={s.brandSection}>
          <Image
            source={TEMPLE_IMAGE}
            style={s.templeLogo}
            resizeMode="contain"
          />
          <Text style={s.brandTitle}>VaidicSanskar</Text>
          <Text style={s.brandTagline}>Service • Devotion • Trust</Text>
        </View>

        {/* Center Logout Confirmation Message */}
        <View style={s.centerCard}>
          {/* Green Check Circle Badge */}
          <View style={s.checkCircle}>
            <MaterialCommunityIcons name="check" size={32} color="#FFFFFF" />
          </View>

          <Text style={s.logoutHeading}>You have been logged out</Text>
          <Text style={s.logoutSubtitle}>
            Thank you for being a part of{'\n'}VaidicSanskar
          </Text>
        </View>

        {/* Bottom Action Button */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            }
            style={s.loginAgainBtn}
          >
            <Text style={s.loginAgainBtnText}>Login Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#FBF8F2',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  brandSection: {
    alignItems: 'center',
  },
  templeLogo: {
    width: 140,
    height: 110,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#67101F',
    letterSpacing: 0.5,
    fontFamily: 'serif',
    marginTop: 6,
  },
  brandTagline: {
    fontSize: 12.5,
    color: '#7D686B',
    marginTop: 2,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  centerCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E8E4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#1E8E4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E1418',
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  logoutSubtitle: {
    fontSize: 14,
    color: '#7D686B',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    width: '100%',
  },
  loginAgainBtn: {
    height: 52,
    backgroundColor: '#67101F',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
