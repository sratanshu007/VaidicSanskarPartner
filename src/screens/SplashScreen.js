import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, Easing, View, Image, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { serif } from '../theme/styles';

const SPLASH_BG = require('../../assets/images/splash_bg.jpg');

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const progress = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1850,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
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
          const socket = require('../services/socket').default;
          socket.connect(session.token, v.id || v._id);
          try {
            const serverCheck = await VendorService.checkStatus(v.id || v.email || v.phone);
            if (serverCheck?.success && serverCheck.vendor) {
              v = serverCheck.vendor;
              await partnerDb.saveSession(v, session.token);
            } else if (serverCheck?.status === 404 || serverCheck?.kyc === 'NotRegistered') {
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

          const isApproved = v.status === 'Active' || v.status === 'approved' || v.kyc === 'Verified';
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

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '100%'],
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.bg}>
        <Image source={SPLASH_BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient
          colors={[
            'rgba(94, 15, 20, 0.78)',
            'rgba(154, 52, 16, 0.45)',
            'rgba(122, 30, 14, 0.72)',
            'rgba(62, 7, 11, 0.94)',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={[
            s.overlay,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 40,
              paddingBottom: Math.max(insets.bottom, 24) + 28,
            },
          ]}
        >
          <View style={s.topSpacer} />

          {/* Center Glowing Lotus Om Emblem & Brand */}
          <Animated.View style={[s.centerSection, { opacity: fade, transform: [{ scale }] }]}>
            <View style={s.outerGlow}>
              <View style={s.lotusRing}>
                <LinearGradient
                  colors={['#FCE39D', '#D48B28']}
                  style={s.omDisc}
                >
                  <MaterialCommunityIcons name="om" size={44} color="#5E0F14" />
                </LinearGradient>
              </View>
            </View>

            <Text style={s.brandTitle}>VaidicSanskar</Text>
            <Text style={s.tagline}>Service  •  Devotion  •  Trust</Text>

            <View style={s.partnerBadge}>
              <Text style={s.partnerBadgeText}>Vendor Partner App</Text>
            </View>
          </Animated.View>

          {/* Bottom Saffron Progress Bar */}
          <Animated.View style={[s.bottomSection, { opacity: fade }]}>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: progressWidth }]} />
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4A080C' },
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  topSpacer: { height: 24 },
  centerSection: {
    alignItems: 'center',
    width: '100%',
  },
  outerGlow: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(247, 201, 102, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 201, 102, 0.55)',
  },
  lotusRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(94, 15, 20, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F7C966',
  },
  omDisc: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontFamily: serif,
    fontWeight: '800',
    color: '#FFF6E3',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#F6DFB8',
    marginTop: 8,
    letterSpacing: 1.1,
  },
  partnerBadge: {
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 246, 227, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(247, 201, 102, 0.45)',
  },
  partnerBadgeText: {
    color: '#FFF6E3',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#F5B041',
  },
});
