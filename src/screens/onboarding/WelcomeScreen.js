import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');

export default function WelcomeScreen({ navigation }) {
  const { height } = useWindowDimensions();
  const isSmall = height < 700;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <View style={s.container}>
        {/* Upper Divine Temple Artwork & Branding */}
        <View style={s.artworkSection}>
          <View style={s.imageWrapper}>
            <Image
              source={TEMPLE_IMAGE}
              style={[s.templeImage, isSmall && { height: 260 }]}
              resizeMode="contain"
            />
          </View>

          <View style={s.brandBlock}>
            <Text style={s.brandTitle}>VaidicSanskar</Text>
            <Text style={s.brandTagline}>Service • Devotion • Trust</Text>
          </View>
        </View>

        {/* Lower Welcome Card */}
        <View style={s.bottomCard}>
          <Text style={s.welcomeHeading}>Welcome, Pandit Ji</Text>
          <Text style={s.welcomeSub}>
            Connect with devotees and share your spiritual knowledge
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Register')}
            style={s.primaryBtn}
          >
            <Text style={s.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>

          {/* Login Option */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
            style={s.loginLink}
          >
            <Text style={s.loginLinkText}>
              Already registered? <Text style={s.loginLinkBold}>Login</Text>
            </Text>
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  artworkSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templeImage: {
    width: '100%',
    height: 320,
    maxWidth: 360,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#67101F',
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  brandTagline: {
    fontSize: 13,
    color: '#7D686B',
    marginTop: 4,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E6DC',
  },
  welcomeHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E1418',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#7D686B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  primaryBtn: {
    width: '100%',
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
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  loginLink: {
    marginTop: 16,
    paddingVertical: 6,
  },
  loginLinkText: {
    fontSize: 13.5,
    color: '#7D686B',
  },
  loginLinkBold: {
    color: '#67101F',
    fontWeight: '700',
  },
});
