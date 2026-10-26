import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import styles, { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import panditBookingStore from '../../services/panditBookingStore';
import socket from '../../services/socket';
import api, { JobService } from '../../services/api';

const DECLINE_REASONS = [
  'वर्तमान समय में व्यस्त हूँ (Currently Busy)',
  'स्थान अत्यधिक दूर है (Location too far)',
  'पूजा सामग्री तुरंत उपलब्ध नहीं है (Samagri not ready)',
  'आपातकालीन कार्य (Personal emergency)',
];

export default function AcceptPoojaScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { vendor } = usePartner();
  const rawJob = route.params?.job || panditBookingStore.getBooking() || {};

  const [job, setJob] = useState(rawJob);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(DECLINE_REASONS[0]);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const bId = job?.id || job?.bookingId || job?.requestId || 'BK' + Date.now();
  const poojaName = job?.pooja?.name || job?.name || job?.ritualName || 'वैदिक पूजा';
  const yajmanName = job?.yajmanName || 'यजमान';
  const gotra = job?.gotra || 'काश्यप';
  const sankalp = job?.sankalpName || `${yajmanName} एवं सपरिवार`;
  const address = job?.address || job?.serviceAddress || 'यजमान स्थान (Live GPS)';
  const area = job?.area || job?.serviceArea || 'निकटतम क्षेत्र';
  const distanceKm = job?.distanceKm || '2.4';
  const etaMinutes = job?.etaMinutes || '12';
  const dakshina = Number(job?.dakshina || job?.serviceCharge || job?.price || 2500);
  const withSamagri = job?.withSamagri !== false;
  const samagriFee = withSamagri ? Number(job?.samagriFee || 600) : 0;
  const totalAmount = dakshina + samagriFee;

  useEffect(() => {
    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // 45s countdown
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 45000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDecline('Timeout expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // If job taken by another pandit
    const unsubTaken = socket.on('booking:taken', ({ bookingId }) => {
      if (bookingId === bId) {
        Alert.alert('कार्य अन्य पंडित द्वारा स्वीकृत', 'यह पूजा सेवा अन्य निकटवर्ती पंडित जी द्वारा स्वीकार कर ली गई है।');
        navigation.goBack();
      }
    });

    return () => {
      clearInterval(timer);
      pulseLoop.stop();
      if (typeof unsubTaken === 'function') unsubTaken();
    };
  }, []);

  const handleAccept = async () => {
    const partnerData = {
      id: vendor?.id || vendor?._id || 'PND-VERIFIED',
      name: vendor?.name || 'पंडित जी',
      phone: vendor?.phone || '',
      photo: vendor?.photo || null,
      rating: vendor?.rating || 5.0,
      experienceYears: vendor?.experienceYears || vendor?.experience || 5,
      gurukul: vendor?.gurukul || vendor?.bio || 'वैदिक आचार्य',
    };

    const acceptedBooking = {
      ...job,
      id: bId,
      bookingId: bId,
      status: 'ACCEPTED',
      assignedVendor: partnerData,
      pandit: partnerData,
      acceptedAt: new Date().toISOString(),
    };

    // 1. Reactive store
    panditBookingStore.setBooking(acceptedBooking);

    // 2. Socket real-time broadcast to devotee & admin
    socket.emit('job:accept', {
      job_id: bId,
      bookingId: bId,
      vendorId: partnerData.id,
      vendorDetails: partnerData,
      pandit: partnerData,
    });
    socket.emit('booking:accepted', acceptedBooking);
    socket.emit('instant:update', acceptedBooking);

    // 3. REST endpoints
    try {
      await JobService.accept(bId);
    } catch (_) {}
    api.put(`instant/${bId}/accept`).catch(() => {});

    // 4. Navigate directly to En Route screen
    navigation.replace('EnRoute', { job: acceptedBooking });
  };

  const handleDecline = (reason = selectedReason) => {
    socket.emit('job:decline', { job_id: bId, bookingId: bId, reason });
    try {
      JobService.decline(bId).catch(() => {});
    } catch (_) {}
    api.put(`instant/${bId}/decline`).catch(() => {});

    setShowDeclineModal(false);
    navigation.goBack();
  };

  const timerColor = secondsLeft <= 12 ? '#D13939' : colors.gold;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />

      {/* TOP COUNTDOWN BAR */}
      <View style={s.timerBarTrack}>
        <Animated.View
          style={[
            s.timerBarFill,
            {
              backgroundColor: timerColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* HEADER COUNTDOWN DISC */}
        <View style={s.headerRow}>
          <View>
            <View style={s.urgentBadge}>
              <View style={[s.liveDot, { backgroundColor: timerColor }]} />
              <Text style={[s.urgentText, { color: timerColor }]}>नई पूजा सेवा अनुरोध ({secondsLeft}s)</Text>
            </View>
            <Text style={s.brandTitle}>स्वीकृति अनुरोध</Text>
          </View>

          <Animated.View style={[s.timerCircle, { transform: [{ scale: pulseAnim }], borderColor: timerColor }]}>
            <Text style={[s.timerSec, { color: timerColor }]}>{secondsLeft}</Text>
            <Text style={s.timerSecLabel}>सेकंड</Text>
          </Animated.View>
        </View>

        {/* MAIN PUJA CARD */}
        <View style={s.mainCard}>
          <LinearGradient colors={['#67101F', '#490B15']} style={s.cardGrad}>
            <View style={s.cardTopRow}>
              <View style={s.omBadge}>
                <MaterialCommunityIcons name="om" size={26} color="#D48B28" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.pujaTitleHi}>{poojaName}</Text>
                <Text style={s.pujaSubTitle}>अनुमानित अवधि: ~2 - 2.5 घंटे</Text>
              </View>
            </View>

            <View style={s.payoutRow}>
              <View>
                <Text style={s.payoutLabel}>कुल देय दक्षिणा</Text>
                <Text style={s.payoutAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={s.payoutBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
                <Text style={s.payoutBadgeText}>100% वॉलेट में जमा</Text>
              </View>
            </View>
          </LinearGradient>

          {/* FARE BREAKDOWN */}
          <View style={s.fareBox}>
            <View style={s.fareRow}>
              <Text style={s.fareItem}>पूजा दक्षिणा (Pooja Dakshina)</Text>
              <Text style={s.fareVal}>₹{dakshina.toLocaleString('en-IN')}</Text>
            </View>
            {withSamagri ? (
              <View style={s.fareRow}>
                <Text style={s.fareItem}>सामग्री व्यवस्था भत्ता (Samagri)</Text>
                <Text style={s.fareVal}>₹{samagriFee.toLocaleString('en-IN')}</Text>
              </View>
            ) : null}
            <View style={[s.fareRow, { borderTopWidth: 1, borderTopColor: '#EDE4DA', paddingTop: 8, marginTop: 4 }]}>
              <Text style={[s.fareItem, { fontWeight: '700', color: colors.primary }]}>पंडित जी को कुल प्राप्ति</Text>
              <Text style={[s.fareVal, { fontWeight: '800', color: colors.primary }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* YAJMAN & SANKALP DETAILS */}
        <View style={s.sectionCard}>
          <Text style={s.sectionHeader}>यजमान एवं संकल्प विवरण</Text>
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="account-circle-outline" size={20} color={colors.gold} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.detailLabel}>यजमान का नाम</Text>
              <Text style={s.detailValue}>{yajmanName}</Text>
            </View>
          </View>
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="feather" size={20} color={colors.gold} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.detailLabel}>गोत्र</Text>
              <Text style={s.detailValue}>{gotra} गोत्र</Text>
            </View>
          </View>
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="hands-pray" size={20} color={colors.gold} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.detailLabel}>सपरिवार संकल्प</Text>
              <Text style={s.detailValue}>{sankalp}</Text>
            </View>
          </View>
        </View>

        {/* LOCATION & DISTANCE */}
        <View style={s.sectionCard}>
          <Text style={s.sectionHeader}>स्थान एवं दूरी</Text>
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color={colors.primary} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.detailLabel}>स्थान (Area)</Text>
              <Text style={s.detailValue}>{area}</Text>
              <Text style={s.detailSub}>{distanceKm} किमी दूर • पहुँचने का समय ~{etaMinutes} मिनट</Text>
            </View>
          </View>
          <View style={s.privacyNotice}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={s.privacyNoticeText}>स्वीकृति के पश्चात यजमान का पूर्ण पता एवं नेविगेशन तुरंत अनलॉक हो जाएगा।</Text>
          </View>
        </View>

        {/* SAMAGRI REQUIREMENT */}
        <View style={[s.sectionCard, { backgroundColor: withSamagri ? '#FDF6E8' : '#FFFFFF', borderColor: withSamagri ? colors.gold : colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name={withSamagri ? 'basket-check' : 'account-check'} size={24} color={colors.gold} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[s.sectionHeader, { marginBottom: 2 }]}>
                {withSamagri ? 'पंडित जी सामग्री साथ लाएंगे' : 'सामग्री यजमान द्वारा तैयार'}
              </Text>
              <Text style={s.detailSub}>
                {withSamagri
                  ? 'शुद्ध रोली, अक्षत, कलावा, धूप, दीप, अगरबत्ती, कपूर, हवन सामग्री एवं देशी घी साथ रखें।'
                  : 'यजमान ने घर पर पूजा सामग्री की संपूर्ण तैयारी कर रखी है।'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>

      {/* BOTTOM ACTIONS BAR */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={s.declineBtn}
          onPress={() => setShowDeclineModal(true)}
        >
          <Ionicons name="close" size={20} color="#D13939" />
          <Text style={s.declineBtnText}>अस्वीकार</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={s.acceptBtn}
          onPress={handleAccept}
        >
          <LinearGradient colors={['#1E8E4A', '#137338']} style={s.acceptBtnGrad}>
            <Ionicons name="checkmark-sharp" size={24} color="#FFFFFF" />
            <Text style={s.acceptBtnText}>स्वीकार करें (Accept)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* DECLINE REASONS MODAL */}
      <Modal visible={showDeclineModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>अस्वीकार करने का कारण चुनें</Text>
            <Text style={s.modalSub}>कृपया कारण बताएं ताकि यह अनुरोध निकटवर्ती अन्य योग्य पंडित जी को तुरंत प्रेषित किया जा सके:</Text>

            {DECLINE_REASONS.map((r, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                style={[s.reasonRow, selectedReason === r && s.reasonRowSelected]}
                onPress={() => setSelectedReason(r)}
              >
                <Ionicons
                  name={selectedReason === r ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedReason === r ? colors.primary : colors.textMuted}
                />
                <Text style={[s.reasonText, selectedReason === r && s.reasonTextSelected]}>{r}</Text>
              </TouchableOpacity>
            ))}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowDeclineModal(false)}>
                <Text style={s.modalCancelText}>रद्द करें</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={() => handleDecline()}>
                <Text style={s.modalConfirmText}>अस्वीकार करें</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF8F2' },
  timerBarTrack: { height: 4, width: '100%', backgroundColor: '#EFE5DC' },
  timerBarFill: { height: '100%' },
  content: { padding: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  urgentText: { fontSize: 13, fontWeight: '700' },
  brandTitle: { fontSize: 22, fontWeight: '800', color: colors.maroon, fontFamily: serif },
  timerCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', ...shadow },
  timerSec: { fontSize: 18, fontWeight: '900', lineHeight: 20 },
  timerSecLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted },
  mainCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 16, ...shadow },
  cardGrad: { padding: 18 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  omBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,139,40,0.5)' },
  pujaTitleHi: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', fontFamily: serif },
  pujaSubTitle: { fontSize: 12, color: '#F4D8DE', marginTop: 2 },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  payoutLabel: { fontSize: 12, color: '#F4D8DE', fontWeight: '500' },
  payoutAmount: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  payoutBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12 },
  payoutBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginLeft: 4 },
  fareBox: { padding: 14, backgroundColor: '#FAF5EE' },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  fareItem: { fontSize: 13, color: colors.textMuted },
  fareVal: { fontSize: 13, fontWeight: '600', color: colors.text },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 14, ...shadow },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: colors.maroon, fontFamily: serif, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  detailLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 1 },
  detailSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  privacyNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successBg, padding: 10, borderRadius: 10, marginTop: 10 },
  privacyNoticeText: { fontSize: 11, color: colors.successText, flex: 1, marginLeft: 8, fontWeight: '600', lineHeight: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDE4DA', ...shadow },
  declineBtn: { flex: 0.35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#D13939', borderRadius: 16, paddingVertical: 14, marginRight: 12 },
  declineBtnText: { color: '#D13939', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  acceptBtn: { flex: 0.65, borderRadius: 16, overflow: 'hidden', ...shadow },
  acceptBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  acceptBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, ...shadow },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.maroon, fontFamily: serif },
  modalSub: { fontSize: 12, color: colors.textMuted, marginTop: 6, marginBottom: 16, lineHeight: 17 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, marginBottom: 6 },
  reasonRowSelected: { backgroundColor: '#FDF6E8' },
  reasonText: { fontSize: 13, color: colors.text, marginLeft: 10, flex: 1 },
  reasonTextSelected: { fontWeight: '700', color: colors.maroon },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 14 },
  modalCancelText: { color: colors.textMuted, fontWeight: '600' },
  modalConfirm: { backgroundColor: '#D13939', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '700' },
});
