import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePartner } from '../../context/PartnerContext';
import partnerAstroStore from '../../services/talkToAstroStore';
import socket from '../../services/socket';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';

const CATEGORIES = ['Consultation', 'Kundali', 'Horoscope'];

export default function AstrologyServicesScreen({ navigation }) {
  const { vendor, astroServices } = usePartner();
  const [selectedCategory, setSelectedCategory] = useState('Consultation');

  const [presence, setPresence] = useState(partnerAstroStore.getPresence());
  const [rates, setRates] = useState(partnerAstroStore.getRates());
  const [stats, setStats] = useState(partnerAstroStore.getStats());

  // Package edit modal
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pkgPrice, setPkgPrice] = useState('');

  // Incoming Live Consultation Request (Chat, Audio, Video)
  const [incomingCall, setIncomingCall] = useState(null);

  // Fallback and filtered package offerings for Kundali & Horoscope tabs
  const defaultServicesList = [
    {
      id: 'as1',
      title: 'Kundali Matching (कुंडली मिलान)',
      price: 1100,
      subtitle: 'विवाह अनुकूलता एवं गुण मिलान',
      category: 'Kundali',
    },
    {
      id: 'as2',
      title: 'Birth Chart Analysis (जन्म पत्रिका विश्लेषण)',
      price: 901,
      subtitle: 'ग्रह स्थिति, लग्न व भविष्यफल',
      category: 'Kundali',
    },
    {
      id: 'as3',
      title: 'Career & Wealth Guidance (करियर व धन योग)',
      price: 701,
      subtitle: 'व्यापार, पदोन्नति एवं आर्थिक मार्गदर्शन',
      category: 'Consultation',
    },
    {
      id: 'as4',
      title: 'Health & Wellness (स्वास्थ्य एवं आयु विचार)',
      price: 501,
      subtitle: 'रोग शांति, अनुकूल रत्न व सरल उपाय',
      category: 'Horoscope',
    },
  ];

  const sourceServices = (Array.isArray(astroServices) && astroServices.length > 0)
    ? astroServices
    : defaultServicesList;

  const displayedServices = selectedCategory && selectedCategory !== 'All'
    ? sourceServices.filter(
        (item) => (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
      )
    : sourceServices;

  // Broadcast presence to Socket engine and user app
  const broadcastPresence = (newPres, newRates) => {
    const activePres = newPres || presence;
    const activeRates = newRates || rates;
    const isAnyOnline = Boolean(activePres?.chatOnline || activePres?.audioOnline || activePres?.videoOnline);
    const payload = {
      id: vendor?.id || vendor?._id || 'V4569',
      vendorId: vendor?.id || vendor?._id || 'V4569',
      name: vendor?.name || 'पंडित जी (Live Partner)',
      nameHi: vendor?.name || 'पंडित जी (Live Partner)',
      title: 'सत्यापित वैदिक ज्योतिषी • लाइव पार्टनर',
      isOnline: isAnyOnline,
      rates: activeRates,
      presence: activePres,
      rating: 5.0,
      skills: ['Vedic', 'KP Astrology', 'Kundli'],
    };
    if (socket && typeof socket.emit === 'function') {
      socket.emit('astro:presence', payload);
      socket.emit('astro:online', payload);
    }
  };

  useEffect(() => {
    // Set default rate to ₹5/min as per requirement
    partnerAstroStore.updateRate('chat', 5);
    partnerAstroStore.updateRate('audio', 5);
    partnerAstroStore.updateRate('video', 5);
    setRates({ chat: 5, audio: 5, video: 5 });

    // Broadcast online status to backend & user app
    broadcastPresence({ chatOnline: true, audioOnline: true, videoOnline: true }, { chat: 5, audio: 5, video: 5 });

    const unsubCall = socket?.on?.('astro:call:incoming', (callData) => {
      if (callData) {
        setIncomingCall(callData);
      }
    });

    const unsubCallEnd = socket?.on?.('astro:call:ended', () => {
      setIncomingCall(null);
    });

    const unsub = partnerAstroStore.subscribe((store) => {
      setPresence({ ...store.getPresence() });
      setRates({ ...store.getRates() });
      setStats({ ...store.getStats() });
    });

    return () => {
      if (typeof unsubCall === 'function') unsubCall();
      if (typeof unsubCallEnd === 'function') unsubCallEnd();
      unsub();
    };
  }, []);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);

    // Accept via Socket signaling
    socket.emit('astro:call:accept', {
      channelName: call.channelName,
      callerId: call.caller?.id || 'U101',
      vendorId: vendor?.id || 'V4569',
      mode: call.mode || 'video',
    });

    if (call.mode === 'chat') {
      partnerAstroStore.activeSession = {
        id: call.channelName || `SES-${Date.now()}`,
        channelName: call.channelName,
        userName: call.caller?.name || 'यजमान (Customer)',
        userId: call.caller?.id || 'U101',
        mode: 'chat',
        rate: call.rate || 5,
        topic: 'परामर्श',
        birthDetails: { name: call.caller?.name || 'यजमान' },
        elapsedSeconds: 0,
        netRatePerMinute: 4.25,
        chatMessages: [
          {
            id: `M-${Date.now()}`,
            sender: 'client',
            text: 'प्रणाम गुरुजी! मुझे वैदिक परामर्श चाहिए।',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        privateNotes: '',
      };
      partnerAstroStore.notify();
      navigation.navigate('AstroSession');
    } else {
      navigation.navigate('InCall', {
        caller: call.caller || { name: 'Customer / Devotee', mode: call.mode || 'video', rate: call.rate || 5, id: call.caller?.id },
        channelName: call.channelName,
      });
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      socket.emit('astro:call:decline', {
        channelName: incomingCall.channelName,
        callerId: incomingCall.caller?.id,
      });
      setIncomingCall(null);
    }
  };

  const toggleMode = (key) => {
    partnerAstroStore.togglePresence(key);
    const updated = { ...presence, [key]: !presence[key] };
    setPresence(updated);
    broadcastPresence(updated, rates);
  };

  const updateFee = (newRate) => {
    const val = Math.max(1, Math.min(200, Number(newRate) || 5));
    partnerAstroStore.updateRate('chat', val);
    partnerAstroStore.updateRate('audio', val);
    partnerAstroStore.updateRate('video', val);
    const updated = { chat: val, audio: val, video: val };
    setRates(updated);
    broadcastPresence(presence, updated);
  };

  const isOnline = presence.chatOnline || presence.audioOnline || presence.videoOnline;
  const netPerMin = ((rates.audio || 5) * 0.85).toFixed(2);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>Astro Talk Partner Portal</Text>
            <Text style={s.headerSubtitle}>ज्योतिष वार्तालाप एवं परामर्श</Text>
          </View>
          <View style={[s.liveDot, { backgroundColor: isOnline ? '#2E7D32' : '#C62828' }]} />
        </View>

        {/* Category Tabs */}
        <View style={s.tabContainer}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat)}
                style={[s.tabPill, isActive && s.tabPillActive]}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>
                  {cat === 'Consultation' ? '⚡ लाइव परामर्श (Live)' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {selectedCategory === 'Consultation' ? (
            <>
              {/* 1. Live Online Broadcast Banner */}
              <LinearGradient
                colors={isOnline ? ['#1B4332', '#2D6A4F'] : ['#491219', '#2E0B10']}
                style={s.onlineBanner}
              >
                <View style={s.onlineBannerHeader}>
                  <View style={s.pulseCircle}>
                    <MaterialCommunityIcons
                      name={isOnline ? 'broadcast' : 'power-standby'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.onlineTitle}>
                      {isOnline ? '🟢 आप लाइव ऑनलाइन हैं' : '🔴 आप ऑफलाइन हैं'}
                    </Text>
                    <Text style={s.onlineSub}>
                      {isOnline
                        ? 'यजमान अब आपको वैदिक संस्कार ऐप में लाइव देखकर कॉल व चैट कर सकते हैं।'
                        : 'कॉल व चैट प्राप्त करने हेतु नीचे दिए टॉगल ऑन करें।'}
                    </Text>
                  </View>
                </View>

                {/* 3 Presence Toggles */}
                <View style={s.presenceRow}>
                  {/* Chat Toggle */}
                  <TouchableOpacity
                    style={[s.presencePill, presence.chatOnline && s.presencePillActive]}
                    onPress={() => toggleMode('chatOnline')}
                  >
                    <MaterialCommunityIcons
                      name="chat-processing"
                      size={18}
                      color={presence.chatOnline ? '#FFFFFF' : '#D0C5B4'}
                    />
                    <Text style={[s.presenceText, presence.chatOnline && s.presenceTextActive]}>
                      चैट {presence.chatOnline ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>

                  {/* Audio Call Toggle */}
                  <TouchableOpacity
                    style={[s.presencePill, presence.audioOnline && s.presencePillActive]}
                    onPress={() => toggleMode('audioOnline')}
                  >
                    <MaterialCommunityIcons
                      name="phone-in-talk"
                      size={18}
                      color={presence.audioOnline ? '#FFFFFF' : '#D0C5B4'}
                    />
                    <Text style={[s.presenceText, presence.audioOnline && s.presenceTextActive]}>
                      कॉल {presence.audioOnline ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>

                  {/* Video Call Toggle */}
                  <TouchableOpacity
                    style={[s.presencePill, presence.videoOnline && s.presencePillActive]}
                    onPress={() => toggleMode('videoOnline')}
                  >
                    <MaterialCommunityIcons
                      name="video"
                      size={18}
                      color={presence.videoOnline ? '#FFFFFF' : '#D0C5B4'}
                    />
                    <Text style={[s.presenceText, presence.videoOnline && s.presenceTextActive]}>
                      वीडियो {presence.videoOnline ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* 2. Rate Configuration Card (₹5/min) */}
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.primary} />
                  <Text style={s.cardTitle}>परामर्श दर निर्धारण (Consultation Rate)</Text>
                </View>

                <View style={s.rateSettingRow}>
                  <View>
                    <Text style={s.rateDisplayNum}>₹{rates.audio || 5} <Text style={s.rateDisplayUnit}>/ मिनट</Text></Text>
                    <Text style={s.rateSubNote}>ऑडियो, वीडियो एवं चैट परामर्श</Text>
                  </View>

                  {/* Quick Rate Stepper */}
                  <View style={s.stepperRow}>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => updateFee((rates.audio || 5) - 1)}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={s.stepVal}>₹{rates.audio || 5}</Text>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => updateFee((rates.audio || 5) + 1)}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Earnings Breakdown */}
                <View style={s.breakdownBox}>
                  <View style={s.breakdownItem}>
                    <Text style={s.breakdownLabel}>यजमान भुगतान:</Text>
                    <Text style={s.breakdownVal}>₹{rates.audio || 5}.00 / मिनट</Text>
                  </View>
                  <View style={s.breakdownItem}>
                    <Text style={s.breakdownLabel}>प्लेटफ़ॉर्म शेयर (15%):</Text>
                    <Text style={s.breakdownVal}>- ₹{((rates.audio || 5) * 0.15).toFixed(2)}</Text>
                  </View>
                  <View style={s.divider} />
                  <View style={s.breakdownItem}>
                    <Text style={[s.breakdownLabel, { fontWeight: '700', color: '#1B4332' }]}>
                      आपकी शुद्ध कमाई (Net Earning):
                    </Text>
                    <Text style={[s.breakdownVal, { fontWeight: '800', color: '#1B4332', fontSize: 15 }]}>
                      ₹{netPerMin} / मिनट
                    </Text>
                  </View>
                </View>
              </View>

              {/* 3. Live Actions: Test & Open Calling & Chat Screens */}
              <Text style={s.sectionHeader}>सक्रिय परामर्श व टूल्स (Launch Console)</Text>

              {/* Action 1: Open Live Chat & Kundali Console */}
              <TouchableOpacity
                style={s.actionCard}
                activeOpacity={0.88}
                onPress={() => {
                  partnerAstroStore.activeSession = {
                    id: `SES-LIVE-${Date.now()}`,
                    channelName: 'vartalap_room_demo',
                    userName: 'रमेश कुमार (यजमान)',
                    userId: 'U101',
                    mode: 'chat',
                    rate: rates.chat || 5,
                    topic: 'करियर व नौकरी (Career & Job)',
                    birthDetails: {
                      dob: '15-08-1994',
                      tob: '06:45 AM',
                      pob: 'लखनऊ, उत्तर प्रदेश',
                      gender: 'पुरुष (Male)',
                      kundali: {
                        lagna: 'सिंह (Leo)',
                        rashi: 'वृश्चिक (Scorpio)',
                        nakshatra: 'अनुराधा (चरण 2)',
                      },
                    },
                    elapsedSeconds: 0,
                    netRatePerMinute: Math.round((rates.chat || 5) * 0.85),
                    chatMessages: [
                      {
                        id: `M-${Date.now()}`,
                        sender: 'client',
                        text: 'प्रणाम गुरुजी! मेरी कुंडली देखकर बताएं कि मेरी नौकरी में पदोन्नति का योग कब बन रहा है?',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ],
                    privateNotes: '',
                  };
                  partnerAstroStore.notify();
                  navigation.navigate('AstroSession');
                }}
              >
                <View style={[s.actionIconDisc, { backgroundColor: '#EDE7F6' }]}>
                  <MaterialCommunityIcons name="chat-processing" size={26} color="#5E35B1" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={s.actionTitle}>लाइव चैट एवं ऑटो-कुंडली कंसोल</Text>
                  <Text style={s.actionSub}>यजमान के साथ रीयल-टाइम 2-Way चैट व निजी नोट्स</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#A08E90" />
              </TouchableOpacity>

              {/* Action 2: Start / Test Agora Video & Audio Call */}
              <TouchableOpacity
                style={s.actionCard}
                activeOpacity={0.88}
                onPress={() => {
                  navigation.navigate('InCall', {
                    caller: { name: 'यजमान (Customer)', mode: 'video', rate: rates.video || 5, id: 'U101' },
                    channelName: 'vartalap_room_demo',
                  });
                }}
              >
                <View style={[s.actionIconDisc, { backgroundColor: '#E0F2F1' }]}>
                  <MaterialCommunityIcons name="video" size={26} color="#00897B" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={s.actionTitle}>अगोरा वीडियो व ऑडियो कॉल स्टेज</Text>
                  <Text style={s.actionSub}>लाइव HD कैमरा, म्यूट/स्पीकर एवं मानदेय मीटर</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#A08E90" />
              </TouchableOpacity>

              {/* Action 3: Kundali Tools */}
              <TouchableOpacity
                style={s.actionCard}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('KundaliTools')}
              >
                <View style={[s.actionIconDisc, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="om" size={26} color="#E65100" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={s.actionTitle}>वैदिक कुंडली व पंचांग टूल्स</Text>
                  <Text style={s.actionSub}>ग्रह स्थिति, दशा, अष्टकवर्ग व लग्न गणना</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#A08E90" />
              </TouchableOpacity>

              {/* 4. Today's Consultations Stats */}
              <View style={s.statsCard}>
                <Text style={s.statsHeader}>आज का परामर्श विवरण (Today's Ledger)</Text>
                <View style={s.statsGrid}>
                  <View style={s.statCol}>
                    <Text style={s.statVal}>₹{stats.todayEarnings || 1840}</Text>
                    <Text style={s.statLabel}>कुल मानदेय</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statCol}>
                    <Text style={s.statVal}>{stats.todayMinutes || 98} m</Text>
                    <Text style={s.statLabel}>कुल समय</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statCol}>
                    <Text style={s.statVal}>⭐ {stats.averageRating || '4.96'}</Text>
                    <Text style={s.statLabel}>रेटिंग</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* Fixed Package Offerings */
            <View style={s.list}>
              {displayedServices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedPackage(item);
                    setPkgPrice(String(item.price));
                  }}
                  style={s.serviceCard}
                >
                  <View style={s.iconCircle}>
                    <MaterialCommunityIcons name="creation" size={24} color="#D48B28" />
                  </View>

                  <View style={s.serviceInfo}>
                    <View style={s.titlePriceRow}>
                      <Text style={s.serviceTitle}>{item.title}</Text>
                      <Text style={s.servicePrice}>₹ {item.price.toLocaleString('en-IN')}</Text>
                    </View>
                    <Text style={s.serviceSubtitle}>{item.subtitle}</Text>
                  </View>

                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#A08E90" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Package Edit Modal */}
      <Modal visible={!!selectedPackage} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{selectedPackage?.title}</Text>
            <Text style={s.modalSub}>{selectedPackage?.subtitle}</Text>

            <Text style={s.inputLabel}>सेवा शुल्क (Service Fee):</Text>
            <View style={s.priceInputWrap}>
              <Text style={s.rupeePrefix}>₹</Text>
              <TextInput
                style={s.priceInput}
                value={pkgPrice}
                onChangeText={setPkgPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, s.cancelBtn]}
                onPress={() => setSelectedPackage(null)}
              >
                <Text style={s.cancelBtnText}>रद्द करें</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.saveBtn]}
                onPress={() => {
                  if (selectedPackage) {
                    selectedPackage.price = Number(pkgPrice) || selectedPackage.price;
                    Alert.alert('सहेजा गया', `${selectedPackage.title} का शुल्क अपडेट कर दिया गया है।`);
                  }
                  setSelectedPackage(null);
                }}
              >
                <Text style={s.saveBtnText}>सहेजें</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Real-time Astrologer Agora Incoming Audio / Video / Chat Consultation Modal */}
      <Modal
        visible={!!incomingCall}
        transparent
        animationType="slide"
        onRequestClose={handleDeclineCall}
      >
        <View style={s.callModalOverlay}>
          <View style={s.callModalCard}>
            <LinearGradient
              colors={['#2D0B3F', '#4A154B']}
              style={s.callModalGrad}
            >
              <View style={s.callPulseDisc}>
                <MaterialCommunityIcons
                  name={
                    incomingCall?.mode === 'video'
                      ? 'video'
                      : incomingCall?.mode === 'chat'
                      ? 'chat-processing'
                      : 'phone-in-talk'
                  }
                  size={36}
                  color="#FFD700"
                />
              </View>

              <Text style={s.callIncomingBadge}>
                {incomingCall?.mode === 'video'
                  ? '📹 INCOMING VIDEO CALL'
                  : incomingCall?.mode === 'chat'
                  ? '💬 INCOMING CHAT CONSULTATION'
                  : '📞 INCOMING AUDIO CALL'}
              </Text>

              <Text style={s.callNameText}>
                {incomingCall?.caller?.name || 'Devotee / Yajman'}
              </Text>

              <Text style={s.callRateText}>
                वैदिक परामर्श · ₹{incomingCall?.rate || 5}/min
              </Text>

              <View style={s.callActionButtons}>
                <TouchableOpacity
                  style={[s.callBtn, s.declineCallBtn]}
                  onPress={handleDeclineCall}
                >
                  <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFFFFF" />
                  <Text style={s.callBtnText}>Decline (अस्वीकार)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.callBtn, s.acceptCallBtn]}
                  onPress={handleAcceptCall}
                >
                  <MaterialCommunityIcons
                    name={
                      incomingCall?.mode === 'video'
                        ? 'video'
                        : incomingCall?.mode === 'chat'
                        ? 'chat'
                        : 'phone'
                    }
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text style={s.callBtnText}>Accept (स्वीकार करें)</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6DB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: 'serif',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8A7570',
    marginTop: 2,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6DB',
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7570',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  onlineBanner: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    ...shadow(3),
  },
  onlineBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineSub: {
    fontSize: 12,
    color: '#E8F5E9',
    marginTop: 3,
    lineHeight: 16,
  },
  presenceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presencePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  presencePillActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#81C784',
  },
  presenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0C5B4',
  },
  presenceTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 16,
    ...shadow(2),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E1418',
  },
  rateSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rateDisplayNum: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  rateDisplayUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7570',
  },
  rateSubNote: {
    fontSize: 11,
    color: '#A08E90',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
    paddingHorizontal: 12,
  },
  breakdownBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6E5D53',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E1418',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8DED1',
    marginVertical: 6,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 12,
    marginTop: 6,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 12,
    ...shadow(2),
  },
  actionIconDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E1418',
  },
  actionSub: {
    fontSize: 11,
    color: '#8A7570',
    marginTop: 3,
    lineHeight: 15,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginTop: 6,
    ...shadow(2),
  },
  statsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A7570',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1418',
  },
  statLabel: {
    fontSize: 11,
    color: '#8A7570',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#ECE3D7',
  },
  list: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    ...shadow(2),
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF4E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceInfo: {
    flex: 1,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
  },
  servicePrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.primary,
  },
  serviceSubtitle: {
    fontSize: 11.5,
    color: '#8A7570',
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    ...shadow(4),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1418',
  },
  modalSub: {
    fontSize: 12,
    color: '#8A7570',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E1418',
    marginBottom: 6,
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  rupeePrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontWeight: '700',
    color: '#2E1418',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  cancelBtnText: {
    fontWeight: '700',
    color: '#6E5D53',
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  callModalCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  callModalGrad: {
    padding: 28,
    alignItems: 'center',
  },
  callPulseDisc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.18)',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  callIncomingBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  callNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: serif,
    marginBottom: 4,
    textAlign: 'center',
  },
  callRateText: {
    fontSize: 14,
    color: '#E0D0EA',
    marginBottom: 24,
  },
  callActionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  declineCallBtn: {
    backgroundColor: '#E53935',
  },
  acceptCallBtn: {
    backgroundColor: '#2E7D32',
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
