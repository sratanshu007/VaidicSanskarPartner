import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, Easing, View, ImageBackground, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import styles from '../theme/styles';

const SPLASH_BG = require('../../assets/images/splash_bg.jpg');

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    // Navigate to appropriate screen after splash
    const t = setTimeout(async () => {
      try {
        const { partnerDb } = require('../services/partnerDb');
        const { VendorService, setAuthToken } = require('../services/api');
        const session = await partnerDb.getSession();
        if (session?.vendor) {
          if (session.token) setAuthToken(session.token);
          let v = session.vendor;
          try {
            const serverCheck = await VendorService.checkStatus(v.id || v.email || v.phone);
            if (serverCheck?.success && serverCheck.vendor) {
              v = serverCheck.vendor;
              await partnerDb.saveSession(v, session.token);
            } else if (serverCheck?.status === 404 || serverCheck?.kyc === 'NotRegistered') {
              // Database was wiped or user was deleted
              await partnerDb.clearSession();
              navigation.replace('Welcome');
              return;
            }
          } catch (err) {
            if (err?.status === 404) {
              await partnerDb.clearSession();
              navigation.replace('Welcome');
              return;
            }
          }

          const isApproved = v.status === 'Active' || v.kyc === 'Verified';
          if (isApproved) {
            navigation.replace('Main');
            return;
          } else if (v.profileCompleted === false || v.status === 'Incomplete') {
            navigation.replace('ProfileSetup');
            return;
          } else {
            navigation.replace('Pending', {
              email: v.email,
              phone: v.phone,
              name: v.name,
              role: v.role,
            });
            return;
          }
        }
      } catch (e) {}
      navigation.replace('Welcome');
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={SPLASH_BG} style={s.bg} resizeMode="cover">
        {/* Soft golden / warm vignette gradient overlays */}
        <LinearGradient
          colors={['rgba(255, 245, 230, 0.95)', 'rgba(255, 235, 200, 0.7)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.85)']}
          locations={[0, 0.28, 0.65, 1]}
          style={[
            s.overlay,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 20,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            },
          ]}
        >
          {/* Top Logo Section */}
          <Animated.View style={[s.topSection, { opacity: fade, transform: [{ scale }] }]}>
            {/* Glowing Golden Om Emblem with Sun Rays / Petals */}
            <View style={s.emblemGlow}>
              <View style={s.emblemDisc}>
                <View style={s.emblemInner}>
                  <MaterialCommunityIcons name="om" size={42} color={colors.maroon} />
                </View>
              </View>
            </View>

            <Text style={s.brandTitle}>VaidicSanskar</Text>
            <View style={s.partnerRow}>
              <View style={s.dot} />
              <Text style={s.partnerText}>PARTNERS</Text>
              <View style={s.dot} />
            </View>
            <Text style={s.tagline}>Connect  •  Serve  •  Grow</Text>
          </Animated.View>

          {/* Bottom Divine Catchphrase */}
          <Animated.View style={[s.bottomSection, { opacity: fade }]}>
            <Text style={s.bottomQuote}>Your Service. Our Tradition.</Text>
            <View style={s.flourishRow}>
              <View style={s.flourishLine} />
              <MaterialCommunityIcons name="rhombus-split" size={16} color={colors.gold} style={{ marginHorizontal: 8 }} />
              <View style={s.flourishLine} />
            </View>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 50 },
  topSection: { alignItems: 'center' },
  emblemGlow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(232, 185, 63, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 185, 63, 0.7)',
  },
  emblemDisc: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FAF3E3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  emblemInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 34,
    ...styles.serif,
    fontWeight: '800',
    color: '#4A1014',
    letterSpacing: 0.5,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#8B1A1A',
  },
  partnerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B1D22',
    letterSpacing: 4.5,
  },
  tagline: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5A151A',
    marginTop: 10,
    letterSpacing: 1.2,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  bottomQuote: {
    color: '#FFFFFF',
    fontSize: 17,
    ...styles.serif,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  flourishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: 140,
  },
  flourishLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.8,
  },
});


