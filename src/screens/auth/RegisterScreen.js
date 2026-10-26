import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner, ROLES } from '../../context/PartnerContext';
import { VendorService, setAuthToken } from '../../services/api';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');

// Strictly only 3 partner roles (Merchant & Temple Admin removed)
const PARTNER_ROLES = [
  { key: ROLES.PANDIT, label: 'Pandit', icon: 'fire', sub: 'Pooja & Rituals' },
  { key: ROLES.ASTRO, label: 'Astrologer', icon: 'creation', sub: 'Kundali & Consultation' },
  { key: ROLES.MANDALI, label: 'Mandali', icon: 'account-group', sub: 'Bhajan & Kirtan' },
];

export default function RegisterScreen({ navigation, route }) {
  const { register, setRole } = usePartner();

  // Role
  const initialRole = route?.params?.role || ROLES.PANDIT;
  const [selectedRole, setSelectedRole] = useState(initialRole);

  // 3-Stage Flow: 1 = Basic Info, 2 = Verify Email OTP, 3 = Password Setup
  const [stage, setStage] = useState(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputs = useRef([]);

  // Resend Countdown Timer for Stage 2
  useEffect(() => {
    let timer;
    if (stage === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, countdown]);

  // STAGE 1: Send OTP to Email
  const handleSendEmailOtp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your full name or title.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert('Valid Email Required', 'Please enter a valid email address to receive your verification OTP.');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await VendorService.sendEmailOtp(trimmedEmail, trimmedName);
      if (res?.success) {
        if (res.otp || res.devOtp) {
          setDevOtpHint(String(res.otp || res.devOtp));
        }
        setStage(2);
        setCountdown(30);
        setCanResend(false);
        Alert.alert(
          'Verification Code Sent',
          res.message || `A 6-digit verification code has been dispatched to ${trimmedEmail}. Please check your inbox.`
        );
      } else {
        Alert.alert('Notice', res?.message || 'Could not send verification OTP. Please try again.');
      }
    } catch (err) {
      Alert.alert('Notice', err?.message || 'Network error while contacting authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // STAGE 2: Handle OTP Input
  const handleOtpChange = (val, idx) => {
    const clean = val.replace(/[^0-9]/g, '');
    const updated = [...otp];

    if (clean.length > 1) {
      // Pasted full OTP code
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        updated[i] = char;
      });
      setOtp(updated);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputs.current[nextIdx]?.focus();
      return;
    }

    updated[idx] = clean;
    setOtp(updated);

    if (clean && idx < 5) {
      otpInputs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  // STAGE 2: Verify Email OTP
  const handleVerifyOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const enteredOtp = otp.join('').trim();

    if (enteredOtp.length < 6) {
      Alert.alert('Enter Complete OTP', 'Please enter the complete 6-digit code received on your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await VendorService.verifyEmailOtp(trimmedEmail, enteredOtp);
      if (res?.success && res.verified) {
        setStage(3);
      } else {
        Alert.alert('Invalid Code', res?.message || 'The verification code entered does not match or has expired.');
      }
    } catch (err) {
      Alert.alert('Verification Notice', err?.message || 'Failed to verify OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      const res = await VendorService.sendEmailOtp(email.trim().toLowerCase(), name.trim());
      if (res?.success) {
        if (res.otp || res.devOtp) setDevOtpHint(String(res.otp || res.devOtp));
        setCountdown(30);
        setCanResend(false);
        Alert.alert('Code Resent', `A fresh verification code has been dispatched to ${email.trim()}.`);
      }
    } catch (err) {
      Alert.alert('Notice', 'Unable to resend OTP at this moment.');
    } finally {
      setLoading(false);
    }
  };

  // STAGE 3: Finalize Account Creation
  const handleCreateAccount = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Password Required', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Both passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
        role: selectedRole,
      };

      const res = await VendorService.registerAccount(payload);
      if (res?.success && res?.vendor) {
        if (res.token) {
          setAuthToken(res.token);
        }
        setRole(selectedRole);
        register(res.vendor, res.token);

        Alert.alert(
          'Account Created! 🕉️',
          'Your VaidicSanskar Partner account has been registered successfully. Let us now complete your profile.',
          [
            {
              text: 'Complete Profile',
              onPress: () => {
                navigation.replace('ProfileSetup');
              },
            },
          ]
        );
      } else {
        Alert.alert('Registration Notice', res?.message || 'Could not complete registration.');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Registration failed. Please check your network and try again.');
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
          {/* Header Branding */}
          <View style={s.brandingContainer}>
            <Image
              source={TEMPLE_IMAGE}
              style={s.templeLogo}
              resizeMode="contain"
            />
            <Text style={s.brandTitle}>VaidicSanskar</Text>
            <Text style={s.brandTagline}>Service • Devotion • Trust</Text>
          </View>

          {/* Registration Card */}
          <View style={s.card}>
            <Text style={s.heading}>Partner Sign Up</Text>
            <Text style={s.subHeading}>
              {stage === 1 && 'Register as a verified Vedic service partner'}
              {stage === 2 && 'Verify your email address via OTP'}
              {stage === 3 && 'Secure your account with a password'}
            </Text>

            {/* Step Indicator */}
            <View style={s.stepRow}>
              <View style={[s.stepBadge, stage >= 1 && s.stepBadgeActive]}>
                <Text style={[s.stepNum, stage >= 1 && s.stepNumActive]}>1</Text>
                <Text style={s.stepText}>Details</Text>
              </View>
              <View style={[s.stepDivider, stage >= 2 && s.stepDividerActive]} />
              <View style={[s.stepBadge, stage >= 2 && s.stepBadgeActive]}>
                <Text style={[s.stepNum, stage >= 2 && s.stepNumActive]}>2</Text>
                <Text style={s.stepText}>Email OTP</Text>
              </View>
              <View style={[s.stepDivider, stage >= 3 && s.stepDividerActive]} />
              <View style={[s.stepBadge, stage >= 3 && s.stepBadgeActive]}>
                <Text style={[s.stepNum, stage >= 3 && s.stepNumActive]}>3</Text>
                <Text style={s.stepText}>Security</Text>
              </View>
            </View>

            {/* STAGE 1: ROLE SELECTION & BASIC DETAILS */}
            {stage === 1 && (
              <View style={s.form}>
                <Text style={s.fieldLabel}>Select Your Service Category</Text>
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
                          size={18}
                          color={isActive ? '#FFFFFF' : '#7D686B'}
                        />
                        <Text style={[s.roleTabText, isActive && s.roleTabTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Name */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Full Name / Title</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#7D686B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={s.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Pandit Ji / Your Full Name"
                      placeholderTextColor="#A08E90"
                    />
                  </View>
                </View>

                {/* Mobile */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Mobile Number</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="phone-outline" size={20} color="#7D686B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={s.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#A08E90"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Email Address (For Verification OTP)</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#7D686B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={s.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="e.g. pandit@gmail.com"
                      placeholderTextColor="#A08E90"
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSendEmailOtp}
                  style={s.primaryBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={s.btnContent}>
                      <Text style={s.primaryBtnText}>Send Email OTP</Text>
                      <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STAGE 2: 6-DIGIT EMAIL OTP VERIFICATION */}
            {stage === 2 && (
              <View style={s.form}>
                <View style={s.emailNoticeBox}>
                  <MaterialCommunityIcons name="email-check-outline" size={24} color="#D4541B" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.emailNoticeTitle}>Verification Code Dispatched</Text>
                    <Text style={s.emailNoticeSub}>{email.trim()}</Text>
                  </View>
                </View>

                <Text style={[s.fieldLabel, { textAlign: 'center', marginTop: 12 }]}>
                  Enter 6-Digit Email OTP
                </Text>

                {/* 6 Digit Box Inputs */}
                <View style={s.otpContainer}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => (otpInputs.current[idx] = ref)}
                      style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={idx === 0 ? 6 : 1}
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Dev Hint if available */}
                {devOtpHint ? (
                  <View style={s.devHintBox}>
                    <Text style={s.devHintText}>Quick Code: {devOtpHint}</Text>
                  </View>
                ) : null}

                {/* Resend Timer */}
                <View style={s.resendRow}>
                  {canResend ? (
                    <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                      <Text style={s.resendActiveText}>Resend Verification Code</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={s.resendMutedText}>
                      Resend code in <Text style={{ fontWeight: '700' }}>00:{String(countdown).padStart(2, '0')}</Text>
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleVerifyOtp}
                  style={s.primaryBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={s.btnContent}>
                      <Text style={s.primaryBtnText}>Verify OTP & Continue</Text>
                      <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.secondaryBackBtn}
                  onPress={() => setStage(1)}
                  disabled={loading}
                >
                  <Text style={s.secondaryBackText}>← Change Email or Details</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STAGE 3: PASSWORD SETUP */}
            {stage === 3 && (
              <View style={s.form}>
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Create Password (Min 6 Characters)</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#7D686B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={s.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#A08E90"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#7D686B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Confirm Password</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="lock-check-outline" size={20} color="#7D686B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={s.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter password"
                      placeholderTextColor="#A08E90"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <MaterialCommunityIcons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#7D686B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleCreateAccount}
                  style={s.primaryBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={s.btnContent}>
                      <Text style={s.primaryBtnText}>Complete Sign Up</Text>
                      <MaterialCommunityIcons name="shield-check-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Link to Login */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
              style={s.loginLink}
            >
              <Text style={s.loginLinkText}>
                Already have an account? <Text style={s.loginLinkBold}>Login here</Text>
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
    paddingTop: 12,
    paddingBottom: 36,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  templeLogo: {
    width: 120,
    height: 95,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#67101F',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 2,
  },
  brandTagline: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 2,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#67101F',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 13,
    color: '#7D686B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepBadge: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  stepBadgeActive: {},
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFE7DF',
    color: '#7D686B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 2,
  },
  stepNumActive: {
    backgroundColor: '#67101F',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 10,
    color: '#7D686B',
    fontWeight: '600',
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: '#EFE7DF',
    marginHorizontal: 4,
    marginBottom: 14,
  },
  stepDividerActive: {
    backgroundColor: '#D4541B',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F5ECE1',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  roleTabActive: {
    backgroundColor: '#67101F',
    borderColor: '#67101F',
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D686B',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3437',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBF7',
    borderWidth: 1.2,
    borderColor: '#E5D6C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
  },
  primaryBtn: {
    backgroundColor: '#67101F',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emailNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#F3D4B8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  emailNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A1D08',
  },
  emailNoticeSub: {
    fontSize: 12,
    color: '#5C4033',
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
    paddingHorizontal: 6,
  },
  otpBox: {
    width: 44,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D8C3B1',
    backgroundColor: '#FFFDF9',
    fontSize: 20,
    fontWeight: '800',
    color: '#67101F',
  },
  otpBoxFilled: {
    borderColor: '#D4541B',
    backgroundColor: '#FFF8F2',
  },
  devHintBox: {
    backgroundColor: '#F3EDE4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  devHintText: {
    fontSize: 11,
    color: '#7D686B',
    fontWeight: '600',
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  resendActiveText: {
    color: '#D4541B',
    fontSize: 13,
    fontWeight: '700',
  },
  resendMutedText: {
    color: '#7D686B',
    fontSize: 13,
  },
  secondaryBackBtn: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  secondaryBackText: {
    color: '#7D686B',
    fontSize: 13,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 6,
  },
  loginLinkText: {
    fontSize: 13,
    color: '#7D686B',
  },
  loginLinkBold: {
    color: '#67101F',
    fontWeight: '700',
  },
});
