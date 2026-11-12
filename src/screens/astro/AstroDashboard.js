import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  Alert,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePartner } from '../../context/PartnerContext';
import partnerAstroStore from '../../services/talkToAstroStore';
import socket from '../../services/socket';
import PanditAstroToggleCard from '../../components/PanditAstroToggleCard';
import {
  broadcastAstroOnline,
  isDirectAstroRole,
  resolvePartnerId,
} from '../../services/astroPresenceHelper';
import { VendorService } from '../../services/api';
import colors from '../../theme/colors';
import { serif } from '../../theme/styles';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');
const ASTRO_BANNER = require('../../../assets/images/astro_banner.jpg');
const ASTRO_SERVICES_LIST = [
  'Kundali Matching',
  'Horoscope Reading',
  'Numerology',
  'Vastu Consultation',
];

export default function AstroDashboard({ navigation }) {
  const { vendor, role, walletBalance, transactions, notifications, updateVendor } = usePartner();
  const isDirectAstro = isDirectAstroRole(role, vendor);
  const partnerId = resolvePartnerId(vendor, isDirectAstro ? 'ASTRO-7890' : 'PND-VERIFIED');

  const [presence, setPresence] = useState(partnerAstroStore.getPresence());
  const [rates, setRates] = useState(partnerAstroStore.getRates());
  const [stats, setStats] = useState(partnerAstroStore.getStats());
  const [waitlist, setWaitlist] = useState(partnerAstroStore.getWaitlist());
  const [history, setHistory] = useState(partnerAstroStore.getHistory());
  const [incomingCall, setIncomingCall] = useState(null);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [astroOffered, setAstroOffered] = useState(
    Array.isArray(vendor?.astroServices) && vendor.astroServices.length > 0
      ? vendor.astroServices
      : ASTRO_SERVICES_LIST
  );

  const toggleAstroOffered = async (serviceName) => {
    const updated = astroOffered.includes(serviceName)
      ? astroOffered.filter((item) => item !== serviceName)
      : [...astroOffered, serviceName];
    setAstroOffered(updated);
    try {
      await updateVendor?.({ astroServices: updated });
      await VendorService.updateProfile({
        email: vendor?.email,
        phone: vendor?.phone,
        astroServices: updated,
      });
    } catch (err) {
      console.log('Astro offered update notice:', err?.message);
    }
  };

  const scrollRef = useRef(null);
  const queueYRef = useRef(0);
  const presenceRef = useRef(presence);
  const ratesRef = useRef(rates);
  const incomingCallRef = useRef(incomingCall);
  presenceRef.current = presence;
  ratesRef.current = rates;
  incomingCallRef.current = incomingCall;

  // Animation for incoming call pulsing badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Sync with talkToAstroStore
  useEffect(() => {
    const unsubStore = partnerAstroStore.subscribe((store) => {
      setPresence({ ...store.getPresence() });
      setRates({ ...store.getRates() });
      setStats({ ...store.getStats() });
      setWaitlist([...store.getWaitlist()]);
      setHistory([...(store.getHistory?.() || [])]);
      const inc = store.getIncomingRequest();
      if (inc && !incomingCallRef.current) {
        setIncomingCall(inc);
      }
    });

    // Listen to real-time WebSockets for calls
    const onIncoming = (callData) => {
      if (callData) {
        setIncomingCall(callData);
        try {
          Vibration.vibrate([0, 500, 200, 500]);
        } catch (_) {}
      }
    };

    const unsubCall = socket?.on?.('astro:call:incoming', onIncoming);
    const unsubCallEnd = socket?.on?.('astro:call:ended', () => {
      setIncomingCall(null);
    });
    const unsubCallTaken = socket?.on?.('astro:call:taken', () => {
      setIncomingCall(null);
    });

    // Broadcast live presence and join personal/astro rooms
    broadcastAstroOnline(vendor, presenceRef.current, ratesRef.current);

    return () => {
      if (typeof unsubCall === 'function') unsubCall();
      if (typeof unsubCallEnd === 'function') unsubCallEnd();
      if (typeof unsubCallTaken === 'function') unsubCallTaken();
      unsubStore();
    };
  }, [vendor?.id]);

  const isOnline = Boolean(presence.chatOnline || presence.audioOnline || presence.videoOnline);
  const netRatePerMin = ((rates.audio || 5) * 0.85).toFixed(2);
  const unreadCount = (notifications || []).length;

  const toggleMode = (key) => {
    partnerAstroStore.togglePresence(key);
    const updated = { ...presence, [key]: !presence[key] };
    setPresence(updated);
    broadcastAstroOnline(vendor, updated, rates);
  };

  const toggleAllOnline = () => {
    const nextState = !isOnline;
    const nextPresence = {
      chatOnline: nextState,
      audioOnline: nextState,
      videoOnline: nextState,
    };
    partnerAstroStore.presence = nextPresence;
    partnerAstroStore.notify();
    setPresence(nextPresence);
    broadcastAstroOnline(vendor, nextPresence, rates);
  };

  const updateFee = (newRate) => {
    const val = Math.max(1, Math.min(200, Number(newRate) || 5));
    partnerAstroStore.updateRate('chat', val);
    partnerAstroStore.updateRate('audio', val);
    partnerAstroStore.updateRate('video', val);
    const updated = { chat: val, audio: val, video: val };
    setRates(updated);
    broadcastAstroOnline(vendor, presence, updated);
  };

  // Accept incoming consultation
  const handleAcceptCall = () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);

    // Socket signaling with real active partner metadata
    socket?.emit?.('astro:call:accept', {
      channelName: call.channelName || `vartalap_room_${Date.now()}`,
      callerId: call.caller?.id || call.userId || 'U101',
      vendorId: partnerId,
      astrologer: {
        id: partnerId,
        name: vendor?.name || 'आचार्य विद्याधर शास्त्री',
        title: isDirectAstro ? 'सत्यापित वैदिक ज्योतिषाचार्य' : 'सत्यापित वैदिक पंडित व ज्योतिषाचार्य',
      },
      mode: call.mode || 'video',
      agoraToken: call.agoraToken,
    });

    if (call.mode === 'chat') {
      partnerAstroStore.activeSession = {
        id: call.channelName || `SES-${Date.now()}`,
        channelName: call.channelName || `vartalap_room_${Date.now()}`,
        userName: call.userName || call.caller?.name || 'यजमान',
        userId: call.userId || call.caller?.id || 'U101',
        mode: 'chat',
        rate: call.rate || rates.chat || 5,
        topic: call.topic || 'करियर व विवाह परामर्श',
        birthDetails: call.birthDetails || {
          dob: '14-08-1995',
          tob: '07:30 AM',
          pob: 'वाराणसी, उत्तर प्रदेश',
          gender: 'पुरुष (Male)',
          kundali: {
            lagna: 'सिंह (Leo)',
            rashi: 'वृश्चिक (Scorpio)',
            nakshatra: 'अनुराधा (चरण 2)',
          },
        },
        elapsedSeconds: 0,
        netRatePerMinute: 4.25,
        chatMessages: [
          {
            id: `M-${Date.now()}`,
            sender: 'client',
            text: 'प्रणाम आचार्य जी! कृपया मेरी कुंडली देखकर मार्गदर्शन करें।',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        privateNotes: '',
      };
      partnerAstroStore.notify();
      navigation.navigate('AstroSession');
    } else {
      navigation.navigate('InCall', {
        caller: {
          name: call.userName || call.caller?.name || 'यजमान',
          mode: call.mode || 'video',
          rate: call.rate || rates[call.mode] || 5,
          id: call.userId || call.caller?.id || 'U101',
          birthDetails: call.birthDetails || call.caller?.birthDetails,
          topic: call.topic || 'वैदिक ज्योतिष परामर्श',
          agoraToken: call.agoraToken,
        },
        channelName: call.channelName || `vartalap_${call.mode || 'video'}_${Date.now().toString().slice(-6)}`,
        agoraToken: call.agoraToken,
        vendorId: partnerId,
        alreadyAccepted: true,
      });
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      socket?.emit?.('astro:call:decline', {
        channelName: incomingCall.channelName,
        callerId: incomingCall.caller?.id || incomingCall.userId,
      });
      partnerAstroStore.rejectRequest();
      setIncomingCall(null);
    }
  };



  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <ScrollView
        ref={scrollRef}
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar with VaidicSanskar Temple Branding */}
        <View style={s.topBar}>
          <View style={s.brandInfoWrap}>
            <View style={s.logoMiniWrap}>
              <Image source={TEMPLE_IMAGE} style={s.logoMini} resizeMode="contain" />
            </View>
            <View>
              <View style={s.brandRow}>
                <Text style={s.brandTitle}>VaidicSanskar</Text>
                <View style={s.astroBadge}>
                  <MaterialCommunityIcons name="creation" size={12} color="#FFFFFF" />
                  <Text style={s.astroBadgeText}>{isDirectAstro ? 'ज्योतिषी' : 'पंडित + ज्योतिषी'}</Text>
                </View>
              </View>
              <Text style={s.partnerSubtitle}>
                {vendor?.name || 'आचार्य विद्याधर शास्त्री'}
              </Text>
            </View>
          </View>

          <View style={s.topRightActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Notifications')}
              style={s.bellBtn}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#2E1418" />
              {unreadCount > 0 && <View style={s.redBadge} />}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ProfileSettings')}
              style={s.avatarWrap}
            >
              <View style={s.avatarCircle}>
                <MaterialCommunityIcons name="account-star" size={22} color="#67101F" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visible only when logged in as Pandit with Astrologer toggle enabled */}
        <PanditAstroToggleCard compact />

        {/* Screen 6 Sacred Astrology Hero & Services Offered */}
        <View style={s.astroHeroCard}>
          <Image source={ASTRO_BANNER} style={s.astroHeroImg} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(74, 8, 19, 0.15)', 'rgba(56, 5, 13, 0.88)']}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.5 }}
            style={s.astroHeroOverlay}
          >
            <Text style={s.astroHeroTitle}>Share Your{'\n'}Astrology Services</Text>
          </LinearGradient>
        </View>

        <View style={s.offeredCard}>
          <View style={s.offeredHeader}>
            <Text style={s.offeredHeading}>Services Offered</Text>
            <Text style={s.offeredExpBadge}>{vendor?.experience || '10+ Years'}</Text>
          </View>
          <View style={s.offeredGrid}>
            {ASTRO_SERVICES_LIST.map((svc) => {
              const checked = astroOffered.includes(svc);
              return (
                <TouchableOpacity
                  key={svc}
                  activeOpacity={0.8}
                  style={s.offeredItem}
                  onPress={() => toggleAstroOffered(svc)}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={19}
                    color={checked ? '#67101F' : '#8C7A6B'}
                  />
                  <Text style={s.offeredItemText}>{svc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Master Live Consultation Status Banner */}
        <LinearGradient
          colors={isOnline ? ['#1B4332', '#2D6A4F'] : ['#491219', '#2E0B10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.statusBanner}
        >
          <View style={s.statusTopRow}>
            <View style={s.statusTextGroup}>
              <View style={s.statusTitleRow}>
                <View style={[s.liveDot, { backgroundColor: isOnline ? '#4ADE80' : '#F87171' }]} />
                <Text style={s.statusTitle}>
                  {isOnline ? 'आप लाइव ऑनलाइन हैं' : 'आप वर्तमान में ऑफलाइन हैं'}
                </Text>
              </View>
              <Text style={s.statusSub}>
                {isOnline
                  ? 'यजमान आपको लाइव देखकर ऑडियो, वीडियो व चैट परामर्श हेतु संपर्क कर सकते हैं।'
                  : 'परामर्श व कॉल्स प्राप्त करने हेतु ऑनलाइन टॉगल ऑन करें।'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={toggleAllOnline}
              style={[s.masterSwitchBtn, isOnline ? s.masterSwitchBtnOnline : s.masterSwitchBtnOffline]}
            >
              <Text style={s.masterSwitchText}>
                {isOnline ? 'ऑफलाइन हों' : 'ऑनलाइन हों'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3 Channel Mode Controls */}
          <View style={s.modesContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => toggleMode('chatOnline')}
              style={[s.modePill, presence.chatOnline && s.modePillActive]}
            >
              <MaterialCommunityIcons
                name="chat-processing"
                size={16}
                color={presence.chatOnline ? '#FFFFFF' : '#D0C5B4'}
              />
              <Text style={[s.modePillLabel, presence.chatOnline && s.modePillLabelActive]}>
                चैट {presence.chatOnline ? 'ON' : 'OFF'}
              </Text>
              <Text style={[s.modeRateTag, presence.chatOnline && s.modeRateTagActive]}>
                ₹{rates.chat || 5}/min
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => toggleMode('audioOnline')}
              style={[s.modePill, presence.audioOnline && s.modePillActive]}
            >
              <MaterialCommunityIcons
                name="phone-in-talk"
                size={16}
                color={presence.audioOnline ? '#FFFFFF' : '#D0C5B4'}
              />
              <Text style={[s.modePillLabel, presence.audioOnline && s.modePillLabelActive]}>
                ऑडियो {presence.audioOnline ? 'ON' : 'OFF'}
              </Text>
              <Text style={[s.modeRateTag, presence.audioOnline && s.modeRateTagActive]}>
                ₹{rates.audio || 5}/min
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => toggleMode('videoOnline')}
              style={[s.modePill, presence.videoOnline && s.modePillActive]}
            >
              <MaterialCommunityIcons
                name="video"
                size={16}
                color={presence.videoOnline ? '#FFFFFF' : '#D0C5B4'}
              />
              <Text style={[s.modePillLabel, presence.videoOnline && s.modePillLabelActive]}>
                वीडियो {presence.videoOnline ? 'ON' : 'OFF'}
              </Text>
              <Text style={[s.modeRateTag, presence.videoOnline && s.modeRateTagActive]}>
                ₹{rates.video || 5}/min
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>



        {/* Today's Astro Overview Card */}
        <LinearGradient
          colors={['#67101F', '#490B15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.overviewCard}
        >
          <View style={s.overviewHeaderRow}>
            <Text style={s.overviewHeading}>आज का ज्योतिष सारांश (Overview)</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('WalletEarnings')}
              style={s.walletLink}
            >
              <Text style={s.walletLinkText}>वॉलेट ›</Text>
            </TouchableOpacity>
          </View>

          <View style={s.overviewGrid}>
            {/* Metric 1 */}
            <View style={s.overviewMetricBox}>
              <Text style={s.metricVal}>₹{Number(walletBalance || stats.todayEarnings || 0).toLocaleString('en-IN')}</Text>
              <Text style={s.metricLbl}>आज का मानदेय (Earnings)</Text>
            </View>

            {/* Metric 2 */}
            <View style={s.overviewMetricBox}>
              <Text style={s.metricVal}>{Number(stats.todayMinutes || 0)} <Text style={{ fontSize: 13, fontWeight: '500' }}>min</Text></Text>
              <Text style={s.metricLbl}>कुल परामर्श समय (Time)</Text>
            </View>

            {/* Metric 3 */}
            <View style={s.overviewMetricBox}>
              <Text style={s.metricVal}>{Number(stats.completedOrders || 0)}</Text>
              <Text style={s.metricLbl}>पूर्ण परामर्श (Orders)</Text>
            </View>

            {/* Metric 4 */}
            <View style={s.overviewMetricBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={18} color="#F7C966" style={{ marginRight: 4 }} />
                <Text style={s.metricVal}>{Number(stats.averageRating || vendor?.rating || 0).toFixed(1)}</Text>
              </View>
              <Text style={s.metricLbl}>समीक्षा रेटिंग ({Number(stats.reviewsCount || vendor?.reviewsCount || 0)} यजमान)</Text>
            </View>
          </View>

          <View style={s.rateNoteRow}>
            <MaterialCommunityIcons name="information-outline" size={15} color="#F6DFB8" />
            <Text style={s.rateNoteText}>
              दर: ₹{rates.audio || 5}/min • शुद्ध प्राप्ति: ₹{netRatePerMin}/min (15% प्लेटफ़ॉर्म शेयर के बाद)
            </Text>
          </View>
        </LinearGradient>

        {/* Waiting Devotees / Active Queue */}
        <View
          style={s.sectionHeadRow}
          onLayout={(e) => {
            queueYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={s.sectionTitle}>प्रतीक्षारत यजमान (Consultation Queue)</Text>
          <View style={s.badgePill}>
            <Text style={s.badgePillText}>{waitlist.length} प्रतीक्षा में</Text>
          </View>
        </View>

        {waitlist.length > 0 ? (
          <View style={s.queueList}>
            {waitlist.map((item, idx) => (
              <View key={item.id || idx} style={s.queueCard}>
                <View style={s.queueLeft}>
                  <View style={s.queueAvatar}>
                    <MaterialCommunityIcons
                      name={item.mode === 'video' ? 'video' : (item.mode === 'audio' ? 'phone' : 'chat')}
                      size={20}
                      color="#67101F"
                    />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={s.queueName}>{item.userName}</Text>
                    <Text style={s.queueTopic}>विषय: {item.topic}</Text>
                    <Text style={s.queueWait}>प्रतीक्षा समय: ~{item.waitMinutes} मिनट</Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={s.queueCallBtn}
                  onPress={() => {
                    if (item.mode === 'chat') {
                      partnerAstroStore.activeSession = {
                        id: item.sessionId || `SES-${Date.now()}`,
                        channelName: item.channelName || `vartalap_room_${Date.now()}`,
                        userName: item.userName,
                        userId: item.userId || 'U101',
                        mode: 'chat',
                        rate: rates.chat || 5,
                        topic: item.topic || 'वैदिक परामर्श',
                        birthDetails: item.birthDetails,
                        elapsedSeconds: 0,
                        netRatePerMinute: Number(((rates.chat || 5) * 0.85).toFixed(2)),
                        chatMessages: [],
                      };
                      partnerAstroStore.notify();
                      navigation.navigate('AstroSession');
                    } else {
                      navigation.navigate('InCall', {
                        caller: {
                          name: item.userName,
                          mode: item.mode || 'video',
                          rate: rates[item.mode] || 5,
                          id: item.userId || 'U101',
                          birthDetails: item.birthDetails,
                          topic: item.topic,
                        },
                        channelName: item.channelName || `vartalap_${item.mode || 'video'}_${Date.now().toString().slice(-6)}`,
                      });
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.mode === 'video' ? 'video' : (item.mode === 'chat' ? 'chat' : 'phone')}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={s.queueCallBtnText}>परामर्श शुरू</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.emptyQueueCard}>
            <MaterialCommunityIcons name="clock-check-outline" size={32} color="#A08E90" />
            <Text style={s.emptyQueueText}>वर्तमान में कोई यजमान प्रतीक्षा में नहीं है</Text>
          </View>
        )}

        {/* Quick Astrology Tools Grid (Sacred Theme matching VaidicSanskar) */}
        <Text style={[s.sectionTitle, { marginTop: 22 }]}>ज्योतिष उपकरण एवं सेवाएँ (Astro Tools)</Text>

        <View style={s.toolsGrid}>
          {/* Tool 1: Consultations History / Requests */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, queueYRef.current - 10), animated: true })}
            style={s.toolCard}
          >
            <View style={s.toolIconWrap}>
              <MaterialCommunityIcons name="calendar-clock" size={26} color="#D48B28" />
            </View>
            <Text style={s.toolTitle}>परामर्श सूची{'\n'}(Consultations)</Text>
            <Text style={s.toolSub}>सक्रिय व आगामी सत्र</Text>
          </TouchableOpacity>

          {/* Tool 2: Prashna Kundali */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('KundaliTools')}
            style={s.toolCard}
          >
            <View style={s.toolIconWrap}>
              <MaterialCommunityIcons name="compass-outline" size={26} color="#D48B28" />
            </View>
            <Text style={s.toolTitle}>प्रश्न कुण्डली{'\n'}(Horary Chart)</Text>
            <Text style={s.toolSub}>तात्कालिक प्रश्न गणना</Text>
          </TouchableOpacity>

          {/* Tool 3: Kundali Tools (Lagna & Navamsha) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('KundaliTools')}
            style={s.toolCard}
          >
            <View style={s.toolIconWrap}>
              <MaterialCommunityIcons name="star-four-points" size={26} color="#D48B28" />
            </View>
            <Text style={s.toolTitle}>लग्न कुण्डली{'\n'}(Birth Chart)</Text>
            <Text style={s.toolSub}>12 भाव व ग्रह स्थिति</Text>
          </TouchableOpacity>

          {/* Tool 4: 36 Gun Milan */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('KundaliTools')}
            style={s.toolCard}
          >
            <View style={s.toolIconWrap}>
              <MaterialCommunityIcons name="heart-multiple" size={26} color="#D48B28" />
            </View>
            <Text style={s.toolTitle}>36 गुण मिलान{'\n'}(Kundali Milan)</Text>
            <Text style={s.toolSub}>अष्टकूट व दोष परिहार</Text>
          </TouchableOpacity>

          {/* Tool 5: Astro Wallet & Payout */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('WalletEarnings')}
            style={s.toolCard}
          >
            <View style={s.toolIconWrap}>
              <MaterialCommunityIcons name="wallet-outline" size={26} color="#D48B28" />
            </View>
            <Text style={s.toolTitle}>ज्योतिष मानदेय{'\n'}(Astro Wallet)</Text>
            <Text style={s.toolSub}>खाता व UPI निकासी</Text>
          </TouchableOpacity>

          {/* Tool 6: Rates & Services Config */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setRateModalVisible(true)}
            style={s.toolCard}
          >
            <View style={s.toolIconWrap}>
              <MaterialCommunityIcons name="tune" size={26} color="#D48B28" />
            </View>
            <Text style={s.toolTitle}>परामर्श दरें{'\n'}(Rates & Fees)</Text>
            <Text style={s.toolSub}>प्रति मिनट दर प्रबंध</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Devotee Consultations History */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>हालिया परामर्श इतिहास (Recent Consultations)</Text>

        {(() => {
          const astroTx = (transactions || []).filter(
            (tx) => String(tx.category || '').toLowerCase() === 'astro' || /astro|परामर्श|call|chat/i.test(String(tx.title || ''))
          );
          const mergedHistory = history.length > 0 ? history : astroTx.map((tx, i) => ({
            id: tx.id || `tx-${i}`,
            userName: tx.userName || tx.title || 'यजमान परामर्श',
            mode: tx.mode || 'CALL',
            topic: tx.sub || tx.date || 'वैदिक ज्योतिष परामर्श',
            netEarning: Number(tx.amount || 0),
            durationMinutes: tx.durationMinutes || 0,
            ratePerMin: tx.ratePerMin || 0,
          }));
          if (mergedHistory.length === 0) {
            return (
              <View style={s.emptyQueueCard}>
                <MaterialCommunityIcons name="history" size={30} color="#A08E90" />
                <Text style={s.emptyQueueText}>अभी तक कोई परामर्श पूरा नहीं हुआ है</Text>
              </View>
            );
          }
          return (
            <View style={s.historyList}>
              {mergedHistory.map((item, idx) => (
                <View key={item.id || idx} style={s.historyCard}>
                  <View style={s.historyHeaderRow}>
                    <View style={s.historyUserRow}>
                      <View style={s.historyUserIcon}>
                        <MaterialCommunityIcons name="account" size={18} color="#67101F" />
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={s.historyUserName}>{item.userName || 'यजमान'}</Text>
                        <Text style={s.historyTopic}>
                          {item.topic || 'वैदिक ज्योतिष परामर्श'} • {String(item.mode || 'CALL').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={s.historyEarnTag}>
                      <Text style={s.historyEarnText}>+₹{Number(item.netEarning || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={s.historyFooterRow}>
                    <Text style={s.historyMeta}>
                      {item.durationMinutes ? `अवधि: ${item.durationMinutes} मिनट` : item.topic || 'पूर्ण सत्र'}
                      {item.ratePerMin ? ` • ₹${item.ratePerMin}/min` : ''}
                    </Text>
                    <View style={s.historyRatingRow}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#1E8E4A" />
                      <Text style={s.historyRatingText}>लाइव क्रेडिट</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })()}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==================================================== */}
      {/* REAL-TIME INCOMING CONSULTATION MODAL (Ringing Alert) */}
      {/* ==================================================== */}
      <Modal
        visible={!!incomingCall}
        transparent
        animationType="slide"
        onRequestClose={handleDeclineCall}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {/* Header Badge */}
            <View style={s.modalBadgeRow}>
              <View style={[s.modalTypeBadge, { backgroundColor: incomingCall?.mode === 'video' ? '#D13939' : '#1E8E4A' }]}>
                <MaterialCommunityIcons
                  name={incomingCall?.mode === 'video' ? 'video' : (incomingCall?.mode === 'chat' ? 'chat' : 'phone')}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={s.modalTypeBadgeText}>
                  इनकमिंग {incomingCall?.mode === 'video' ? 'वीडियो परामर्श' : (incomingCall?.mode === 'chat' ? 'चैट परामर्श' : 'ऑडियो कॉल')}
                </Text>
              </View>
              <Text style={s.modalRateTag}>₹{incomingCall?.rate || rates.audio || 5}/min</Text>
            </View>

            {/* Pulsing Avatar */}
            <View style={s.pulsingAvatarWrap}>
              <Animated.View style={[s.pulsingRing, { transform: [{ scale: pulseAnim }] }]} />
              <View style={s.avatarBig}>
                <MaterialCommunityIcons
                  name={incomingCall?.mode === 'video' ? 'video' : 'account-tie'}
                  size={42}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <Text style={s.callerName}>{incomingCall?.userName || incomingCall?.caller?.name || 'यजमान (Devotee)'}</Text>
            <Text style={s.callerCity}>
              {incomingCall?.birthDetails?.pob || 'उत्तर प्रदेश, भारत'}
            </Text>

            {/* Consultation Topic */}
            <View style={s.callTopicCard}>
              <Text style={s.callTopicLbl}>परामर्श विषय:</Text>
              <Text style={s.callTopicVal}>
                {incomingCall?.topic || 'वैदिक कुंडली व भविष्य मार्गदर्शन'}
              </Text>
            </View>

            {/* Kundali Summary Glance */}
            {incomingCall?.birthDetails?.kundali && (
              <View style={s.kundaliGlanceBox}>
                <View style={s.kundaliGlanceItem}>
                  <Text style={s.kGlanceLbl}>लग्न</Text>
                  <Text style={s.kGlanceVal}>{incomingCall.birthDetails.kundali.lagna || 'सिंह'}</Text>
                </View>
                <View style={s.kundaliGlanceItem}>
                  <Text style={s.kGlanceLbl}>राशि</Text>
                  <Text style={s.kGlanceVal}>{incomingCall.birthDetails.kundali.rashi || 'वृश्चिक'}</Text>
                </View>
                <View style={s.kundaliGlanceItem}>
                  <Text style={s.kGlanceLbl}>नक्षत्र</Text>
                  <Text style={s.kGlanceVal}>{incomingCall.birthDetails.kundali.nakshatra || 'अनुराधा'}</Text>
                </View>
              </View>
            )}

            {/* Actions: Accept & Decline */}
            <View style={s.modalActionsRow}>
              {/* Decline Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDeclineCall}
                style={s.declineBtn}
              >
                <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFFFFF" />
                <Text style={s.btnActionText}>अस्वीकार (Decline)</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleAcceptCall}
                style={s.acceptBtn}
              >
                <MaterialCommunityIcons
                  name={incomingCall?.mode === 'video' ? 'video' : 'phone'}
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={s.btnActionText}>स्वीकार (Accept)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Consultation Rate Configuration Modal */}
      <Modal
        visible={rateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRateModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.rateModalCard}>
            <View style={s.rateModalHeader}>
              <Text style={s.rateModalTitle}>परामर्श दर निर्धारण (Consultation Rate)</Text>
              <TouchableOpacity onPress={() => setRateModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={22} color="#67101F" />
              </TouchableOpacity>
            </View>
            <Text style={s.rateModalSub}>ऑडियो, वीडियो एवं चैट परामर्श के लिए प्रति मिनट शुल्क</Text>

            <View style={s.rateStepperRow}>
              <TouchableOpacity
                style={s.rateStepBtn}
                onPress={() => updateFee((rates.audio || 5) - 1)}
              >
                <MaterialCommunityIcons name="minus" size={22} color="#67101F" />
              </TouchableOpacity>
              <View style={s.rateValueWrap}>
                <Text style={s.rateValueNum}>₹{rates.audio || 5}</Text>
                <Text style={s.rateValueUnit}>/ मिनट</Text>
              </View>
              <TouchableOpacity
                style={s.rateStepBtn}
                onPress={() => updateFee((rates.audio || 5) + 1)}
              >
                <MaterialCommunityIcons name="plus" size={22} color="#67101F" />
              </TouchableOpacity>
            </View>

            <View style={s.rateBreakdownBox}>
              <View style={s.rateBreakdownRow}>
                <Text style={s.rateBreakdownLbl}>यजमान शुल्क:</Text>
                <Text style={s.rateBreakdownVal}>₹{rates.audio || 5}.00 / min</Text>
              </View>
              <View style={s.rateBreakdownRow}>
                <Text style={s.rateBreakdownLbl}>प्लेटफ़ॉर्म शेयर (15%):</Text>
                <Text style={s.rateBreakdownVal}>- ₹{((rates.audio || 5) * 0.15).toFixed(2)}</Text>
              </View>
              <View style={[s.rateBreakdownRow, { borderTopWidth: 1, borderTopColor: '#EDE4DA', paddingTop: 8, marginTop: 4 }]}>
                <Text style={[s.rateBreakdownLbl, { fontWeight: '800', color: '#1B4332' }]}>शुद्ध मानदेय (Net):</Text>
                <Text style={[s.rateBreakdownVal, { fontWeight: '800', color: '#1B4332' }]}>₹{netRatePerMin} / min</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setRateModalVisible(false)}
              style={s.rateDoneBtn}
            >
              <Text style={s.rateDoneText}>सुरक्षित करें (Save Rate)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMiniWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8EE',
    borderWidth: 1,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoMini: {
    width: 28,
    height: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#67101F',
    fontFamily: serif,
    letterSpacing: 0.5,
  },
  astroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D48B28',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  astroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  partnerSubtitle: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  redBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D13939',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF6E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusSub: {
    fontSize: 11.5,
    color: '#E0D5D8',
    marginTop: 4,
    lineHeight: 16,
  },
  masterSwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterSwitchBtnOnline: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  masterSwitchBtnOffline: {
    backgroundColor: '#D48B28',
  },
  masterSwitchText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  modePill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modePillActive: {
    backgroundColor: 'rgba(212, 139, 40, 0.35)',
    borderColor: '#D48B28',
  },
  modePillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D0C5B4',
    marginTop: 4,
  },
  modePillLabelActive: {
    color: '#FFFFFF',
  },
  modeRateTag: {
    fontSize: 9.5,
    color: '#F6DFB8',
    marginTop: 2,
    fontWeight: '600',
  },
  modeRateTagActive: {
    color: '#F7C966',
  },
  overviewCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: serif,
  },
  walletLink: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  walletLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F7C966',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewMetricBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLbl: {
    fontSize: 10.5,
    color: '#F4D8DE',
    marginTop: 3,
  },
  rateNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 4,
  },
  rateNoteText: {
    fontSize: 11,
    color: '#F6DFB8',
    marginLeft: 6,
    flex: 1,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
  },
  badgePill: {
    backgroundColor: '#FDF6E8',
    borderWidth: 1,
    borderColor: '#D48B28',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D48B28',
  },
  queueList: {
    marginBottom: 12,
  },
  queueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  queueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  queueAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2E1418',
  },
  queueTopic: {
    fontSize: 11,
    color: '#7D686B',
    marginTop: 1,
  },
  queueWait: {
    fontSize: 10,
    color: '#D48B28',
    fontWeight: '700',
    marginTop: 2,
  },
  queueCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E8E4A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  queueCallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  emptyQueueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    marginBottom: 10,
  },
  emptyQueueText: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 6,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDF6E8',
    borderWidth: 1,
    borderColor: '#F6DFB8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2E1418',
    textAlign: 'center',
    lineHeight: 17,
  },
  toolSub: {
    fontSize: 10,
    color: '#7D686B',
    marginTop: 2,
    textAlign: 'center',
  },
  historyList: {
    marginTop: 10,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE4DA',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyUserIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyUserName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E1418',
  },
  historyTopic: {
    fontSize: 10.5,
    color: '#7D686B',
    marginTop: 1,
  },
  historyEarnTag: {
    backgroundColor: '#EBF8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyEarnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E8E4A',
  },
  historyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE7',
  },
  historyMeta: {
    fontSize: 10,
    color: '#7D686B',
  },
  historyRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyRatingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E1418',
    marginLeft: 3,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D48B28',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  modalTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  modalRateTag: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D48B28',
  },
  pulsingAvatarWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  pulsingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 139, 40, 0.25)',
  },
  avatarBig: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#67101F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D48B28',
  },
  callerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    textAlign: 'center',
  },
  callerCity: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 2,
    textAlign: 'center',
  },
  callTopicCard: {
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EDE4DA',
  },
  callTopicLbl: {
    fontSize: 10,
    color: '#7D686B',
    fontWeight: '700',
  },
  callTopicVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2E1418',
    marginTop: 2,
  },
  kundaliGlanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FDF6E8',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F6DFB8',
  },
  kundaliGlanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  kGlanceLbl: {
    fontSize: 9.5,
    color: '#7D686B',
  },
  kGlanceVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#67101F',
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#D13939',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexDirection: 'row',
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#1E8E4A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    flexDirection: 'row',
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  rateModalCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#D48B28',
  },
  rateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rateModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    flex: 1,
    marginRight: 8,
  },
  rateModalSub: {
    fontSize: 11.5,
    color: '#7D686B',
    marginBottom: 16,
  },
  rateStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rateStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF6E8',
    borderWidth: 1.2,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateValueWrap: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  rateValueNum: {
    fontSize: 28,
    fontWeight: '800',
    color: '#67101F',
  },
  rateValueUnit: {
    fontSize: 11,
    color: '#7D686B',
    fontWeight: '600',
  },
  rateBreakdownBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    marginBottom: 16,
  },
  rateBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rateBreakdownLbl: {
    fontSize: 12,
    color: '#5C4A4D',
  },
  rateBreakdownVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2E1418',
  },
  rateDoneBtn: {
    backgroundColor: '#67101F',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  rateDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  astroHeroCard: {
    height: 118,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#4A0813',
  },
  astroHeroImg: {
    width: '100%',
    height: '100%',
  },
  astroHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  astroHeroTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '700',
    color: '#FBE8C6',
    textAlign: 'center',
    lineHeight: 24,
  },
  offeredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 14,
  },
  offeredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  offeredHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#3A1E19',
  },
  offeredExpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#67101F',
    backgroundColor: '#FBF0EC',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  offeredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  offeredItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  offeredItemText: {
    fontSize: 13,
    color: '#3A1E19',
    fontWeight: '500',
  },
});
