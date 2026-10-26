import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import partnerDailyPanditStore from '../../services/dailyPanditStore';

export default function DailyRouteScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [sites, setSites] = useState(partnerDailyPanditStore.getSites());
  const [offer, setOffer] = useState(partnerDailyPanditStore.getNewSiteOffer());
  const [backupReq, setBackupReq] = useState(partnerDailyPanditStore.getBackupRequest());
  const [scorecard, setScorecard] = useState(partnerDailyPanditStore.getScorecard());

  // Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState('14 Oct 2026');
  const [leaveReason, setLeaveReason] = useState('पारिवारिक मांगलिक कार्य');

  useEffect(() => {
    const unsub = partnerDailyPanditStore.subscribe((store) => {
      setSites([...store.getSites()]);
      setOffer(store.getNewSiteOffer() ? { ...store.getNewSiteOffer() } : null);
      setBackupReq(store.getBackupRequest() ? { ...store.getBackupRequest() } : null);
      setScorecard({ ...store.getScorecard() });
    });
    return unsub;
  }, []);

  const handleAcceptOffer = () => {
    partnerDailyPanditStore.acceptNewSiteOffer();
    Alert.alert('साइट रूट में जोड़ी गई!', 'नई साइट आपके दैनिक मार्ग में सफलतापूर्वक जोड़ दी गई है।');
  };

  const handleRejectOffer = () => {
    Alert.alert('ऑफर अस्वीकार?', 'क्या आप इस साइट का आवंटन अस्वीकार करना चाहते हैं?', [
      { text: 'रद्द' },
      {
        text: 'हाँ, अस्वीकार करें',
        style: 'destructive',
        onPress: () => {
          partnerDailyPanditStore.rejectNewSiteOffer('समय टकराव');
        },
      },
    ]);
  };

  const handleApplyLeave = () => {
    if (!leaveDate.trim() || !leaveReason.trim()) {
      Alert.alert('अपूर्ण जानकारी', 'कृपया अवकाश की तिथि व कारण भरें।');
      return;
    }
    partnerDailyPanditStore.requestLeave(leaveDate, leaveReason);
    setShowLeaveModal(false);
    Alert.alert(
      'छुट्टी स्वीकृत!',
      `${leaveDate} हेतु आपकी छुट्टी स्वीकृत हो गई है। आपके रूट पर बैकअप पंडित पं. अमित जोशी को आवंटित कर दिया गया है।`
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.navHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.navTitle}>दैनिक पूजा रूट</Text>
          <Text style={s.navSub}>सुबह का नित्य पूजा मार्ग (Daily Pandit)</Text>
        </View>
        <TouchableOpacity style={s.leaveIconBtn} onPress={() => setShowLeaveModal(true)}>
          <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.text} />
          <Text style={s.leaveIconBtnText}>छुट्टी</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Route Summary Card */}
        <View style={s.summaryCard}>
          <View style={s.summaryTopRow}>
            <View>
              <Text style={s.summaryDate}>आज: शनिवार, 10 अक्टूबर 2026</Text>
              <Text style={s.summaryRouteTime}>कुल 5 साइट्स • 06:15 AM से 10:00 AM</Text>
            </View>
            <View style={s.onTimePill}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#FFFFFF" />
              <Text style={s.onTimePillText}>{scorecard.onTimeRate} ऑन-टाइम</Text>
            </View>
          </View>

          <View style={s.earningsMetricRow}>
            <View style={s.earningCol}>
              <Text style={s.earningColLabel}>आज की कमाई</Text>
              <Text style={s.earningColValue}>₹{scorecard.todayEarnings}</Text>
            </View>
            <View style={s.earningDivider} />
            <View style={s.earningCol}>
              <Text style={s.earningColLabel}>पूर्ण विज़िट्स</Text>
              <Text style={s.earningColValue}>
                {sites.filter((s) => s.status === 'COMPLETED' || s.status === 'SITE_CLOSED').length} / {sites.length}
              </Text>
            </View>
            <View style={s.earningDivider} />
            <View style={s.earningCol}>
              <Text style={s.earningColLabel}>मासिक बोनस (≥95%)</Text>
              <Text style={[s.earningColValue, { color: colors.success }]}>₹1,500 पात्र</Text>
            </View>
          </View>
        </View>

        {/* Emergency Backup Ringing Alert (if active) */}
        {backupReq && (
          <View style={s.urgentBackupCard}>
            <View style={s.urgentBackupTop}>
              <View style={s.urgentPill}>
                <MaterialCommunityIcons name="alarm-light" size={14} color="#FFFFFF" />
                <Text style={s.urgentPillText}>आपातकालीन बैकअप अनुरोध • 10 मिनट शेष</Text>
              </View>
              <Text style={s.urgentPayoutBadge}>+₹{backupReq.urgentPayout} अतिरिक्त</Text>
            </View>
            <Text style={s.urgentSiteName}>{backupReq.siteName}</Text>
            <Text style={s.urgentSiteAddress}>{backupReq.address} • {backupReq.vidhiName}</Text>
            <Text style={s.urgentReasonNote}>कारण: {backupReq.reason}</Text>

            <View style={s.urgentActionsRow}>
              <TouchableOpacity
                style={s.urgentRejectBtn}
                onPress={() => partnerDailyPanditStore.dismissBackupRequest()}
              >
                <Text style={s.urgentRejectBtnText}>अस्वीकार</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.urgentAcceptBtn}
                onPress={() => partnerDailyPanditStore.acceptBackupRequest()}
              >
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                <Text style={s.urgentAcceptBtnText}>स्वीकारें (बैकअप लें)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* New Site Assignment Offer from Admin (12-hour SLA) */}
        {offer && (
          <View style={s.newOfferCard}>
            <View style={s.offerHeaderRow}>
              <View style={s.offerBadge}>
                <MaterialCommunityIcons name="star-circle" size={14} color={colors.text} />
                <Text style={s.offerBadgeText}>एडमिन द्वारा नई साइट ऑफर</Text>
              </View>
              <Text style={s.offerTimer}>अवधि: {offer.expiresInHours} घंटे शेष</Text>
            </View>

            <Text style={s.offerSiteTitle}>{offer.siteName}</Text>
            <Text style={s.offerMeta}>
              {offer.area} • {offer.slot} • {offer.distanceKm}
            </Text>

            <View style={s.offerPayoutRow}>
              <View>
                <Text style={s.offerPayoutLabel}>मासिक निश्चित मानदेय</Text>
                <Text style={s.offerPayoutAmount}>₹{offer.monthlyPayout.toLocaleString('en-IN')}<Text style={s.perMonthSub}>/माह</Text></Text>
              </View>
              <Text style={s.offerPerVisit}>₹{offer.perVisitPayout} / विज़िट</Text>
            </View>

            <View style={s.offerActionsRow}>
              <TouchableOpacity style={s.offerRejectBtn} onPress={handleRejectOffer}>
                <Text style={s.offerRejectBtnText}>अस्वीकार</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.offerAcceptBtn} onPress={handleAcceptOffer}>
                <MaterialCommunityIcons name="check-bold" size={16} color={colors.text} />
                <Text style={s.offerAcceptBtnText}>रूट में शामिल करें</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Section Title */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>आज का रूट व साइट्स (क्रमबद्ध)</Text>
          <TouchableOpacity
            onPress={() => partnerDailyPanditStore.triggerEmergencyBackupAlert()}
            style={s.simBackupBtn}
          >
            <MaterialCommunityIcons name="bell-ring" size={14} color={colors.primary} />
            <Text style={s.simBackupBtnText}>टेस्ट बैकअप अलर्ट</Text>
          </TouchableOpacity>
        </View>

        {/* Chronological Sites Route Cards */}
        {sites.map((site, index) => {
          const isDone = site.status === 'COMPLETED';
          const isClosed = site.status === 'SITE_CLOSED';
          const isInProgress = site.status === 'IN_PROGRESS';
          const isCheckedIn = site.status === 'CHECKED_IN';
          const isOnTheWay = site.status === 'ON_THE_WAY';

          return (
            <TouchableOpacity
              key={site.id}
              style={[
                s.siteCard,
                isInProgress && s.siteCardActive,
                isDone && s.siteCardDone,
              ]}
              onPress={() => navigation.navigate('DailyVisit', { siteId: site.id })}
              activeOpacity={0.88}
            >
              {/* Route Timeline Line */}
              <View style={s.timelineCol}>
                <View style={[
                  s.timelineDot,
                  isDone && { backgroundColor: colors.success },
                  isInProgress && { backgroundColor: colors.warning },
                  isCheckedIn && { backgroundColor: '#1976D2' },
                  isOnTheWay && { backgroundColor: '#7E57C2' },
                ]}>
                  {isDone ? (
                    <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={s.timelineIndexText}>{index + 1}</Text>
                  )}
                </View>
                {index < sites.length - 1 && <View style={s.timelineConnector} />}
              </View>

              {/* Site Details */}
              <View style={s.siteInfoCol}>
                <View style={s.siteTopRow}>
                  <Text style={s.siteSlot}>{site.timeSlot}</Text>
                  <View style={[
                    s.statusTag,
                    isDone && { backgroundColor: '#E8F5E9', borderColor: colors.success },
                    isClosed && { backgroundColor: '#FFEBEE', borderColor: colors.danger },
                    isInProgress && { backgroundColor: '#FFF3E0', borderColor: colors.warning },
                    isCheckedIn && { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
                    isOnTheWay && { backgroundColor: '#EDE7F6', borderColor: '#7E57C2' },
                  ]}>
                    <Text style={[
                      s.statusTagText,
                      isDone && { color: colors.success },
                      isClosed && { color: colors.danger },
                      isInProgress && { color: colors.warning },
                      isCheckedIn && { color: '#1976D2' },
                      isOnTheWay && { color: '#5E35B1' },
                    ]}>
                      {isDone ? 'संपन्न ✓' :
                       isClosed ? 'बंद थी (मानदेय देय)' :
                       isInProgress ? 'पूजा जारी है' :
                       isCheckedIn ? 'पहुंच गए' :
                       isOnTheWay ? 'रास्ते में' : 'निर्धारित'}
                    </Text>
                  </View>
                </View>

                <Text style={s.siteName}>{site.siteName}</Text>
                <Text style={s.siteAddress} numberOfLines={1}>
                  {site.address} • {site.distanceKm}
                </Text>
                <Text style={s.siteVidhiNote}>
                  {site.vidhiName} (~{site.durationMin} min) • मानदेय: ₹{site.payout}
                </Text>

                {/* Bottom Action row */}
                <View style={s.siteCardBottom}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="map-marker" size={14} color={colors.textMuted} />
                    <Text style={s.floorNoteText} numberOfLines={1}>{site.floorNote}</Text>
                  </View>
                  <View style={s.actionPill}>
                    <Text style={s.actionPillText}>
                      {isInProgress ? 'पूजा स्क्रीन खोलें →' :
                       isDone ? 'विवरण देखें →' : 'विज़िट शुरू करें →'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Leave Request Modal */}
      <Modal visible={showLeaveModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalTop}>
              <Text style={s.modalTitle}>छुट्टी का आवेदन (Leave Request)</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={s.inputLabel}>अवकाश की तिथि (कम से कम 48 घंटे पूर्व) *</Text>
              <TextInput
                style={s.textInput}
                value={leaveDate}
                onChangeText={setLeaveDate}
                placeholder="उदा. 14 Oct 2026"
              />

              <Text style={[s.inputLabel, { marginTop: 12 }]}>कारण *</Text>
              <TextInput
                style={[s.textInput, { height: 60 }]}
                value={leaveReason}
                onChangeText={setLeaveReason}
                multiline
                placeholder="उदा. पारिवारिक मांगलिक कार्य / तीर्थ यात्रा"
              />

              <View style={s.backupNoticeBox}>
                <MaterialCommunityIcons name="information" size={18} color={colors.primary} />
                <Text style={s.backupNoticeText}>
                  आपकी अनुपस्थिति में आपके रूट की सभी साइट्स बैकअप पंडित पं. अमित जोशी को स्वतः आवंटित कर दी जाएंगी ताकि यजमान की पूजा न छूटे।
                </Text>
              </View>

              <TouchableOpacity style={s.submitLeaveBtn} onPress={handleApplyLeave}>
                <Text style={s.submitLeaveBtnText}>छुट्टी दर्ज करें</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
  },
  navSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  leaveIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  leaveIconBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
    ...shadow(2),
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryDate: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  summaryRouteTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  onTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  onTimePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  earningsMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  earningCol: {
    flex: 1,
    alignItems: 'center',
  },
  earningColLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  earningColValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  earningDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#ECE3D7',
  },
  urgentBackupCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.danger,
    marginBottom: 16,
    ...shadow(3),
  },
  urgentBackupTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  urgentPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  urgentPayoutBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
  },
  urgentSiteName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  urgentSiteAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  urgentReasonNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  urgentActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  urgentRejectBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE3D7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  urgentRejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  urgentAcceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  urgentAcceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  newOfferCard: {
    backgroundColor: '#FFFBF2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.saffron,
    marginBottom: 16,
    ...shadow(2),
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  offerTimer: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  offerSiteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  offerMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  offerPayoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3DFC4',
  },
  offerPayoutLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  offerPayoutAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  perMonthSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  offerPerVisit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  offerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  offerRejectBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE3D7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  offerRejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  offerAcceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffron,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  offerAcceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
  },
  simBackupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simBackupBtnText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  siteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow(1),
  },
  siteCardActive: {
    borderColor: colors.warning,
    backgroundColor: '#FFFDF9',
  },
  siteCardDone: {
    borderColor: '#D4EDDA',
    opacity: 0.9,
  },
  timelineCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECE3D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#ECE3D7',
    marginVertical: 4,
  },
  siteInfoCol: {
    flex: 1,
  },
  siteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteSlot: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  siteName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  siteAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  siteVidhiNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  siteCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  floorNoteText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    maxWidth: 160,
  },
  actionPill: {
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    ...shadow(4),
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FAF7F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  backupNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8EB',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  backupNoticeText: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    lineHeight: 15,
  },
  submitLeaveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitLeaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
