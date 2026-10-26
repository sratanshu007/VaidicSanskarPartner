import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
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

const VIDHI_STEPS = [
  { id: '1', name: 'स्वस्तिवाचनम् एवं दीप प्रज्वलन', desc: 'पवित्रीकरण, आचमन, तिलक एवं दीप पूजन' },
  { id: '2', name: 'गणेश-अंबिका पूजन एवं कलश स्थापना', desc: 'विघ्नहर्ता गणेश जी एवं वरुण देवता का आवाहन' },
  { id: '3', name: 'नवग्रह मंडल पूजन', desc: 'सूर्य आदि नवग्रहों की शांति एवं अनुकूलता हेतु अर्चन' },
  { id: '4', name: 'मुख्य सत्यनारायण कथा / पूजन विधि', desc: 'पंच अध्याय पावन कथा, शंखनाद एवं भोग अर्पण' },
  { id: '5', name: 'हवन यज्ञ, 108 आहुति व पूर्णाहुति', desc: 'पवित्र अग्नि में घृत व सामग्री की आहुतियां' },
  { id: '6', name: 'महाआरती, पुष्पांजलि एवं शांति संकल्प', desc: 'कर्पूर आरती, चरणामृत वितरण एवं दक्षिणा संकल्प' },
];

const SACRED_MANTRAS = [
  {
    title: 'शांति पाठ (Shanti Path)',
    mantra: 'ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः।\nवनस्पतयः शान्तिर्विश्वेदेवाः शान्तिर्ब्रह्म शान्तिः सर्वं शान्तिः शान्तिरेव शान्तिः सा मा शान्तिरेधि॥',
  },
  {
    title: 'गायत्री महामंत्र (Gayatri Mantra)',
    mantra: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥',
  },
  {
    title: 'महामृत्युंजय मंत्र (Maha Mrityunjaya)',
    mantra: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥',
  },
];

