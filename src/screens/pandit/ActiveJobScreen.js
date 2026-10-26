import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import panditBookingStore from '../../services/panditBookingStore';
import { io } from 'socket.io-client';
import api, { BASE_URL, getAuthToken, JobService } from '../../services/api';

export default function ActiveJobScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(panditBookingStore.getBooking());
  const socketRef = useRef(null);

  // Local simulated distance for geofence check (meters)
  const [distanceMeters, setDistanceMeters] = useState(120);

  // OTP inputs
  const [startOtp, setStartOtp] = useState(['', '', '', '']);
  const [completeOtp, setCompleteOtp] = useState(['', '', '', '']);
  const startInputRefs = useRef([]);
  const completeInputRefs = useRef([]);

  // Samagri checklist items
  const [checklist, setChecklist] = useState({
    panchamrit: true,
    roliAkshat: true,
    kalashJaneu: true,
    havanKund: false,
    gheeSamagri: false,
    pushpMala: true,
  });

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Subscribe to store updates and socket
  useEffect(() => {
    // If no booking in store, initialize one from route or default
    if (!panditBookingStore.getBooking()) {
      panditBookingStore.createBooking({
        pooja: route.params?.job?.pooja,
      });
      panditBookingStore.acceptBooking();
    }

    const unsub = panditBookingStore.subscribe((b) => {
      setBooking(b ? { ...b } : null);
    });

    try {
      const socketHost = (process.env.EXPO_PUBLIC_SOCKET_URL || BASE_URL).replace(/\/api\/partner\/?$/, '').replace(/\/api\/?$/, '');
      const token = getAuthToken();
      const s = io(socketHost, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 8000,
      });
      socketRef.current = s;
      const bId = booking?.id || route?.params?.job?.id;
      if (bId) {
        s.emit('booking:join', { bookingId: bId });
      }
    } catch (e) {
      console.log('ActiveJob socket init notice:', e?.message);
    }

    return () => {
      if (typeof unsub === 'function') unsub();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  if (!booking) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={s.noBookingText}>कोई सक्रिय पूजा कार्य नहीं है।</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>डैशबोर्ड पर लौटें</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { status, pooja, address, area, landmark, yajmanName, gotra, sankalpName, startOtp: expectedStart, completeOtp: expectedComplete } = booking;

  // Open GPS maps navigation
  const openNavigation = () => {
    const q = encodeURIComponent(`${address || area || 'Live Yajman Location'}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${q}`,
      android: `geo:0,0?q=${q}`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`)
    );
  };

  // Masked virtual call
  const handleVirtualCall = () => {
    Alert.alert(
      'सुरक्षित वर्चुअल कॉलिंग (Masked Call)',
      'वर्चुअल नंबर: +91 11 4084 4892\n\nयजमान व पंडित जी दोनों का व्यक्तिगत मोबाइल नंबर 100% सुरक्षित और छुपा हुआ है।',
      [
        { text: 'रद्द करें', style: 'cancel' },
        { text: 'कॉल मिलाएं', onPress: () => Linking.openURL('tel:+911140844892') },
      ]
    );
  };

  // Step 1: Pandit sets On The Way
  const handleOnTheWay = () => {
    panditBookingStore.setOnTheWay();
    if (socketRef.current && booking?.id) {
      socketRef.current.emit('vendor:location', {
        bookingId: booking.id,
        latitude: 28.5355,
        longitude: 77.3910,
        distanceKm: 2.1,
        etaMinutes: 12,
      });
    }
  };

  // Step 2: Pandit sets Arrived (Geofence check 200m)
  const handleArrived = () => {
    const res = panditBookingStore.setArrived(distanceMeters);
    if (!res.success) {
      Alert.alert('जियोफेंस सीमा त्रुटि', res.message);
    } else {
      if (socketRef.current && booking?.id) {
        socketRef.current.emit('booking:arrived', { bookingId: booking.id });
      }
      if (booking?.id) {
        api.put(`instant/${booking.id}/arrived`).catch(() => { });
      }
    }
  };

  // Step 3: Pandit enters Start OTP (provided by Yajman)
  const handleVerifyStartOtp = () => {
    const code = startOtp.join('');
    if (code.length < 4) {
      Alert.alert('त्रुटि', 'कृपया 4-अंकों का Start OTP दर्ज करें।');
      return;
    }
    const res = panditBookingStore.verifyStartOtp(code);
    if (!res.success) {
      Alert.alert('अमान्य OTP', res.message);
    } else {
      if (socketRef.current && booking?.id) {
        socketRef.current.emit('booking:pooja_started', { bookingId: booking.id });
      }
      if (booking?.id) {
        api.put(`instant/${booking.id}/start`, { startOtp: code, otp: code }).catch(() => { });
      }
    }
  };

  // Step 4: Pandit enters Complete OTP (provided by Yajman)
  const handleVerifyCompleteOtp = () => {
    const code = completeOtp.join('');
    if (code.length < 4) {
      Alert.alert('त्रुटि', 'कृपया 4-अंकों का Complete OTP दर्ज करें।');
      return;
    }
    const res = panditBookingStore.verifyCompleteOtp(code);
    if (!res.success) {
      Alert.alert('अमान्य OTP', res.message);
    } else {
      if (socketRef.current && booking?.id) {
        socketRef.current.emit('booking:completed', { bookingId: booking.id });
      }
      if (booking?.id) {
        api.put(`instant/${booking.id}/complete`, { endOtp: code, completeOtp: code, otp: code }).catch(() => { });
        JobService.complete(booking.id, code).catch(() => { });
      }
      navigation.replace('Review', { name: yajmanName, job: booking });
    }
  };

  // Pandit cancellation (with penalty warning)
  const handleCancelBooking = () => {
    panditBookingStore.cancelBooking('pandit', 'पंडित जी की ओर से आपातकालीन निरस्तीकरण');
    setShowCancelModal(false);
    Alert.alert(
      'बुकिंग रद्द की गई',
      'स्वीकृति के बाद रद्द करने पर ₹50 पेनल्टी आपके अगले भुगतान से समायोजित की जाएगी।',
      [{ text: 'ठीक है', onPress: () => navigation.goBack() }]
    );
  };

  // Helper format seconds
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={s.container}>
      <Header
        title={pooja?.name || 'सक्रिय पूजा सेवा'}
        subtitle={`स्थिति: ${status}`}
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Lifecycle Stepper */}
        <View style={s.stepperCard}>
          <View style={s.stepRow}>
            <StepItem
              label="स्वीकृत"
              icon="check-circle"
              active={['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(status)}
            />
            <View style={[s.stepLine, status !== 'ACCEPTED' && s.stepLineActive]} />
            <StepItem
              label="मार्ग में"
              icon="bike-fast"
              active={['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(status)}
            />
            <View style={[s.stepLine, ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(status) && s.stepLineActive]} />
            <StepItem
              label="पहुँच गए"
              icon="map-marker-check"
              active={['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(status)}
            />
            <View style={[s.stepLine, ['IN_PROGRESS', 'COMPLETED'].includes(status) && s.stepLineActive]} />
            <StepItem
              label="पूजा जारी"
              icon="fire"
              active={['IN_PROGRESS', 'COMPLETED'].includes(status)}
            />
          </View>
        </View>

        {/* UNLOCKED CUSTOMER & LOCATION CARD (Fully visible post acceptance) */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.badgeUnlocked}>
              <MaterialCommunityIcons name="lock-open-variant" size={14} color="#15803D" />
              <Text style={s.badgeUnlockedText}>यजमान का पूरा पता अनलॉक</Text>
            </View>
            <Text style={s.dakshinaText}>₹ {booking.dakshina}</Text>
          </View>

          <Text style={s.addressMain}>{address || 'Flat 402, Tower B, Prateek Laurel'}</Text>
          <Text style={s.addressSub}>लैंडमार्क: {landmark || 'क्लब हाउस के समीप'}, {area}</Text>

          <View style={s.divider} />

          {/* Yajman Gotra & Sankalp info */}
          <View style={s.sankalpRow}>
            <View style={s.sankalpItem}>
              <Text style={s.sankalpLabel}>यजमान</Text>
              <Text style={s.sankalpVal}>{yajmanName || 'यजमान'}</Text>
            </View>
            <View style={s.sankalpItem}>
              <Text style={s.sankalpLabel}>गोत्र</Text>
              <Text style={s.sankalpVal}>{gotra || 'काश्यप'}</Text>
            </View>
            <View style={s.sankalpItem}>
              <Text style={s.sankalpLabel}>सामग्री व्यवस्था</Text>
              <Text style={[s.sankalpVal, { color: booking.withSamagri ? '#16A34A' : '#D97706' }]}>
                {booking.withSamagri ? 'पंडित जी लाएंगे' : 'यजमान ने किट मंगवाई'}
              </Text>
            </View>
          </View>

          {/* E-Store Kit Notice for Pandit as per PRD */}
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#BBF7D0' }}>
            <MaterialCommunityIcons name="package-check" size={20} color="#15803D" />
            <Text style={{ flex: 1, fontSize: 11.5, color: '#166534', lineHeight: 16 }}>
              📦 यजमान ने ई-स्टोर से <Text style={{ fontWeight: '800' }}>सम्पूर्ण पूजा किट (Standard)</Text> मंगवाई है (डिलीवर हो चुकी है)। पंडित जी को सामग्री लाने की आवश्यकता नहीं है।
            </Text>
          </View>

          {/* Quick Communication Buttons */}
          <View style={s.commActionRow}>
            <TouchableOpacity style={s.commBtn} onPress={openNavigation}>
              <MaterialCommunityIcons name="navigation-variant" size={18} color={colors.primary} />
              <Text style={s.commBtnText}>नेविगेशन</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.commBtn} onPress={handleVirtualCall}>
              <MaterialCommunityIcons name="phone-lock" size={18} color="#15803D" />
              <Text style={[s.commBtnText, { color: '#15803D' }]}>मास्क्ड कॉल</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.commBtn}
              onPress={() => navigation.navigate('Chat', { name: yajmanName || 'यजमान' })}
            >
              <MaterialCommunityIcons name="chat-outline" size={18} color="#0284C7" />
              <Text style={[s.commBtnText, { color: '#0284C7' }]}>चैट करें</Text>
            </TouchableOpacity>
          </View>

          {/* Full Screen Live Location Button Card */}
          <TouchableOpacity
            style={s.liveMapCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('LiveLocationTracking', { bookingId: booking.id, booking })}
          >
            <View style={s.liveMapHeader}>
              <View style={s.liveDotPulseRow}>
                <View style={s.liveDotGreen} />
                <Text style={s.liveMapHeaderTitle}>लाइव लोकेशन व रूट (Live GPS)</Text>
              </View>
              <Text style={s.liveMapDistBadge}>2.4 km • 8 मिनट</Text>
            </View>
            <View style={s.liveMapActionRow}>
              <View style={s.liveMapIconCircle}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color="#67101F" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.liveMapAddressText} numberOfLines={1}>{address || 'Flat 402, Shanti Kunj, Sector 62, Noida'}</Text>
                <Text style={s.liveMapActionText}>फुल स्क्रीन लाइव लोकेशन देखें (Live Route) ›</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* STAGE 1: ACCEPTED -> "निकल गया" */}
        {status === 'ACCEPTED' && (
          <View style={s.actionBox}>
            <View style={s.actionBoxHeader}>
              <MaterialCommunityIcons name="bike-fast" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.actionBoxTitle}>पूजा स्थल के लिए प्रस्थान करें</Text>
                <Text style={s.actionBoxSub}>
                  सामग्री जांच लें व प्रस्थान करते ही "निकल गया" दर्ज करें।
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.primaryActionBtn}
              activeOpacity={0.85}
              onPress={handleOnTheWay}
            >
              <Text style={s.primaryActionBtnText}>निकल गया (On The Way) ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 2: ON_THE_WAY -> "पहुँच गया" (Geofence test) */}
        {status === 'ON_THE_WAY' && (
          <View style={s.actionBox}>
            <View style={s.actionBoxHeader}>
              <MaterialCommunityIcons name="map-marker-radius" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.actionBoxTitle}>यजमान के द्वार पर आगमन</Text>
                <Text style={s.actionBoxSub}>
                  PRD नियम: यजमान के 200m के दायरे में आने पर ही बटन सक्रिय होगा।
                </Text>
              </View>
            </View>

            {/* Geofence Distance Display & Simulation Toggle */}
            <View style={s.geofenceCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.geofenceLabel}>यजमान के स्थान से दूरी:</Text>
                <Text
                  style={[
                    s.geofenceVal,
                    { color: distanceMeters <= 200 ? '#15803D' : '#DC2626' },
                  ]}
                >
                  {distanceMeters} मीटर {distanceMeters <= 200 ? '(दायरे के भीतर ✓)' : '(200m से अधिक)'}
                </Text>
              </View>
              <TouchableOpacity
                style={s.toggleGeoBtn}
                onPress={() => setDistanceMeters(distanceMeters > 200 ? 120 : 350)}
              >
                <Text style={s.toggleGeoText}>
                  {distanceMeters > 200 ? 'पास आएँ (120m)' : 'दूर जाएँ (350m)'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                s.primaryActionBtn,
                distanceMeters > 200 && { backgroundColor: '#B5A89F' },
              ]}
              activeOpacity={0.85}
              onPress={handleArrived}
            >
              <Text style={s.primaryActionBtnText}>पहुँच गया (Arrived) ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 3: ARRIVED -> ENTER START OTP */}
        {status === 'ARRIVED' && (
          <View style={s.actionBox}>
            <View style={s.actionBoxHeader}>
              <MaterialCommunityIcons name="shield-key" size={26} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.actionBoxTitle}>यजमान से Start OTP पूछें</Text>
                <Text style={s.actionBoxSub}>
                  यजमान की ऐप में दिखाई दे रहा 4-अंकों का स्टार्ट कोड दर्ज करें।
                </Text>
              </View>
            </View>

            {/* 4-digit input */}
            <View style={s.otpRow}>
              {startOtp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(r) => (startInputRefs.current[idx] = r)}
                  style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(val) => {
                    const next = [...startOtp];
                    next[idx] = val.slice(-1);
                    setStartOtp(next);
                    if (val && idx < 3) startInputRefs.current[idx + 1]?.focus();
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              style={s.primaryActionBtn}
              activeOpacity={0.85}
              onPress={handleVerifyStartOtp}
            >
              <Text style={s.primaryActionBtnText}>Start OTP सत्यापित करें व पूजा आरंभ करें ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 4: IN_PROGRESS -> LIVE TIMER, RECITAL CARD, SAMAGRI CHECKLIST, & COMPLETE OTP */}
        {status === 'IN_PROGRESS' && (
          <>
            {/* Live Timer Card */}
            <View style={s.timerRunningCard}>
              <View style={s.timerRunningLeft}>
                <MaterialCommunityIcons name="fire" size={26} color="#FFF" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={s.timerRunningTitle}>पूजा प्रगति पर है</Text>
                  <Text style={s.timerRunningSub}>{pooja?.name}</Text>
                </View>
              </View>
              <Text style={s.timerElapsedText}>
                {formatTimer(booking.elapsedSeconds || 0)}
              </Text>
            </View>

            {/* Sacred Sankalp Recital Card */}
            <View style={s.recitalCard}>
              <View style={s.recitalHeader}>
                <MaterialCommunityIcons name="script-text" size={20} color={colors.primary} />
                <Text style={s.recitalTitle}>वैदिक संकल्प पाठ (Pandit Recital)</Text>
              </View>
              <Text style={s.recitalText}>
                "ॐ विष्णुर्विष्णुर्विष्णुः श्रीमद्भगवतो महापुरुषस्य विष्णोराज्ञया प्रवर्तमानस्य...
                अद्य <Text style={{ fontWeight: '800', color: colors.primary }}>{gotra || 'काश्यप'}</Text> गोत्रोत्पन्न
                यजमान <Text style={{ fontWeight: '800', color: colors.primary }}>{sankalpName || yajmanName || 'यजमान'}</Text> सपरिवारस्य
                मनोकामना सिद्धयर्थे, गृह शांति निमित्तम्..."
              </Text>
            </View>

            {/* Samagri Checklist Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>सामग्री व विधि चेकलिस्ट</Text>
              <View style={s.checkListGrid}>
                {Object.entries({
                  panchamrit: 'पंचामृत व गंगाजल',
                  roliAkshat: 'रोली, अक्षत, कलावा',
                  kalashJaneu: 'कलश, नारियल, जनेऊ',
                  havanKund: 'हवन कुंड व समिधा',
                  gheeSamagri: 'शुद्ध घी व धूप',
                  pushpMala: 'पुष्पमाला व बेलपत्र',
                }).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={s.checkRow}
                    onPress={() => setChecklist({ ...checklist, [key]: !checklist[key] })}
                  >
                    <MaterialCommunityIcons
                      name={checklist[key] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={checklist[key] ? '#15803D' : '#8C786E'}
                    />
                    <Text
                      style={[
                        s.checkLabel,
                        checklist[key] && { textDecorationLine: 'line-through', color: '#8C786E' },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Complete OTP Card */}
            <View style={s.actionBox}>
              <View style={s.actionBoxHeader}>
                <MaterialCommunityIcons name="check-decagram" size={26} color="#15803D" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.actionBoxTitle}>पूजा संपन्न करें (Enter Complete OTP)</Text>
                  <Text style={s.actionBoxSub}>
                    पूजा समाप्त होने पर यजमान की ऐप से Complete OTP पूछकर दर्ज करें।
                  </Text>
                </View>
              </View>

              <View style={s.otpRow}>
                {completeOtp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => (completeInputRefs.current[idx] = r)}
                    style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(val) => {
                      const next = [...completeOtp];
                      next[idx] = val.slice(-1);
                      setCompleteOtp(next);
                      if (val && idx < 3) completeInputRefs.current[idx + 1]?.focus();
                    }}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[s.primaryActionBtn, { backgroundColor: '#15803D' }]}
                activeOpacity={0.85}
                onPress={handleVerifyCompleteOtp}
              >
                <Text style={s.primaryActionBtnText}>पूजा संपन्न करें व दक्षिणा अनलॉक करें ›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Cancellation / Dispute Option */}
        <View style={s.emergencyRow}>
          <TouchableOpacity
            style={s.cancelLink}
            onPress={() => setShowCancelModal(true)}
          >
            <MaterialCommunityIcons name="cancel" size={16} color="#DC2626" />
            <Text style={s.cancelLinkText}>बुकिंग रद्द करें (रद्द नीति)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.cancelLink}
            onPress={() => setShowDisputeModal(true)}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#D97706" />
            <Text style={[s.cancelLinkText, { color: '#D97706' }]}>विवाद / सहायता</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cancellation Penalty Warning Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.penaltyCircle}>
              <MaterialCommunityIcons name="alert" size={32} color="#DC2626" />
            </View>
            <Text style={s.modalTitle}>बुकिंग रद्द करने की चेतावनी</Text>
            <Text style={s.modalDesc}>
              स्वीकृति के बाद पंडित जी द्वारा बुकिंग रद्द करने पर{' '}
              <Text style={{ fontWeight: '800', color: '#DC2626' }}>₹50 पेनल्टी शुल्क</Text> आपके
              अगले भुगतान से काटा जाएगा।
            </Text>
            <TouchableOpacity
              style={s.confirmCancelBtn}
              onPress={handleCancelBooking}
            >
              <Text style={s.confirmCancelText}>हाँ, पेनल्टी स्वीकार कर रद्द करें</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stayBtn}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={s.stayBtnText}>वापस लौटें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={showDisputeModal} transparent animationType="fade">
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>समस्या या विवाद दर्ज करें</Text>
            <Text style={s.modalDesc}>
              यजमान उपस्थित नहीं हैं, पता नहीं मिल रहा, या कोई अन्य समस्या है?
            </Text>
            <TextInput
              style={s.disputeInput}
              multiline
              placeholder="अपनी समस्या का विवरण यहाँ लिखें..."
              placeholderTextColor="#8C786E"
              value={disputeReason}
              onChangeText={setDisputeReason}
            />
            <TouchableOpacity
              style={s.confirmCancelBtn}
              onPress={() => {
                setShowDisputeModal(false);
                Alert.alert('सहायता टीम को भेजा गया', 'हमारी पार्टनर सपोर्ट टीम आपसे 5 मिनट में संपर्क करेगी।');
              }}
            >
              <Text style={s.confirmCancelText}>सपोर्ट टीम को भेजें</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stayBtn}
              onPress={() => setShowDisputeModal(false)}
            >
              <Text style={s.stayBtnText}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const StepItem = ({ label, icon, active }) => (
  <View style={s.stepItem}>
    <View style={[s.stepCircle, active && s.stepCircleActive]}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={active ? '#FFF' : '#8C786E'}
      />
    </View>
    <Text style={[s.stepLabel, active && s.stepLabelActive]}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    padding: 16,
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 10.5,
    color: '#8C786E',
    marginTop: 4,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8DED1',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeUnlockedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  dakshinaText: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  addressMain: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '800',
    color: '#3A1208',
  },
  addressSub: {
    fontSize: 13,
    color: '#7A6458',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EDE4',
    marginVertical: 12,
  },
  sankalpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sankalpItem: {
    flex: 1,
  },
  sankalpLabel: {
    fontSize: 11,
    color: '#8C786E',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sankalpVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3A1208',
    marginTop: 2,
  },
  commActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  commBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F0',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    gap: 6,
  },
  commBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primary,
  },
  actionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.gold,
    marginBottom: 14,
    ...shadow,
  },
  actionBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBoxTitle: {
    fontFamily: serif,
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
  },
  actionBoxSub: {
    fontSize: 12,
    color: '#7A6458',
    marginTop: 2,
  },
  geofenceCard: {
    backgroundColor: '#FFF8EB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  geofenceLabel: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  geofenceVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  toggleGeoBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  toggleGeoText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  otpHintBox: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  otpHintText: {
    fontSize: 12,
    color: '#92400E',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  otpBox: {
    width: 52,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ECE3D7',
    backgroundColor: '#FAF7F0',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#3A1208',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FFF',
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadow,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  timerRunningCard: {
    backgroundColor: '#3A1208',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    ...shadow,
  },
  timerRunningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerRunningTitle: {
    color: '#FFF8F0',
    fontSize: 15,
    fontWeight: '800',
  },
  timerRunningSub: {
    color: colors.goldLight,
    fontSize: 11.5,
    marginTop: 2,
  },
  timerElapsedText: {
    fontFamily: serif,
    fontSize: 26,
    fontWeight: '800',
    color: colors.gold,
  },
  recitalCard: {
    backgroundColor: '#FFF9F0',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5E5CF',
    marginBottom: 14,
  },
  recitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recitalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3A1208',
  },
  recitalText: {
    fontSize: 12.5,
    color: '#5C4436',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: 15,
    fontWeight: '800',
    color: '#3A1208',
    marginBottom: 12,
  },
  checkListGrid: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkLabel: {
    fontSize: 13.5,
    color: '#3A1208',
    fontWeight: '600',
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 10, 5, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FAF7F0',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...shadow,
  },
  penaltyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '800',
    color: '#3A1208',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#7A6458',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  confirmCancelBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  stayBtn: {
    paddingVertical: 10,
    marginTop: 6,
  },
  stayBtnText: {
    color: '#8C786E',
    fontSize: 13,
    fontWeight: '600',
  },
  disputeInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    padding: 12,
    height: 90,
    alignSelf: 'stretch',
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#3A1208',
    marginBottom: 16,
  },
  noBookingText: {
    fontSize: 16,
    color: '#7A6458',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '800',
  },
  liveMapCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#E8DED1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  liveMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liveDotPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  liveMapHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.4,
  },
  liveMapDistBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  liveMapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMapIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMapAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E1418',
  },
  liveMapActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#67101F',
    marginTop: 2,
  },
});
