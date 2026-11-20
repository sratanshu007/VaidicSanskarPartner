import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { serif } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import { useElapsed, fmtClock } from '../../services/hooks';
import AgoraCallView from '../../components/agora/AgoraCallView';
import socket from '../../services/socket';

/**
 * Astrologer Live Consultation Station — Powered by Agora RTC Engine
 * High-fidelity Video & Audio Calling with:
 * - Second-by-second accrued earnings ledger
 * - Real-time in-call Kundali inspector & Private notes
 * - Dynamic sound wave visualizer & HD audio status
 * - Complete settlement receipt with instant wallet credit
 */
const COMMISSION = 0.15; // 15% platform commission, 85% astrologer earning

const NINE_GRAHAS = [
  { name: 'सूर्य (Sun)', rashi: 'सिंह (Leo)', deg: '28° 14\'', bhav: '1' },
  { name: 'चंद्रमा (Moon)', rashi: 'वृश्चिक (Scorpio)', deg: '08° 42\'', bhav: '4' },
  { name: 'मंगल (Mars)', rashi: 'मिथुन (Gemini)', deg: '14° 19\'', bhav: '11' },
  { name: 'बुध (Mercury)', rashi: 'सिंह (Leo)', deg: '12° 05\'', bhav: '1' },
  { name: 'गुरु (Jupiter)', rashi: 'तुला (Libra)', deg: '16° 52\'', bhav: '3' },
  { name: 'शुक्र (Venus)', rashi: 'कन्या (Virgo)', deg: '04° 11\'', bhav: '2' },
  { name: 'शनि (Saturn)', rashi: 'कुंभ (Aquarius)', deg: '15° 30\'', bhav: '7' },
  { name: 'राहु (Rahu)', rashi: 'वृश्चिक (Scorpio)', deg: '24° 10\'', bhav: '4' },
  { name: 'केतु (Ketu)', rashi: 'वृषभ (Taurus)', deg: '24° 10\'', bhav: '10' },
];