export default function PoojaInProgressScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(
    () => panditBookingStore.getBooking() || route.params?.job || {}
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(120);
  const [completedSteps, setCompletedSteps] = useState({ '1': true, '2': true });
  const [showMantraModal, setShowMantraModal] = useState(false);

  const bId = booking?.id || booking?.bookingId || 'BK' + Date.now();
  const poojaName = booking?.pooja?.name || booking?.name || 'वैदिक पूजा';
  const yajmanName = booking?.yajmanName || 'यजमान';
  const gotra = booking?.gotra || 'काश्यप';
  const sankalp = booking?.sankalpName || `${yajmanName} एवं सपरिवार`;

  useEffect(() => {
    socket?.join?.(bId);

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [bId]);

  const toggleStep = (id) => {
    setCompletedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTimer = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => (n < 10 ? '0' + n : n);
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  // Pandit finishes the ritual -> requests Completion OTP
  const handleProceedToCompletion = async () => {
    // Notify server & devotee over WebSocket to show Completion OTP
    socket?.emit?.('booking:completion_requested', {
      bookingId: bId,
      completeOtp: booking?.completeOtp,
    });
    socket?.emit?.('instant:update', {
      id: bId,
      bookingId: bId,
      status: 'COMPLETION_REQUESTED',
      completeOtp: booking?.completeOtp,
    });

    try {
      await api.post(`bookings/${bId}/request-complete`);
    } catch (_) {}

    navigation.replace('CompletionOtp', {
      job: {
        ...booking,
        elapsedSeconds,
        formattedDuration: formatTimer(elapsedSeconds),
      },
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#4A0C13" />

      {/* TOP IN-PROGRESS BANNER */}
      <LinearGradient colors={['#5A1017', '#3C060F']} style={s.topBanner}>
        <View style={s.topNavRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backIcon}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.liveStatusBadge}>
            <View style={s.pulseDot} />
            <Text style={s.liveStatusText}>पूजा विधि विधान जारी है</Text>
          </View>
          <TouchableOpacity onPress={() => setShowMantraModal(true)} style={s.mantraBtn}>
            <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#D48B28" />
          </TouchableOpacity>
        </View>

        {/* TIMER DISC */}
        <View style={s.timerCenter}>
          <View style={s.flameGlow}>
            <MaterialCommunityIcons name="fire" size={36} color="#F7C966" />
          </View>
          <Text style={s.timerDigits}>{formatTimer(elapsedSeconds)}</Text>
          <Text style={s.timerSubLabel}>सक्रिय पूजा समयावधि (Active Duration)</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* DEVOTEE & SANKALP SUMMARY */}
        <View style={s.sankalpCard}>
          <View style={s.cardHeaderRow}>
            <MaterialCommunityIcons name="om" size={22} color={colors.gold} />
            <Text style={s.cardTitle}>यजमान संकल्प विवरण</Text>
          </View>
          <Text style={s.sankalpPooja}>{poojaName}</Text>
          <View style={s.sankalpRow}>
            <Text style={s.sankalpLabel}>यजमान:</Text>
            <Text style={s.sankalpVal}>{yajmanName} ({gotra} गोत्र)</Text>
          </View>
          <View style={s.sankalpRow}>
            <Text style={s.sankalpLabel}>संकल्प:</Text>
            <Text style={s.sankalpVal}>{sankalp}</Text>
          </View>
        </View>

        {/* STEP BY STEP VIDHI CHECKLIST */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <MaterialCommunityIcons name="format-list-checks" size={22} color={colors.primary} />
            <Text style={s.cardTitle}>वैदिक विधि-विधान चरण सूची</Text>
          </View>
          <Text style={s.stepDesc}>प्रत्येक विधि पूर्ण होने पर टिक करें:</Text>

          {VIDHI_STEPS.map((step) => {
            const isDone = !!completedSteps[step.id];
            return (
              <TouchableOpacity
                key={step.id}
                activeOpacity={0.8}
                style={[s.stepItem, isDone && s.stepItemDone]}
                onPress={() => toggleStep(step.id)}
              >
                <Ionicons
                  name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isDone ? colors.success : colors.textMuted}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[s.stepName, isDone && s.stepNameDone]}>
                    {step.id}. {step.name}
                  </Text>
                  <Text style={s.stepSub}>{step.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={s.completeBtn}
          onPress={handleProceedToCompletion}
        >
          <LinearGradient colors={['#D48B28', '#A96814']} style={s.completeBtnGrad}>
            <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
            <Text style={s.completeBtnText}>पूजा संपन्न करें व समाप्ति OTP मांगें</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SACRED MANTRAS HELPER MODAL */}
      <Modal visible={showMantraModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalTop}>
              <Text style={s.modalHeading}>वैदिक शांति पाठ एवं मंत्र</Text>
              <TouchableOpacity onPress={() => setShowMantraModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {SACRED_MANTRAS.map((m, i) => (
                <View key={i} style={s.mantraItem}>
                  <Text style={s.mantraTitle}>{m.title}</Text>
                  <Text style={s.mantraText}>{m.mantra}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF8F2' },
  topBanner: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 22, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, ...shadow },
  topNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backIcon: { padding: 6 },
  liveStatusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F7C966', marginRight: 6 },
  liveStatusText: { color: '#F4D8DE', fontSize: 12, fontWeight: '700' },
  mantraBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  timerCenter: { alignItems: 'center', marginTop: 12 },
  flameGlow: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(212,139,40,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D48B28', marginBottom: 6 },
  timerDigits: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  timerSubLabel: { fontSize: 12, color: '#F4D8DE', marginTop: 2 },
  content: { padding: 18 },
  sankalpCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 14, ...shadow },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.maroon, fontFamily: serif, marginLeft: 8 },
  sankalpPooja: { fontSize: 17, fontWeight: '800', color: colors.primary, fontFamily: serif, marginBottom: 8 },
  sankalpRow: { flexDirection: 'row', paddingVertical: 3 },
  sankalpLabel: { width: 70, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  sankalpVal: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 14, ...shadow },
  stepDesc: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  stepItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, marginBottom: 6, backgroundColor: '#FAF5EE', borderWidth: 1, borderColor: 'transparent' },
  stepItemDone: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  stepName: { fontSize: 14, fontWeight: '700', color: colors.text },
  stepNameDone: { color: colors.success, textDecorationLine: 'none' },
  stepSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDE4DA', ...shadow },
  completeBtn: { borderRadius: 16, overflow: 'hidden', ...shadow },
  completeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  completeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', ...shadow },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalHeading: { fontSize: 18, fontWeight: '800', color: colors.maroon, fontFamily: serif },
  mantraItem: { backgroundColor: '#FAF5EE', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EDE4DA' },
  mantraTitle: { fontSize: 14, fontWeight: '800', color: colors.maroon, marginBottom: 6 },
  mantraText: { fontSize: 14, color: '#332024', lineHeight: 22, fontFamily: serif },
});
