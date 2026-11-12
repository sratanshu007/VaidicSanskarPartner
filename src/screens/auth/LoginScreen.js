import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner, ROLES } from '../../context/PartnerContext';
import { VendorService, setAuthToken } from '../../services/api';
import socket from '../../services/socket';
import { serif } from '../../theme/styles';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');

const PARTNER_ROLES = [
  { key: ROLES.PANDIT, label: 'Pandit', icon: 'fire' },
  { key: ROLES.ASTRO, label: 'Astrologer', icon: 'creation' },
  { key: ROLES.MANDALI, label: 'Mandali', icon: 'account-group' },
];

export default function LoginScreen({ navigation }) {
  const { register, setRole } = usePartner();

  const [selectedRole, setSelectedRole] = useState(ROLES.PANDIT);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const query = identifier.trim();
    const pass = password.trim();

    if (!query) {
      Alert.alert('Required', 'Please enter your mobile number or email');
      return;
    }
    if (!pass) {
      Alert.alert('Required', 'Please enter your account password');
      return;
    }

    setLoading(true);
    try {
      const res = await VendorService.login(query, pass);
      if (res?.success && res?.vendor) {
        if (res.token) setAuthToken(res.token);
        const v = res.vendor;
        const resolvedRole = selectedRole === ROLES.ASTRO ? ROLES.ASTRO : (v.role || selectedRole);
        setRole(resolvedRole);
        register({ ...v, role: resolvedRole }, res.token);

        const partnerId = v.id || v._id || (resolvedRole === ROLES.ASTRO ? 'ASTRO-7890' : 'PND-VERIFIED');
        socket.connect(res.token, partnerId);
        if (resolvedRole === ROLES.ASTRO || v.isAstroEnabled) {
          socket.emit('astro:online', {
            id: partnerId,
            vendorId: partnerId,
            name: v.name || 'आचार्य जी (Live Astrologer)',
            nameHi: v.name || 'आचार्य जी (Live Astrologer)',
            title:
              resolvedRole === ROLES.ASTRO
                ? 'सत्यापित वैदिक ज्योतिषाचार्य • पार्टनर ऐप लाइव'
                : 'सत्यापित वैदिक पंडित व ज्योतिषाचार्य • पार्टनर ऐप लाइव',
            isOnline: true,
            rates: { chat: 5, audio: 5, video: 5 },
            rating: 4.98,
            skills: ['Vedic', 'KP Astrology', 'Kundli'],
          });
        }

        const isApproved = v.status === 'Active' || v.kyc === 'Verified' || v.status === 'approved';
        const isIncomplete = v.profileCompleted === false || v.status === 'Incomplete';

        if (isApproved) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else if (isIncomplete) {
          Alert.alert(
            'Complete Your Profile',
            'Please complete your profile details and service selection for admin verification.'
          );
          navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
        } else {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Pending',
                params: {
                  email: v.email,
                  phone: v.phone,
                  name: v.name,
                  role: resolvedRole,
                },
              },
            ],
          });
        }
        return;
      } else {
        Alert.alert('Login Notice', res?.message || 'Invalid credentials. Please verify your mobile/email and password.');
      }
    } catch (err) {
      const errMsg = err?.message || 'Could not verify credentials.';
      Alert.alert('Login Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleContinue = () => {
    Alert.alert(
      'Google Sign-In',
      'Please sign in with your registered mobile number / email and password, or tap Sign Up to register as a Partner.'
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.container}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sacred Branding Header */}
          <View style={s.brandingContainer}>
            <Image source={TEMPLE_IMAGE} style={s.templeLogo} resizeMode="contain" />
            <Text style={s.brandTitle}>VaidicSanskar</Text>
            <Text style={s.brandPartner}>Vendor Partner</Text>
          </View>

          <Text style={s.welcomeHeading}>Welcome Back</Text>
          <Text style={s.welcomeSub}>Login to manage your services</Text>

          {/* Compact Role Pills */}
          <View style={s.roleSelector}>
            {PARTNER_ROLES.map((r) => {
              const isActive = selectedRole === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  activeOpacity={0.85}
                  onPress={() => setSelectedRole(r.key)}
                  style={[s.rolePill, isActive && s.rolePillActive]}
                >
                  <MaterialCommunityIcons
                    name={r.icon}
                    size={16}
                    color={isActive ? '#FFFFFF' : '#67101F'}
                  />
                  <Text style={[s.rolePillText, isActive && s.rolePillTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Clean Form Inputs matching Screen 2 */}
          <View style={s.form}>
            <View style={s.inputWrap}>
              <View style={s.inputIconCircle}>
                <MaterialCommunityIcons name="account-outline" size={18} color="#67101F" />
              </View>
              <TextInput
                style={s.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Mobile Number / Email"
                placeholderTextColor="#9A8588"
                autoCapitalize="none"
              />
            </View>

            <View style={s.inputWrap}>
              <View style={s.inputIconCircle}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#67101F" />
              </View>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#9A8588"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#7D686B"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleLogin}
              style={s.loginBtn}
              disabled={loading}
            >
              <Text style={s.loginBtnText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>or</Text>
              <View style={s.orLine} />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoogleContinue}
              style={s.googleBtn}
            >
              <MaterialCommunityIcons name="google" size={19} color="#DB4437" style={{ marginRight: 10 }} />
              <Text style={s.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Sign Up Link */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Register', { role: selectedRole })}
            style={s.registerLink}
          >
            <Text style={s.registerLinkText}>
              Don't have an account? <Text style={s.registerLinkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          {/* Subtle Lotus Ornament */}
          <View style={s.bottomOrnament}>
            <MaterialCommunityIcons name="spa" size={44} color="rgba(212, 139, 40, 0.2)" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF6EE' },
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    justifyContent: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  templeLogo: {
    width: 96,
    height: 78,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#67101F',
    fontFamily: serif,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  brandPartner: {
    fontSize: 12.5,
    color: '#7D686B',
    fontWeight: '600',
    marginTop: 2,
  },
  welcomeHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 13,
    color: '#7D686B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  rolePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DAC8',
    gap: 5,
  },
  rolePillActive: {
    backgroundColor: '#67101F',
    borderColor: '#67101F',
  },
  rolePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4A2B2F',
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DAC8',
    paddingHorizontal: 14,
    height: 54,
  },
  inputIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FDF3E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#2E1418',
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: '#67101F',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8DAC8',
  },
  orText: {
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: '#8B7578',
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DAC8',
    height: 50,
  },
  googleBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
  },
  registerLink: {
    marginTop: 22,
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 13.5,
    color: '#7D686B',
  },
  registerLinkBold: {
    color: '#67101F',
    fontWeight: '800',
  },
  bottomOrnament: {
    alignItems: 'center',
    marginTop: 18,
  },
});
