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
import colors from '../../theme/colors';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');

// Only the 3 partner roles (Merchant and Temple Admin completely removed)
const PARTNER_ROLES = [
  { key: ROLES.PANDIT, label: 'Pandit', icon: 'fire', sub: 'Pooja & Rituals' },
  { key: ROLES.ASTRO, label: 'Astrologer', icon: 'creation', sub: 'Kundali & Consultation' },
  { key: ROLES.MANDALI, label: 'Mandali', icon: 'account-group', sub: 'Bhajan & Kirtan' },
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
      Alert.alert('Required', 'Please enter your email or phone number');
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
        const resolvedRole = v.role || selectedRole;
        setRole(resolvedRole);
        register(v, res.token);

        // Immediate Live Socket Connection & Presence Broadcast
        socket.connect(res.token);
        socket.emit('astro:online', {
          id: v.id || v._id || 'V4569',
          vendorId: v.id || v._id || 'V4569',
          name: v.name || 'पंडित जी (Live Partner)',
          nameHi: v.name || 'पंडित जी (Live Partner)',
          title: 'सत्यापित वैदिक ज्योतिषी • पार्टनर ऐप लाइव',
          isOnline: true,
          rates: { chat: 5, audio: 5, video: 5 },
          rating: 5.0,
          skills: ['Vedic', 'KP Astrology', 'Kundli'],
        });

        const isApproved = v.status === 'Active' || v.kyc === 'Verified';
        const isIncomplete = v.profileCompleted === false || v.status === 'Incomplete';

        if (isApproved) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else if (isIncomplete) {
          Alert.alert(
            'Complete Your Profile',
            'Please complete your profile details and service selection for admin verification.'
          );
          navigation.reset({
            index: 0,
            routes: [{ name: 'ProfileSetup' }],
          });
        } else {
          // Awaiting Admin Verification / Approval
          navigation.reset({
            index: 0,
            routes: [{
              name: 'Pending',
              params: {
                email: v.email,
                phone: v.phone,
                name: v.name,
                role: resolvedRole,
              },
            }],
          });
        }
        return;
      } else {
        Alert.alert('Login Notice', res?.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      const errMsg = err?.message || 'Could not verify credentials.';
      Alert.alert('Login Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.container}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Temple Branding matching Screen 1 & 15 */}
          <View style={s.brandingContainer}>
            <Image
              source={TEMPLE_IMAGE}
              style={s.templeLogo}
              resizeMode="contain"
            />
            <Text style={s.brandTitle}>VaidicSanskar</Text>
            <Text style={s.brandTagline}>Service • Devotion • Trust</Text>
          </View>

          <View style={s.loginCard}>
            <Text style={s.loginHeading}>Partner Login</Text>
            <Text style={s.loginSub}>Sign in to manage your bookings and services</Text>

            {/* Role Switcher: ONLY 3 ROLES (Pandit, Astrologer, Mandali) */}
            <View style={s.roleSelector}>
              {PARTNER_ROLES.map((r) => {
                const isActive = selectedRole === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    activeOpacity={0.8}
                    onPress={() => setSelectedRole(r.key)}
                    style={[s.roleTab, isActive && s.roleTabActive]}
                  >
                    <MaterialCommunityIcons
                      name={r.icon}
                      size={20}
                      color={isActive ? '#FFFFFF' : '#7D686B'}
                    />
                    <Text style={[s.roleTabText, isActive && s.roleTabTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Inputs */}
            <View style={s.form}>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Mobile Number / Email</Text>
                <View style={s.inputWrap}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#7D686B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={s.input}
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="Enter phone or email"
                    placeholderTextColor="#A08E90"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Password</Text>
                <View style={s.inputWrap}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#7D686B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={s.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    placeholderTextColor="#A08E90"
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
            </View>

            {/* Switch to Registration */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Register')}
              style={s.registerLink}
            >
              <Text style={s.registerLinkText}>
                New Partner? <Text style={s.registerLinkBold}>Get Started / Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  templeLogo: {
    width: 140,
    height: 110,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#67101F',
    letterSpacing: 0.5,
    fontFamily: 'serif',
    marginTop: 4,
  },
  brandTagline: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 2,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E6DC',
  },
  loginHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E1418',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  loginSub: {
    fontSize: 12.5,
    color: '#7D686B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#F7EFE6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: '#67101F',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7D686B',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E1418',
  },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    paddingHorizontal: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#2E1418',
  },
  loginBtn: {
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
    marginTop: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 6,
  },
  registerLinkText: {
    fontSize: 13,
    color: '#7D686B',
  },
  registerLinkBold: {
    color: '#67101F',
    fontWeight: '700',
  },
});