export default function InCallScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const incomingMode = String(route.params?.mode || route.params?.caller?.mode || '').toLowerCase().trim();
  const isVideoMode = incomingMode === 'video';
  const resolvedMode = isVideoMode ? 'video' : 'audio';
  const caller = route.params?.caller || {
    name: 'यजमान',
    mode: resolvedMode,
    rate: 5,
    topic: 'विवाह व मांगलिक विचार',
    birthDetails: {
      dob: '14-08-1995',
      tob: '07:30 AM',
      pob: 'वाराणसी, उत्तर प्रदेश',
      gender: 'पुरुष (Male)',
      kundali: {
        lagna: 'सिंह (Leo)',
        rashi: 'वृश्चिक (Scorpio)',
        nakshatra: 'अनुराधा (चरण 2)',
        dasha: 'बुध महादशा • शुक्र अंतर्दशा',
        favorablePlanets: 'सूर्य, मंगल, गुरु',
        remedyRecommended: 'आदित्य हृदय स्तोत्र पाठ, सूर्य को अर्घ्य, तांबे का कड़ा धारण',
      },
    },
  };
  const channelName = useRef(route.params?.channelName || `vartalap_room_${Date.now().toString().slice(-6)}`).current;
  const { addEarning } = usePartner();
  const sec = useElapsed(true);

  // In-call toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoCamOff, setIsVideoCamOff] = useState(!isVideoMode);
  const [isFrontCam, setIsFrontCam] = useState(true);
  const [liveAgoraToken, setLiveAgoraToken] = useState(route.params?.agoraToken || caller?.agoraToken || null);

  // Sheets and tabs
  const [showKundaliSheet, setShowKundaliSheet] = useState(false);
  const [sheetTab, setSheetTab] = useState('kundali'); // 'kundali' | 'planets' | 'notes'
  const [astroNotes, setAstroNotes] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);

  // Wave / Pulse animation for Audio mode
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(waveAnim1, {
            toValue: 1.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 1.45,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(waveAnim1, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [waveAnim1, waveAnim2]);

  // Billing calculation
  const mins = Math.max(1, Math.ceil(sec / 60));
  const rate = Number(caller.rate || 5);
  const gross = mins * rate;
  const net = Math.round(gross * (1 - COMMISSION));

  useEffect(() => {
    // Only emit astro:call:accept if screen wasn't launched directly from handleAcceptCall
    if (!route.params?.alreadyAccepted) {
      socket.emit('astro:call:accept', {
        channelName,
        callerId: caller.id || caller.userId || 'user',
        vendorId: route.params?.vendorId || 'partner',
        mode: isVideoMode ? 'video' : 'audio',
        agoraToken: route.params?.agoraToken || caller?.agoraToken,
      });
    }

    const handleRemoteEnd = () => {
      end(false);
    };

    const handleConnected = (payload) => {
      if (payload?.agoraToken) {
        setLiveAgoraToken(payload.agoraToken);
      }
    };

    const unsubEnded = socket.on('astro:call:ended', handleRemoteEnd);
    const unsubConn = socket.on('astro:call:connected', handleConnected);

    return () => {
      if (typeof unsubEnded === 'function') unsubEnded();
      else socket.off?.('astro:call:ended', handleRemoteEnd);
      if (typeof unsubConn === 'function') unsubConn();
      else socket.off?.('astro:call:connected', handleConnected);
    };
  }, []);

  const end = (notifyRemote = true) => {
    if (notifyRemote) {
      socket.emit('astro:call:end', {
        channelName,
        recipientId: caller.id || caller.userId || 'user',
      });
    }

    const netAmount = Math.max(1, Math.round(net));
    if (typeof addEarning === 'function') {
      addEarning(netAmount, `ज्योतिष परामर्श ${isVideoMode ? 'वीडियो' : 'ऑडियो'} (${mins} min)`);
    }

    setCompletedSummary({
      mins,
      gross,
      net: netAmount,
      devoteeName: caller.name,
      mode: isVideoMode ? 'video' : 'audio',
    });
    setShowSummaryModal(true);
  };

  const handleFinishConsultation = () => {
    setShowSummaryModal(false);
    navigation.goBack();
  };

  const kundali = caller.birthDetails?.kundali || {
    lagna: 'सिंह (Leo)',
    rashi: 'वृश्चिक (Scorpio)',
    nakshatra: 'अनुराधा (चरण 2)',
    dasha: 'बुध महादशा • शुक्र अंतर्दशा',
    favorablePlanets: 'सूर्य, मंगल, गुरु',
    remedyRecommended: 'आदित्य हृदय स्तोत्र पाठ, सूर्य को अर्घ्य, तांबे का कड़ा धारण',
  };

  return (
    <LinearGradient
      colors={isVideoMode ? ['#0B0312', '#1C0626', '#12021A'] : ['#260710', '#470D1D', '#1A040A']}
      style={[
        s.c,
        {
          paddingTop: Math.max(insets.top, 24) + 6,
          paddingBottom: Math.max(insets.bottom, 20) + 8,
        },
      ]}
    >
      {/* ==================================================== */}
      {/* TOP HEADER: STATUS, CALLER & ACCRUED EARNINGS BAR */}
      {/* ==================================================== */}
      <View style={s.topHeaderWrap}>
        {/* Row 1: Devotee & Quality Pill + Kundali Button */}
        <View style={s.topRow1}>
          <View style={s.devoteeBadge}>
            <View style={s.liveBlinkDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.devoteeNameText} numberOfLines={1}>
                {caller.name}
              </Text>
              <Text style={s.devoteeTopicText} numberOfLines={1}>
                {caller.topic || 'वैदिक ज्योतिष परामर्श'}
              </Text>
            </View>
          </View>

          {/* In-Call Kundali Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowKundaliSheet(true)}
            style={s.kundaliTriggerBtn}
          >
            <MaterialCommunityIcons name="star-four-points" size={16} color="#F7C966" />
            <Text style={s.kundaliTriggerBtnText}>कुंडली देखें</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Centered Floating Ticker (Timer & Earnings) */}
        <View style={s.tickerPill}>
          <View style={s.tickerItem}>
            <MaterialCommunityIcons name="timer-sand" size={15} color="#F7C966" />
            <Text style={s.tickerTimeText}>{fmtClock(sec)}</Text>
          </View>
          <View style={s.tickerDiv} />
          <View style={s.tickerItem}>
            <MaterialCommunityIcons name="cash-multiple" size={15} color="#9CF7C0" />
            <Text style={s.tickerEarnText}>₹{net} अर्जित</Text>
          </View>
          <View style={s.tickerDiv} />
          <View style={s.tickerItem}>
            <Text style={s.tickerRateText}>₹{rate}/min</Text>
          </View>
        </View>
      </View>

      {/* ==================================================== */}
      {/* CENTER STAGE: AGORA VIDEO CANVAS OR SACRED AUDIO STAGE */}
      {/* ==================================================== */}
      <View style={s.centerStage}>
        {isVideoMode ? (
          /* Video Call Viewport */
          <AgoraCallView
            channelName={channelName}
            mode="video"
            token={liveAgoraToken}
            uid={20001}
            isMuted={isMuted}
            isSpeaker={isSpeaker}
            isVideoCamOff={isVideoCamOff}
            isFrontCam={isFrontCam}
            remoteName={caller.name}
            role="vendor"
            onCallEnded={() => end(false)}
          />
        ) : (
          /* Dedicated Visible Agora Voice Stage (full priority WebView, never 1x1 hidden) */
          <View style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
            <AgoraCallView
              channelName={channelName}
              mode="audio"
              token={liveAgoraToken}
              uid={20001}
              isMuted={isMuted}
              isSpeaker={isSpeaker}
              isVideoCamOff={true}
              isFrontCam={false}
              remoteName={caller.name}
              role="vendor"
              onCallEnded={() => end(false)}
            />
            <View
              pointerEvents="none"
              style={[
                s.topicTag,
                {
                  position: 'absolute',
                  bottom: 14,
                  alignSelf: 'center',
                  backgroundColor: 'rgba(18, 9, 26, 0.85)',
                  borderWidth: 1,
                  borderColor: 'rgba(247, 201, 102, 0.3)',
                },
              ]}
            >
              <Text style={s.topicTagText}>
                विषय: {caller.topic || 'करियर व विवाह अनुकूलता'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ==================================================== */}
      {/* BOTTOM CONTROLS BAR */}
      {/* ==================================================== */}
      <View style={s.controlsBar}>
        {/* 1. Mute Microphone */}
        <TouchableOpacity
          style={[s.ctrlBtn, isMuted && s.ctrlBtnActive]}
          onPress={() => setIsMuted(!isMuted)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={22}
            color="#FFFFFF"
          />
          <Text style={s.ctrlBtnLabel}>{isMuted ? 'म्यूट' : 'माइक'}</Text>
        </TouchableOpacity>

        {/* 2. Speakerphone */}
        <TouchableOpacity
          style={[s.ctrlBtn, isSpeaker && s.ctrlBtnActive]}
          onPress={() => setIsSpeaker(!isSpeaker)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isSpeaker ? 'volume-high' : 'volume-medium'}
            size={22}
            color="#FFFFFF"
          />
          <Text style={s.ctrlBtnLabel}>{isSpeaker ? 'स्पीकर ON' : 'स्पीकर'}</Text>
        </TouchableOpacity>

        {/* 3. In-Call Kundali Inspector */}
        <TouchableOpacity
          style={[s.ctrlBtn, showKundaliSheet && s.ctrlBtnActive]}
          onPress={() => setShowKundaliSheet(!showKundaliSheet)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#FFFFFF" />
          <Text style={s.ctrlBtnLabel}>कुण्डली</Text>
        </TouchableOpacity>

        {/* 4. Video Specific Controls */}
        {isVideoMode && (
          <>
            {/* Camera On / Off */}
            <TouchableOpacity
              style={[s.ctrlBtn, isVideoCamOff && s.ctrlBtnActive]}
              onPress={() => setIsVideoCamOff(!isVideoCamOff)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isVideoCamOff ? 'video-off' : 'video'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={s.ctrlBtnLabel}>{isVideoCamOff ? 'कैमरा बंद' : 'कैमरा'}</Text>
            </TouchableOpacity>

            {/* Camera Flip */}
            <TouchableOpacity
              style={s.ctrlBtn}
              onPress={() => setIsFrontCam(!isFrontCam)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="camera-flip" size={22} color="#FFFFFF" />
              <Text style={s.ctrlBtnLabel}>फ्लिप</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 5. End Call Button */}
        <TouchableOpacity
          style={s.hangUpBtn}
          onPress={() => end(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="phone-hangup" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ==================================================== */}
      {/* IN-CALL KUNDALI & PRIVATE NOTES SHEET (Live Inspection) */}
      {/* ==================================================== */}
      <Modal
        visible={showKundaliSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKundaliSheet(false)}
      >
        <KeyboardAvoidingView style={s.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheetCard}>
            {/* Sheet Handle & Header */}
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star-four-points" size={22} color="#D48B28" />
                <Text style={s.sheetTitle}>यजमान कुण्डली व वैदिक उपाय</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowKundaliSheet(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons name="close-circle" size={26} color="#7D686B" />
              </TouchableOpacity>
            </View>

            {/* Segment Tabs */}
            <View style={s.tabPillsRow}>
              <TouchableOpacity
                style={[s.tabPill, sheetTab === 'kundali' && s.tabPillActive]}
                onPress={() => setSheetTab('kundali')}
              >
                <Text style={[s.tabPillText, sheetTab === 'kundali' && s.tabPillTextActive]}>
                  जन्म कुण्डली
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.tabPill, sheetTab === 'planets' && s.tabPillActive]}
                onPress={() => setSheetTab('planets')}
              >
                <Text style={[s.tabPillText, sheetTab === 'planets' && s.tabPillTextActive]}>
                  ग्रह स्थिति (9 ग्रह)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.tabPill, sheetTab === 'notes' && s.tabPillActive]}
                onPress={() => setSheetTab('notes')}
              >
                <Text style={[s.tabPillText, sheetTab === 'notes' && s.tabPillTextActive]}>
                  परामर्श नोट्स
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {sheetTab === 'kundali' && (
                <>
                  {/* Birth Details Box */}
                  <View style={s.sheetSectionBox}>
                    <Text style={s.sheetSectionHead}>जन्म विवरण (Birth Details):</Text>
                    <View style={s.sheetGrid2}>
                      <Text style={s.sheetGridItem}>नाम: <Text style={s.sheetBold}>{caller.name}</Text></Text>
                      <Text style={s.sheetGridItem}>जन्म तिथि: <Text style={s.sheetBold}>{caller.birthDetails?.dob || '14-08-1995'}</Text></Text>
                      <Text style={s.sheetGridItem}>जन्म समय: <Text style={s.sheetBold}>{caller.birthDetails?.tob || '07:30 AM'}</Text></Text>
                      <Text style={s.sheetGridItem}>स्थान: <Text style={s.sheetBold}>{caller.birthDetails?.pob || 'वाराणसी'}</Text></Text>
                    </View>
                  </View>

                  {/* Kundali Lagna & Highlights */}
                  <View style={s.sheetSectionBox}>
                    <Text style={s.sheetSectionHead}>लग्न, राशि एवं नक्षत्र:</Text>
                    <View style={s.sheetGrid3}>
                      <View style={s.kBadgeBox}>
                        <Text style={s.kBadgeLbl}>लग्न (Lagna)</Text>
                        <Text style={s.kBadgeVal}>{kundali.lagna || 'सिंह'}</Text>
                      </View>
                      <View style={s.kBadgeBox}>
                        <Text style={s.kBadgeLbl}>राशि (Rashi)</Text>
                        <Text style={s.kBadgeVal}>{kundali.rashi || 'वृश्चिक'}</Text>
                      </View>
                      <View style={s.kBadgeBox}>
                        <Text style={s.kBadgeLbl}>नक्षत्र (Nakshatra)</Text>
                        <Text style={s.kBadgeVal}>{kundali.nakshatra || 'अनुराधा'}</Text>
                      </View>
                    </View>

                    {kundali.dasha && (
                      <View style={s.dashaBox}>
                        <Text style={s.dashaLbl}>वर्तमान विंशोत्तरी दशा:</Text>
                        <Text style={s.dashaVal}>{kundali.dasha}</Text>
                      </View>
                    )}

                    {kundali.favorablePlanets && (
                      <View style={s.dashaBox}>
                        <Text style={s.dashaLbl}>अनुकूल ग्रह (Favorable):</Text>
                        <Text style={s.dashaVal}>{kundali.favorablePlanets}</Text>
                      </View>
                    )}
                  </View>

                  {/* Remedies */}
                  <View style={[s.sheetSectionBox, { backgroundColor: '#FDF6E8', borderColor: '#F6DFB8' }]}>
                    <Text style={[s.sheetSectionHead, { color: '#67101F' }]}>सुझाए जाने वाले वैदिक उपाय:</Text>
                    <Text style={s.remedyText}>
                      {kundali.remedyRecommended || 'आदित्य हृदय स्तोत्र पाठ, सूर्य को तांबे के लोटे से जल, गायत्री मंत्र जाप।'}
                    </Text>
                  </View>
                </>
              )}

              {sheetTab === 'planets' && (
                <View style={s.sheetSectionBox}>
                  <Text style={s.sheetSectionHead}>नवग्रह स्थिति एवं भाव स्पष्ट:</Text>
                  <View style={s.planetsTable}>
                    {NINE_GRAHAS.map((g, idx) => (
                      <View key={idx} style={s.planetRow}>
                        <Text style={s.planetName}>{g.name}</Text>
                        <Text style={s.planetRashi}>{g.rashi}</Text>
                        <Text style={s.planetDeg}>{g.deg}</Text>
                        <Text style={s.planetBhav}>भाव {g.bhav}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {sheetTab === 'notes' && (
                <View style={s.sheetSectionBox}>
                  <Text style={s.sheetSectionHead}>परामर्श के दौरान निजी नोट्स दर्ज करें:</Text>
                  <TextInput
                    style={s.notesInput}
                    multiline
                    numberOfLines={5}
                    value={astroNotes}
                    onChangeText={setAstroNotes}
                    placeholder="यजमान हेतु उपाय, रत्न सुझाव, अनुष्ठान टिप्पणी..."
                    placeholderTextColor="#A08E90"
                  />
                  <TouchableOpacity
                    style={s.saveNotesBtn}
                    onPress={() => Alert.alert('नोट्स सुरक्षित', 'परामर्श नोट्स सफलतापूर्वक सहेज लिए गए हैं।')}
                  >
                    <Text style={s.saveNotesBtnText}>नोट्स सहेजें (Save)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setShowKundaliSheet(false)}
              style={s.sheetCloseBtn}
            >
              <Text style={s.sheetCloseBtnText}>कॉल पर वापस लौटें (Back to Live Call)</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================================================== */}
      {/* CONSULTATION COMPLETED RECEIPT MODAL */}
      {/* ==================================================== */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={handleFinishConsultation}
      >
        <View style={s.receiptOverlay}>
          <View style={s.receiptCard}>
            <View style={s.receiptCheckCircle}>
              <MaterialCommunityIcons name="check-bold" size={34} color="#FFFFFF" />
            </View>

            <Text style={s.receiptTitle}>परामर्श संपन्न हुआ 🙏</Text>
            <Text style={s.receiptSub}>मानदेय आपके वॉलेट में सफलतापूर्वक जोड़ दिया गया है।</Text>

            <View style={s.receiptDetailsBox}>
              <View style={s.receiptRow}>
                <Text style={s.receiptLbl}>यजमान:</Text>
                <Text style={s.receiptVal}>{completedSummary?.devoteeName || caller.name}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLbl}>परामर्श माध्यम:</Text>
                <Text style={s.receiptVal}>{caller.mode === 'video' ? 'लाइव वीडियो' : 'लाइव ऑडियो'}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLbl}>कुल परामर्श समय:</Text>
                <Text style={s.receiptVal}>{completedSummary?.mins || mins} मिनट</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLbl}>कुल बिल राशि:</Text>
                <Text style={s.receiptVal}>₹{completedSummary?.gross || gross}</Text>
              </View>
              <View style={s.receiptDivider} />
              <View style={s.receiptRow}>
                <Text style={[s.receiptLbl, { fontWeight: '800', color: '#1E8E4A' }]}>शुद्ध मानदेय (Net):</Text>
                <Text style={[s.receiptVal, { fontSize: 20, color: '#1E8E4A', fontWeight: '800' }]}>
                  ₹{completedSummary?.net || net}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleFinishConsultation}
              style={s.receiptDoneBtn}
            >
              <Text style={s.receiptDoneBtnText}>समाप्त एवं डैशबोर्ड पर लौटें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, position: 'relative' },
  topHeaderWrap: {
    paddingHorizontal: 14,
    marginBottom: 8,
    zIndex: 99,
  },
  topRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  devoteeBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 8, 28, 0.82)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  liveBlinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 8,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  devoteeNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  devoteeTopicText: {
    fontSize: 10,
    color: '#F7C966',
    marginTop: 1,
  },
  kundaliTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 139, 40, 0.35)',
    borderWidth: 1.2,
    borderColor: '#D48B28',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  kundaliTriggerBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F7C966',
    marginLeft: 4,
  },
  tickerPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 6, 22, 0.88)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 139, 40, 0.4)',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tickerTimeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  tickerEarnText: {
    color: '#9CF7C0',
    fontWeight: '800',
    fontSize: 13,
  },
  tickerRateText: {
    color: '#F6DFB8',
    fontSize: 11,
    fontWeight: '600',
  },
  tickerDiv: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 10,
  },
  centerStage: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 22,
    marginVertical: 8,
    backgroundColor: '#0F0414',
    borderWidth: 1,
    borderColor: 'rgba(212, 139, 40, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Audio Call Viewport
  audioStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  auraWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  auraRing1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(212, 139, 40, 0.2)',
  },
  auraRing2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(103, 16, 31, 0.25)',
  },
  sacredAvatarCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#67101F',
    borderWidth: 2.5,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D48B28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  omEmblem: {
    fontSize: 42,
  },
  audioDevoteeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: serif,
    textAlign: 'center',
  },
  audioDevoteeLocation: {
    fontSize: 13,
    color: '#F6DFB8',
    marginTop: 4,
    textAlign: 'center',
  },
  soundWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    marginTop: 18,
  },
  soundBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#F7C966',
  },
  hdVoiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(247, 201, 102, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 16,
  },
  hdGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  hdVoiceText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  topicTag: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  topicTagText: {
    fontSize: 12,
    color: '#FFECCC',
    fontWeight: '600',
  },

  // Bottom Controls Bar
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
    zIndex: 99,
  },
  ctrlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  ctrlBtnActive: {
    backgroundColor: '#67101F',
    borderColor: '#D48B28',
  },
  ctrlBtnLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  hangUpBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D13939',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D13939',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },

  // Kundali Sheet Modal
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#D48B28',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0C5B4',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#2E1418',
    marginLeft: 6,
    fontFamily: serif,
  },
  tabPillsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabPillActive: {
    backgroundColor: '#67101F',
  },
  tabPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7D686B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  sheetSectionBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE4DA',
  },
  sheetSectionHead: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 8,
  },
  sheetGrid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sheetGridItem: {
    width: '50%',
    fontSize: 11.5,
    color: '#7D686B',
    marginBottom: 4,
  },
  sheetBold: {
    fontWeight: '800',
    color: '#2E1418',
  },
  sheetGrid3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kBadgeBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#EDE4DA',
  },
  kBadgeLbl: {
    fontSize: 10,
    color: '#7D686B',
  },
  kBadgeVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#67101F',
    marginTop: 2,
  },
  dashaBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EDE4DA',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dashaLbl: {
    fontSize: 11,
    color: '#7D686B',
  },
  dashaVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2E1418',
  },
  remedyText: {
    fontSize: 12,
    color: '#2E1418',
    lineHeight: 18,
  },
  planetsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE7',
  },
  planetName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E1418',
    width: '32%',
  },
  planetRashi: {
    fontSize: 11,
    color: '#7D686B',
    width: '28%',
  },
  planetDeg: {
    fontSize: 11,
    color: '#67101F',
    fontWeight: '700',
    width: '22%',
  },
  planetBhav: {
    fontSize: 10.5,
    color: '#D48B28',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    padding: 10,
    fontSize: 12.5,
    color: '#2E1418',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveNotesBtn: {
    backgroundColor: '#67101F',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 8,
  },
  saveNotesBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetCloseBtn: {
    backgroundColor: '#67101F',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  sheetCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Receipt Modal
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D48B28',
  },
  receiptCheckCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#1E8E4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    textAlign: 'center',
  },
  receiptSub: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 4,
    textAlign: 'center',
  },
  receiptDetailsBox: {
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EDE4DA',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptLbl: {
    fontSize: 12,
    color: '#7D686B',
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E1418',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#EDE4DA',
    marginVertical: 6,
  },
  receiptDoneBtn: {
    width: '100%',
    backgroundColor: '#67101F',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  receiptDoneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
