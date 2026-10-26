import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import styles, { serif, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import { usePartner } from '../../context/PartnerContext';
import panditBookingStore from '../../services/panditBookingStore';
import socket from '../../services/socket';
import api, { JobService } from '../../services/api';

export default function CompletionOtpScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { addEarning } = usePartner();
  const rawJob = route.params?.job || panditBookingStore.getBooking() || {};
  const [job, setJob] = useState(rawJob);

  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);

  const bId = job?.id || job?.bookingId || 'BK' + Date.now();
  const poojaName = job?.pooja?.name || job?.name || 'वैदिक पूजा';
  const yajmanName = job?.yajmanName || 'यजमान';
  const dakshina = Number(job?.dakshina || job?.serviceCharge || job?.price || 2500);
  const withSamagri = job?.withSamagri !== false;
  const samagriFee = withSamagri ? Number(job?.samagriFee || 600) : 0;
  const totalPayout = dakshina + samagriFee;
  const duration = job?.formattedDuration || '1 घंटा 45 मिनट';

  const handleOtpChange = (val, idx) => {
    const updated = [...otp];
    updated[idx] = val.slice(-1);
    setOtp(updated);

    if (val && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyCompletion = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      Alert.alert('अधूरा OTP', 'कृपया 4-अंकों का Completion OTP दर्ज करें।');
      return;
    }

    setLoading(true);

    // 1. Verify in reactive store
    const storeRes = panditBookingStore.verifyCompleteOtp(code);
    if (!storeRes.success) {
      Alert.alert('अमान्य OTP', storeRes.message || 'OTP मेल नहीं खा रहा है। कृपया यजमान से पुनः पुष्टि करें।');
      setLoading(false);
      return;
    }

    // 2. Broadcast across WebSocket so Devotee screen updates to "COMPLETED"
    socket?.emit?.('booking:completed', { bookingId: bId });
    socket?.emit?.('instant:update', { id: bId, bookingId: bId, status: 'COMPLETED' });

    // 3. REST endpoints
    try {
      await JobService.complete(bId, code);
    } catch (_) { }
    api.put(`instant/${bId}/complete`, { endOtp: code, completeOtp: code, otp: code }).catch(() => { });

    // 4. Credit Pandit Wallet
    try {
      addEarning?.(totalPayout, poojaName);
    } catch (_) { }

    setLoading(false);

    // 5. Navigate to completion celebration / review screen
    navigation.replace('PoojaCompleted', {
      job: {
        ...job,
        totalPayout,
        poojaName,
        yajmanName,
      },
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <Header title="पूजा समापन एवं दक्षिणा प्राप्ति" subtitle="चरण 3: अंतिम OTP सत्यापन" navigation={navigation} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* RITUAL COMPLETED SUMMARY BANNER */}
        <View style={s.summaryBanner}>
          <LinearGradient colors={['#67101F', '#490B15']} style={s.summaryGrad}>
            <View style={s.omCircle}>
              <MaterialCommunityIcons name="om" size={28} color="#D48B28" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.summaryTitle}>{poojaName}</Text>
              <Text style={s.summarySub}>यजमान: {yajmanName} • अवधि: {duration}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* OTP INPUT CARD */}
        <View style={s.otpCard}>
          <View style={s.iconCircle}>
            <MaterialCommunityIcons name="shield-key" size={34} color={colors.gold} />
          </View>

          <Text style={s.cardHeading}>यजमान का Completion OTP दर्ज करें</Text>
          <Text style={s.cardDesc}>
            पूजा समाप्ति पर यजमान की ऐप पर 4-अंकों का Completion OTP प्रदर्शित होता है। यह कोड दर्ज करते ही दक्षिणा राशि तुरंत आपके खाते में जमा हो जाएगी।
          </Text>

          {/* 4 OTP BOXES */}
          <View style={s.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => (inputRefs.current[i] = r)}
                style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                autoFocus={i === 0}
              />
            ))}
          </View>

          {/* INSTANT PAYOUT BADGE */}
          <View style={s.payoutBadge}>
            <Ionicons name="cash-outline" size={20} color={colors.success} />
            <Text style={s.payoutBadgeText}>
              सत्यापन पर वॉलेट में जमा: <Text style={{ fontWeight: '900' }}>₹{totalPayout.toLocaleString('en-IN')}</Text>
            </Text>
          </View>
        </View>

        {/* PAYOUT BREAKDOWN CARD */}
        <View style={s.breakdownCard}>
          <Text style={s.breakdownHeading}>दक्षिणा विवरण (Payout Breakdown)</Text>
          <View style={s.breakdownRow}>
            <Text style={s.breakdownLabel}>पूजा दक्षिणा (Pooja Dakshina)</Text>
            <Text style={s.breakdownVal}>₹{dakshina.toLocaleString('en-IN')}</Text>
          </View>
          {withSamagri ? (
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLabel}>सामग्री शुल्क (Samagri Allowance)</Text>
              <Text style={s.breakdownVal}>₹{samagriFee.toLocaleString('en-IN')}</Text>
            </View>
          ) : null}
          <View style={[s.breakdownRow, { borderTopWidth: 1, borderTopColor: '#EDE4DA', paddingTop: 8, marginTop: 4 }]}>
            <Text style={[s.breakdownLabel, { fontWeight: '700', color: colors.primary }]}>कुल देय राशि</Text>
            <Text style={[s.breakdownVal, { fontWeight: '900', color: colors.success, fontSize: 16 }]}>
              ₹{totalPayout.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={s.verifyBtn}
          onPress={handleVerifyCompletion}
          disabled={loading}
        >
          <LinearGradient colors={['#1E8E4A', '#137338']} style={s.verifyBtnGrad}>
            <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
            <Text style={s.verifyBtnText}>
              {loading ? 'सत्यापन जारी...' : 'सत्यापित करें व कार्य संपन्न करें'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF8F2' },
  content: { padding: 18 },
  summaryBanner: { borderRadius: 18, overflow: 'hidden', marginBottom: 16, ...shadow },
  summaryGrad: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  omCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D48B28' },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', fontFamily: serif },
  summarySub: { fontSize: 12, color: '#F4D8DE', marginTop: 2 },
  otpCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EDE4DA', alignItems: 'center', marginBottom: 16, ...shadow },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FDF6E8', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.gold, marginBottom: 12 },
  cardHeading: { fontSize: 18, fontWeight: '800', color: colors.maroon, fontFamily: serif, textAlign: 'center' },
  cardDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18, paddingHorizontal: 8 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 22 },
  otpBox: { width: 56, height: 64, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FAF5EE', textAlign: 'center', fontSize: 26, fontWeight: '900', color: colors.maroon, ...shadow },
  otpBoxFilled: { borderColor: colors.gold, backgroundColor: '#FFFFFF', borderWidth: 2 },
  payoutBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  payoutBadgeText: { fontSize: 13, color: colors.successText, marginLeft: 8 },
  breakdownCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 14, ...shadow },
  breakdownHeading: { fontSize: 14, fontWeight: '800', color: colors.maroon, fontFamily: serif, marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  breakdownLabel: { fontSize: 13, color: colors.textMuted },
  breakdownVal: { fontSize: 13, fontWeight: '700', color: colors.text },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDE4DA', ...shadow },
  verifyBtn: { borderRadius: 16, overflow: 'hidden', ...shadow },
  verifyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  verifyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginLeft: 8 },
});
