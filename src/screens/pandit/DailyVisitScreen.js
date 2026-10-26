import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import partnerDailyPanditStore from '../../services/dailyPanditStore';

export default function DailyVisitScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const siteId = route.params?.siteId || 'SITE-02';

  const [site, setSite] = useState(partnerDailyPanditStore.getSiteById(siteId));
  const [elapsedSeconds, setElapsedSeconds] = useState(18 * 60); // 18 minutes demo
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isPhotoCaptured, setIsPhotoCaptured] = useState(!!site?.photoProofUrl);

  useEffect(() => {
    const unsub = partnerDailyPanditStore.subscribe((store) => {
      const s = store.getSiteById(siteId);
      if (s) {
        setSite({ ...s });
        if (s.photoProofUrl) setIsPhotoCaptured(true);
      }
    });
    return unsub;
  }, [siteId]);

  // Live timer tick when in progress
  useEffect(() => {
    let interval;
    if (site?.status === 'IN_PROGRESS') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [site?.status]);

  if (!site) {
    return (
      <View style={[s.centerContainer, { paddingTop: insets.top }]}>
        <Text style={s.notFoundText}>साइट विवरण उपलब्ध नहीं है</Text>
      </View>
    );
  }

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCheckedInOrMore = ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'SITE_CLOSED'].includes(site.status);
  const isInProgressOrDone = ['IN_PROGRESS', 'COMPLETED', 'SITE_CLOSED'].includes(site.status);
  const isCompleted = site.status === 'COMPLETED';
  const isSiteClosed = site.status === 'SITE_CLOSED';

  // 70% minimum duration requirement check
  const minRequiredMinutes = Math.round((site.durationMin || 25) * 0.7);
  const currentElapsedMinutes = Math.floor(elapsedSeconds / 60);
  const canComplete = currentElapsedMinutes >= minRequiredMinutes || isCompleted || isSiteClosed;

  // Handlers
  const handleOnTheWay = () => {
    partnerDailyPanditStore.setOnTheWay(site.id);
  };

  const handleScanQr = () => {
    setIsQrModalVisible(true);
  };

  const confirmQrCheckIn = (isBypass = false) => {
    setIsQrModalVisible(false);
    partnerDailyPanditStore.checkIn(site.id, isBypass);
    Alert.alert(
      isBypass ? 'GPS चेक-इन संपन्न' : 'QR कोड व GPS सत्यापित!',
      'स्थल पर आपकी उपस्थिति सत्यापित हो गई है। अब आप "पूजा शुरू करें" दबा सकते हैं।'
    );
  };

  const handleStartPuja = () => {
    partnerDailyPanditStore.startPuja(site.id);
  };

  const handleCapturePhoto = () => {
    Alert.alert(
      'इन-ऐप कैमरा चालू',
      'दीपक व आरती के साथ पूजा स्थल की फोटो खींची जा रही है (गैलरी से अपलोड प्रतिबंधित है)...',
      [
        {
          text: 'फोटो कैप्चर करें (सिमुलेट)',
          onPress: () => {
            setIsPhotoCaptured(true);
          },
        },
      ]
    );
  };

  const handleCompletePuja = () => {
    if (!isPhotoCaptured) {
      Alert.alert('फोटो प्रमाण आवश्यक', 'कृपया पूजा संपन्न करने से पहले इन-ऐप कैमरे से दीपक/आरती की फोटो लें।');
      return;
    }

    partnerDailyPanditStore.completePuja(site.id);
    Alert.alert(
      'पूजा संपन्न!',
      `आज की पूजा सफलता पूर्वक संपन्न दर्ज हो गई है।\nमानदेय: ₹${site.payout} आपके वॉलेट में जुड़ गया है। यजमान को फोटो प्रमाण व समय भेज दिया गया है।`,
      [{ text: 'रूट पर लौटें', onPress: () => navigation.goBack() }]
    );
  };

  const handleSiteClosed = () => {
    Alert.alert(
      'स्थान / दुकान बंद मिली?',
      'यदि स्थल पर पहुंचने पर दुकान या घर बंद है, तो बंद शटर/ताले की फोटो लें। पीआरडी नियमानुसार पंडित जी को पूर्ण विज़िट मानदेय दिया जाएगा।',
      [
        { text: 'रद्द' },
        {
          text: 'बंद की फोटो लें व दर्ज करें',
          onPress: () => {
            partnerDailyPanditStore.markSiteClosed(site.id);
            Alert.alert(
              'स्थल बंद दर्ज',
              `दुकान बंद दर्ज कर ली गई है। मानदेय ₹${site.payout} आपके वॉलेट में क्रेडिट कर दिया गया है।`,
              [{ text: 'रूट पर लौटें', onPress: () => navigation.goBack() }]
            );
          },
        },
      ]
    );
  };

  const handleCallUser = () => {
    Alert.alert(
      'मास्क्ड कॉल (सुरक्षित संपर्क)',
      `${site.contactPerson} को कॉल मिलाई जा रही है...\nनंबर: ${site.contactPhoneMasked}`,
      [{ text: 'कॉल करें', onPress: () => Linking.openURL('tel:919800000000') }, { text: 'रद्द' }]
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={s.navHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.navTitle}>{site.siteName}</Text>
          <Text style={s.navSub}>{site.timeSlot} • मानदेय: ₹{site.payout}</Text>
        </View>
        <TouchableOpacity style={s.callBtn} onPress={handleCallUser}>
          <MaterialCommunityIcons name="phone" size={18} color={colors.primary} />
          <Text style={s.callBtnText}>कॉल</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Site Details Card */}
        <View style={s.siteMetaCard}>
          <View style={s.siteMetaRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={s.siteTitle}>{site.siteName}</Text>
                <View style={s.siteTypeBadge}>
                  <Text style={s.siteTypeBadgeText}>{site.siteType}</Text>
                </View>
              </View>
              <Text style={s.siteAddress}>{site.address}</Text>
            </View>
          </View>

          {/* Pooja Sthal Note */}
          <View style={s.floorNoteBox}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={s.floorNoteLabel}>पूजा स्थल का स्थान:</Text>
              <Text style={s.floorNoteVal}>{site.floorNote}</Text>
            </View>
          </View>

          <View style={s.metaFooterRow}>
            <Text style={s.vidhiText}>
              विधि: <Text style={{ fontWeight: '800', color: colors.text }}>{site.vidhiName}</Text> (~{site.durationMin} मिनट)
            </Text>
            <TouchableOpacity
              style={s.mapsBtn}
              onPress={() => Linking.openURL('https://maps.google.com')}
            >
              <MaterialCommunityIcons name="navigation-variant" size={14} color="#FFFFFF" />
              <Text style={s.mapsBtnText}>नेविगेट</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Tracker Banner */}
        <View style={[
          s.statusBanner,
          isCompleted && { backgroundColor: '#E8F5E9', borderColor: colors.success },
          isSiteClosed && { backgroundColor: '#FFEBEE', borderColor: colors.danger },
        ]}>
          <MaterialCommunityIcons
            name={isCompleted ? 'check-circle' : isSiteClosed ? 'store-remove' : 'progress-clock'}
            size={22}
            color={isCompleted ? colors.success : isSiteClosed ? colors.danger : colors.primary}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.statusBannerTitle}>
              {isCompleted ? 'पूजा संपन्न हो चुकी है ✓' :
               isSiteClosed ? 'स्थल बंद मिला (मानदेय स्वीकृत)' :
               site.status === 'IN_PROGRESS' ? 'पूजा चल रही है (लाइव टाइमर)' :
               site.status === 'CHECKED_IN' ? 'स्थल पर पहुंच चुके हैं' :
               site.status === 'ON_THE_WAY' ? 'रास्ते में हैं...' : 'विज़िट शुरू करने हेतु तैयार'}
            </Text>
            <Text style={s.statusBannerSub}>
              {site.completedAt ? `समापन: ${site.completedAt}` : `निर्धारित समय: ${site.timeSlot}`}
            </Text>
          </View>
        </View>

        {/* Workflow Step 1: Check-in (100m Geofence + QR Code) */}
        <View style={[s.stepCard, isCheckedInOrMore && s.stepCardDone]}>
          <View style={s.stepHeader}>
            <View style={[s.stepNum, isCheckedInOrMore && { backgroundColor: colors.success }]}>
              {isCheckedInOrMore ? (
                <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
              ) : (
                <Text style={s.stepNumText}>1</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.stepTitle}>चेक-इन (GPS 100m + साइट QR)</Text>
              <Text style={s.stepSub}>स्थल पर उपस्थित होने पर QR कोड स्कैन करें</Text>
            </View>
          </View>

          {/* GPS Check indicator */}
          <View style={s.checkIndicatorRow}>
            <MaterialCommunityIcons name="map-marker-check" size={18} color={colors.success} />
            <Text style={s.checkIndicatorText}>GPS जियोफेंस (100 मीटर के भीतर उपस्थित) ✓</Text>
          </View>

          {!isCheckedInOrMore ? (
            <View style={s.stepBtnRow}>
              {site.status !== 'ON_THE_WAY' && (
                <TouchableOpacity style={s.onTheWayBtn} onPress={handleOnTheWay}>
                  <Text style={s.onTheWayBtnText}>रवाना हुए (On The Way)</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.scanQrBtn} onPress={handleScanQr}>
                <MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.text} />
                <Text style={s.scanQrBtnText}>साइट QR कोड स्कैन करें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.verifiedBadgeBox}>
              <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
              <Text style={s.verifiedBadgeText}>
                चेक-इन समय: {site.checkinAt || '07:04 AM'} (GPS व QR सत्यापित)
              </Text>
            </View>
          )}
        </View>

        {/* Workflow Step 2: Pooja Shuru (In-Progress Live Timer) */}
        <View style={[s.stepCard, isInProgressOrDone && s.stepCardDone]}>
          <View style={s.stepHeader}>
            <View style={[s.stepNum, isInProgressOrDone && { backgroundColor: colors.success }]}>
              {isInProgressOrDone ? (
                <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
              ) : (
                <Text style={s.stepNumText}>2</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.stepTitle}>पूजा शुरू व लाइव टाइमर</Text>
              <Text style={s.stepSub}>पूजा आरंभ करते ही टाइमर चालू करें</Text>
            </View>
          </View>

          {site.status === 'CHECKED_IN' && (
            <TouchableOpacity style={s.startPujaBtn} onPress={handleStartPuja}>
              <MaterialCommunityIcons name="fire" size={20} color="#FFFFFF" />
              <Text style={s.startPujaBtnText}>पूजा शुरू करें</Text>
            </TouchableOpacity>
          )}

          {isInProgressOrDone && (
            <View style={s.liveTimerBox}>
              <View style={s.liveClockCol}>
                <Text style={s.liveTimerDigits}>{formatTimer(elapsedSeconds)}</Text>
                <Text style={s.liveTimerLabel}>बीता हुआ समय (Live Duration)</Text>
              </View>
              <View style={s.minReqCol}>
                <Text style={s.minReqVal}>न्यूनतम 70%: {minRequiredMinutes} मिनट</Text>
                <Text style={s.minReqSub}>
                  {currentElapsedMinutes >= minRequiredMinutes ? 'सत्यापन सीमा पूर्ण ✓' : 'चल रहा है...'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Workflow Step 3: Photo Proof (Saboot) */}
        <View style={[s.stepCard, isPhotoCaptured && s.stepCardDone]}>
          <View style={s.stepHeader}>
            <View style={[s.stepNum, isPhotoCaptured && { backgroundColor: colors.success }]}>
              {isPhotoCaptured ? (
                <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
              ) : (
                <Text style={s.stepNumText}>3</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.stepTitle}>पूजा फोटो प्रमाण (In-App Camera)</Text>
              <Text style={s.stepSub}>दीपक/आरती व मंदिर की फोटो (वाटरमार्क सहित)</Text>
            </View>
          </View>

          {isPhotoCaptured ? (
            <View style={s.photoPreviewWrap}>
              <Image
                source={{ uri: site.photoProofUrl || 'https://images.unsplash.com/photo-1609358905561-dd5c234a6549?auto=format&fit=crop&q=80&w=400' }}
                style={s.photoPreview}
              />
              <View style={s.photoWatermarkBar}>
                <Text style={s.photoWatermarkBarText}>
                  {site.photoWatermark || `${site.siteName} • 10-10-2026 07:22 AM • GPS Verified`}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.captureBtn, !isInProgressOrDone && { opacity: 0.5 }]}
              onPress={handleCapturePhoto}
              disabled={!isInProgressOrDone}
            >
              <MaterialCommunityIcons name="camera" size={20} color={colors.text} />
              <Text style={s.captureBtnText}>इन-ऐप कैमरे से फोटो खींचें</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Workflow Step 4: Completion & Edge Cases */}
        {!isCompleted && !isSiteClosed && (
          <View style={s.finalActionsBox}>
            <TouchableOpacity
              style={[s.completeBtn, (!canComplete || !isPhotoCaptured) && { opacity: 0.6 }]}
              onPress={handleCompletePuja}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="check-decagram" size={22} color={colors.text} />
              <Text style={s.completeBtnText}>पूजा संपन्न करें (Complete Visit)</Text>
            </TouchableOpacity>

            {/* Edge case: Site closed */}
            <TouchableOpacity style={s.siteClosedBtn} onPress={handleSiteClosed}>
              <MaterialCommunityIcons name="store-remove" size={18} color={colors.danger} />
              <Text style={s.siteClosedBtnText}>दुकान / स्थान बंद मिला?</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QR Scanner Simulation Modal */}
      <Modal visible={isQrModalVisible} transparent animationType="fade">
        <View style={s.qrModalOverlay}>
          <View style={s.qrModalCard}>
            <View style={s.qrModalTop}>
              <Text style={s.qrModalTitle}>साइट QR कोड स्कैनर</Text>
              <TouchableOpacity onPress={() => setIsQrModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={s.qrFrame}>
              <MaterialCommunityIcons name="qrcode" size={120} color={colors.text} />
              <Text style={s.qrSecretText}>{site.qrSecret || 'VSDK-QR-SITE-8842'}</Text>
            </View>
            <Text style={s.qrHelpText}>
              {site.siteName} पर लगे स्टीकर के QR कोड को कैमरे के सामने रखें।
            </Text>

            <TouchableOpacity
              style={s.qrConfirmBtn}
              onPress={() => confirmQrCheckIn(false)}
            >
              <MaterialCommunityIcons name="camera-iris" size={18} color={colors.text} />
              <Text style={s.qrConfirmBtnText}>QR स्कैन सफल (सिमुलेट करें)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.qrBypassBtn}
              onPress={() => confirmQrCheckIn(true)}
            >
              <Text style={s.qrBypassBtnText}>
                QR खराब है / नहीं मिला? (सिर्फ GPS व फोटो से चेक-इन)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
  },
  navSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  scrollContent: {
    padding: 16,
  },
  siteMetaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 14,
    ...shadow(2),
  },
  siteMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  siteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  siteTypeBadge: {
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  siteTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  siteAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  floorNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EB',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  floorNoteLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  floorNoteVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  metaFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  vidhiText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  mapsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7EB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1D9B5',
    marginBottom: 14,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  statusBannerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stepCardDone: {
    borderColor: '#D4EDDA',
    backgroundColor: '#FCFDFD',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  stepSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  checkIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  checkIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  onTheWayBtn: {
    flex: 1,
    backgroundColor: '#FAF7F0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  onTheWayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  scanQrBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffron,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  scanQrBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  verifiedBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  startPujaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  startPujaBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveTimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  liveClockCol: {
    flex: 1,
    alignItems: 'center',
  },
  liveTimerDigits: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: serif,
  },
  liveTimerLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  minReqCol: {
    borderLeftWidth: 1,
    borderLeftColor: '#ECE3D7',
    paddingLeft: 12,
  },
  minReqVal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  minReqSub: {
    fontSize: 10,
    color: colors.success,
    marginTop: 2,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  captureBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  photoPreviewWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  photoWatermarkBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoWatermarkBarText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  finalActionsBox: {
    marginTop: 8,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffron,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...shadow(2),
  },
  completeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  siteClosedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2DEDE',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  siteClosedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    ...shadow(4),
  },
  qrModalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  qrFrame: {
    backgroundColor: '#FAF7F0',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  qrSecretText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 8,
  },
  qrHelpText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    width: '100%',
    justifyContent: 'center',
  },
  qrConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  qrBypassBtn: {
    marginTop: 12,
    padding: 4,
  },
  qrBypassBtnText: {
    fontSize: 11,
    color: colors.primaryDark,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
