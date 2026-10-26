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
import panditBookingStore from '../../services/panditBookingStore';
import socket from '../../services/socket';
import api from '../../services/api';

export default function StartOtpScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(
    () => panditBookingStore.getBooking() || route.params?.job || {}
  );

  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);

  const [checklist, setChecklist] = useState({
    panchamrit: true,
    roliAkshat: true,
    kalashJaneu: true,
    havanKund: true,
    gheeSamagri: true,
  });

  const bId = booking?.id || booking?.bookingId || 'BK' + Date.now();
  const poojaName = booking?.pooja?.name || booking?.name || 'वैदिक पूजा';
  const yajmanName = booking?.yajmanName || 'यजमान';

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

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      Alert.alert('अधूरा OTP', 'कृपया 4-अंकों का Start OTP दर्ज करें।');
      return;
    }

    setLoading(true);

    // 1. Verify in reactive store
    const storeRes = panditBookingStore.verifyStartOtp(code);
    if (!storeRes.success) {
      Alert.alert('अमान्य OTP', storeRes.message || 'OTP मेल नहीं खा रहा है। कृपया यजमान से पुनः पुष्टि करें।');
      setLoading(false);
      return;
    }

    // 2. Broadcast across WebSocket so Devotee screen updates to "Pooja In Progress"
    socket.emit('booking:pooja_started', { bookingId: bId });

    // 3. REST API update
    try {
      await api.put(`instant/${bId}/start`, { startOtp: code, otp: code });
    } catch (_) { }

    setLoading(false);

    // 4. Navigate directly to active Pooja In Progress screen
    navigation.replace('PoojaInProgress', { job: panditBookingStore.getBooking() });
  };

  const toggleCheck = (k) => {
    setChecklist((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <SafeAreaView style={s.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <Header title="पूजा प्रारंभ OTP सत्यापन" subtitle="चरण 2: यजमान सत्यापन" navigation={navigation} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ARRIVAL BADGE */}
        <View style={s.arrivedBanner}>
          <LinearGradient colors={['#1E8E4A', '#137338']} style={s.arrivedGrad}>
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.arrivedTitle}>स्थान पर आगमन सत्यापित</Text>
              <Text style={s.arrivedSub}>जियोफेंस सीमा के अंतर्गत (Within 200m)</Text>
            </View>
          </LinearGradient>
        </View>

        {/* OTP INPUT CARD */}
        <View style={s.otpCard}>
          <View style={s.iconCircle}>
            <MaterialCommunityIcons name="lock-open-check" size={32} color={colors.gold} />
          </View>

          <Text style={s.cardHeading}>यजमान का Start OTP दर्ज करें</Text>
          <Text style={s.cardDesc}>
            यजमान <Text style={{ fontWeight: '700', color: colors.primary }}>{yajmanName}</Text> जी की मोबाइल स्क्रीन पर 4-अंकों का प्रारंभ कोड प्रदर्शित हो रहा है।
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

          <View style={s.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={s.hintText}>
              यह कोड दर्ज करते ही पूजा की आधिकारिक शुरुआत दर्ज हो जाएगी।
            </Text>
          </View>
        </View>

        {/* SAMAGRI READINESS CHECKLIST */}
        <View style={s.card}>
          <Text style={s.checklistTitle}>पूजा सामग्री तत्परता सूची</Text>
          <Text style={s.checklistSub}>पूजा प्रारंभ करने से पूर्व सामग्री सुनिश्चित कर लें:</Text>

          <TouchableOpacity style={s.checkRow} onPress={() => toggleCheck('panchamrit')}>
            <Ionicons
              name={checklist.panchamrit ? 'checkbox' : 'square-outline'}
              size={20}
              color={checklist.panchamrit ? colors.success : colors.textMuted}
            />
            <Text style={s.checkLabel}>पंचामृत, गंगाजल एवं शुद्ध जल पात्र</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.checkRow} onPress={() => toggleCheck('roliAkshat')}>
            <Ionicons
              name={checklist.roliAkshat ? 'checkbox' : 'square-outline'}
              size={20}
              color={checklist.roliAkshat ? colors.success : colors.textMuted}
            />
            <Text style={s.checkLabel}>रोली, अक्षत, हल्दी, चंदन, मौली कलावा</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.checkRow} onPress={() => toggleCheck('kalashJaneu')}>
            <Ionicons
              name={checklist.kalashJaneu ? 'checkbox' : 'square-outline'}
              size={20}
              color={checklist.kalashJaneu ? colors.success : colors.textMuted}
            />
            <Text style={s.checkLabel}>ताम्र कलश, नारियल, आम्रपल्लव व जनेऊ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.checkRow} onPress={() => toggleCheck('havanKund')}>
            <Ionicons
              name={checklist.havanKund ? 'checkbox' : 'square-outline'}
              size={20}
              color={checklist.havanKund ? colors.success : colors.textMuted}
            />
            <Text style={s.checkLabel}>हवन कुंड, समिधा काष्ठ व कपूर</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.checkRow} onPress={() => toggleCheck('gheeSamagri')}>
            <Ionicons
              name={checklist.gheeSamagri ? 'checkbox' : 'square-outline'}
              size={20}
              color={checklist.gheeSamagri ? colors.success : colors.textMuted}
            />
            <Text style={s.checkLabel}>शुद्ध देशी गोघृत एवं हवन सामग्री पैकेट</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>

      {/* BOTTOM SUBMIT BUTTON */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={s.verifyBtn}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          <LinearGradient colors={['#D48B28', '#A96814']} style={s.verifyBtnGrad}>
            <MaterialCommunityIcons name="fire" size={24} color="#FFFFFF" />
            <Text style={s.verifyBtnText}>
              {loading ? 'सत्यापन जारी...' : 'OTP सत्यापित करें व पूजा प्रारंभ करें'}
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
  arrivedBanner: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, ...shadow },
  arrivedGrad: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  arrivedTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', fontFamily: serif },
  arrivedSub: { fontSize: 11, color: '#D1FAE5', marginTop: 1 },
  otpCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EDE4DA', alignItems: 'center', marginBottom: 16, ...shadow },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FDF6E8', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.gold, marginBottom: 12 },
  cardHeading: { fontSize: 18, fontWeight: '800', color: colors.maroon, fontFamily: serif, textAlign: 'center' },
  cardDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18, paddingHorizontal: 10 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 22 },
  otpBox: { width: 56, height: 64, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FAF5EE', textAlign: 'center', fontSize: 26, fontWeight: '900', color: colors.maroon, ...shadow },
  otpBoxFilled: { borderColor: colors.gold, backgroundColor: '#FFFFFF', borderWidth: 2 },
  hintBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF8F0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  hintText: { fontSize: 11, color: colors.textMuted, marginLeft: 6, flex: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 14, ...shadow },
  checklistTitle: { fontSize: 15, fontWeight: '800', color: colors.maroon, fontFamily: serif },
  checklistSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkLabel: { fontSize: 13, color: colors.text, marginLeft: 10 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDE4DA', ...shadow },
  verifyBtn: { borderRadius: 16, overflow: 'hidden', ...shadow },
  verifyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  verifyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginLeft: 8 },
});
