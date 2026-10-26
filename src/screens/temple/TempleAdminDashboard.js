import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { serif, shadow } from '../../theme/styles';
import templeAdminStore from '../../services/templeAdminStore';

export default function TempleAdminDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const [, setTick] = useState(0);

  const [announcementModal, setAnnouncementModal] = useState(false);
  const [streamModal, setStreamModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [streamUrlText, setStreamUrlText] = useState('');

  useEffect(() => {
    const unsub = templeAdminStore.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const temple = templeAdminStore.getTemple();

  const handleSaveAnnouncement = () => {
    templeAdminStore.updateAnnouncement(announcementText);
    setAnnouncementModal(false);
    Alert.alert('सफल', 'मंदिर की विशेष सूचना श्रद्धालुओं के ऐप पर अद्यतन कर दी गई है।');
  };

  const handleSaveStream = () => {
    templeAdminStore.updateLiveStreamUrl(streamUrlText);
    setStreamModal(false);
    Alert.alert('सफल', 'लाइव दर्शन स्ट्रीम लिंक सुरक्षित किया गया।');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Header */}
      <View style={[s.head, { paddingTop: insets.top + 8 }]}>
        <View style={s.headTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.headSub}>मंदिर प्रबंधन वर्कबेंच</Text>
            <Text style={s.headTitle}>Temple Admin Portal</Text>
          </View>
          <TouchableOpacity
            style={s.headHelpBtn}
            onPress={() => Alert.alert('सहायता', 'मंदिर व्यवस्थापक हेल्पलाइन: 1800-200-8899')}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.maroon} />
          </TouchableOpacity>
        </View>

        {/* Temple Name & Verification Card */}
        <View style={s.templeHeaderCard}>
          <MaterialCommunityIcons name="temple-hindu" size={32} color={colors.saffron} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.templeCardName} numberOfLines={1}>{temple.name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={16} color="#D97706" />
            </View>
            <Text style={s.templeCardLoc}>{temple.city} • {temple.deity}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Live Gates & Streaming Controls */}
        <View style={s.liveControlsCard}>
          <Text style={s.sectionHeaderTitle}>लाइव स्थिति नियंत्रण (Live Gate & Stream)</Text>

          <View style={s.controlRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.controlTitle}>मंदिर कपाट स्थिति</Text>
              <Text style={s.controlSub}>
                {temple.isOpen ? 'वर्तमान में खुला है (Open)' : 'वर्तमान में बंद है (Closed)'}
              </Text>
            </View>
            <Switch
              value={temple.isOpen}
              onValueChange={() => templeAdminStore.toggleOpenStatus()}
              trackColor={{ true: colors.success, false: '#CBD5E1' }}
            />
          </View>

          <View style={[s.controlRow, { borderTopWidth: 1, borderTopColor: '#F6F0E6' }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.controlTitle}>लाइव दर्शन वीडियो स्ट्रीम</Text>
              <Text style={s.controlSub}>
                {temple.isLiveStreamActive ? 'भक्तों को लाइव दिख रहा है' : 'स्ट्रीम बंद है'}
              </Text>
            </View>
            <Switch
              value={temple.isLiveStreamActive}
              onValueChange={() => templeAdminStore.toggleLiveStream()}
              trackColor={{ true: colors.primary, false: '#CBD5E1' }}
            />
          </View>
        </View>

        {/* Today's KPI Metrics */}
        <View style={s.kpiGrid}>
          <View style={s.kpiCard}>
            <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
            <Text style={s.kpiValue}>{temple.stats.todayDevotees}</Text>
            <Text style={s.kpiLabel}>आज के दर्शनार्थी</Text>
          </View>

          <View style={s.kpiCard}>
            <MaterialCommunityIcons name="crown" size={24} color="#D97706" />
            <Text style={s.kpiValue}>{temple.stats.todayVipPasses}</Text>
            <Text style={s.kpiLabel}>सुगम/VIP पास</Text>
          </View>

          <View style={s.kpiCard}>
            <MaterialCommunityIcons name="hand-coin" size={24} color="#059669" />
            <Text style={s.kpiValue}>₹{temple.stats.todayDonation.toLocaleString()}</Text>
            <Text style={s.kpiLabel}>हुंडी दान संग्रह</Text>
          </View>

          <View style={s.kpiCard}>
            <MaterialCommunityIcons name="bell-alert" size={24} color="#DC2626" />
            <Text style={s.kpiValue}>{temple.stats.pendingSuggestions}</Text>
            <Text style={s.kpiLabel}>लंबित सुझाव</Text>
          </View>
        </View>

        {/* Active Festival / Special Day Announcement */}
        <View style={s.announcementBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="bullhorn" size={18} color="#92400E" />
              <Text style={s.announcementHeader}>त्योहार व विशेष घोषणा</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setAnnouncementText(temple.announcement);
                setAnnouncementModal(true);
              }}
            >
              <Text style={s.editLink}>बदलें ›</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.announcementContent}>{temple.announcement}</Text>
        </View>

        {/* Management Tool Cards */}
        <Text style={[s.sectionHeaderTitle, { marginTop: 16, marginBottom: 10 }]}>
          प्रबंधन मॉड्यूल (Management Modules)
        </Text>

        {/* 1. Aarti & Darshan Timings */}
        <TouchableOpacity
          style={s.moduleCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('TempleTimings')}
        >
          <View style={[s.moduleIconBox, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="clock-edit-outline" size={24} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.moduleTitle}>दर्शन व आरती समय सारिणी</Text>
            <Text style={s.moduleSub}>
              मंगला, भोग, संध्या, शृंगार, शयन आरती समय व दैनिक कपाट घंटे
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 2. Darshan Slots Manager */}
        <TouchableOpacity
          style={s.moduleCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('TempleSlots')}
        >
          <View style={[s.moduleIconBox, { backgroundColor: '#CCFBF1' }]}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="#0D9488" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.moduleTitle}>दर्शन स्लॉट व कोटा प्रबंधन</Text>
            <Text style={s.moduleSub}>
              समय स्लॉट, प्रति स्लॉट क्षमता (300) व सुगम/VIP पास दर
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 3. Live Stream Setup */}
        <TouchableOpacity
          style={s.moduleCard}
          activeOpacity={0.8}
          onPress={() => {
            setStreamUrlText(temple.liveStreamUrl);
            setStreamModal(true);
          }}
        >
          <View style={[s.moduleIconBox, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="video-wireless-outline" size={24} color="#DC2626" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.moduleTitle}>लाइव दर्शन स्ट्रीम लिंक</Text>
            <Text style={s.moduleSub}>YouTube या HLS लाइव वीडियो फीड URL</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 4. Facilities Checklist */}
        <View style={s.facilitiesCard}>
          <Text style={s.moduleTitle}>भक्त सुविधाएं (Facilities Checklist)</Text>
          <Text style={[s.moduleSub, { marginBottom: 10 }]}>
            मंदिर परिसर में उपलब्ध सुविधाओं को चालू या बंद करें:
          </Text>
          <View style={s.facilityGrid}>
            {temple.facilities.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[s.facilityChip, f.available && s.facilityChipActive]}
                onPress={() => templeAdminStore.toggleFacility(f.key)}
              >
                <MaterialCommunityIcons
                  name={f.icon}
                  size={16}
                  color={f.available ? colors.maroon : colors.textMuted}
                />
                <Text style={[s.facilityChipText, f.available && s.facilityChipTextActive]}>
                  {f.label}
                </Text>
                <Ionicons
                  name={f.available ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={f.available ? colors.success : colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Suggestions Queue */}
        <View style={s.queueCard}>
          <Text style={s.moduleTitle}>श्रद्धालु सुझाव कतार (Suggestions Queue)</Text>
          <Text style={s.moduleSub}>उपयोगकर्ताओं द्वारा भेजे गए संशोधन:</Text>

          {temple.suggestionsQueue.map((sug) => (
            <View key={sug.id} style={s.sugItem}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.sugUser}>{sug.user}</Text>
                  <Text style={s.sugType}>• {sug.type}</Text>
                </View>
                <Text style={s.sugDetails}>{sug.details}</Text>
                <Text style={s.sugDate}>{sug.date}</Text>
              </View>

              {sug.status === 'pending' ? (
                <View style={s.sugActionCol}>
                  <TouchableOpacity
                    style={s.sugApproveBtn}
                    onPress={() => templeAdminStore.approveSuggestion(sug.id)}
                  >
                    <Text style={s.sugApproveText}>स्वीकार</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.sugRejectBtn}
                    onPress={() => templeAdminStore.rejectSuggestion(sug.id)}
                  >
                    <Text style={s.sugRejectText}>अस्वीकार</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.sugStatusBadge}>
                  <Text style={s.sugStatusText}>
                    {sug.status === 'approved' ? '✓ स्वीकृत' : '✕ अस्वीकृत'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Announcement Edit Modal */}
      <Modal visible={announcementModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>त्योहार व विशेष घोषणा</Text>
              <TouchableOpacity onPress={() => setAnnouncementModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>
              यह संदेश मंदिर खोजक (Temple Locator) में मंदिर विवरण पृष्ठ पर सबसे ऊपर हाइलाइट होगा:
            </Text>
            <TextInput
              style={s.modalInput}
              multiline
              numberOfLines={4}
              value={announcementText}
              onChangeText={setAnnouncementText}
              placeholder="घोषणा लिखें..."
            />
            <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveAnnouncement}>
              <Text style={s.modalSaveBtnText}>घोषणा प्रकाशित करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Stream URL Modal */}
      <Modal visible={streamModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>लाइव दर्शन वीडियो लिंक</Text>
              <TouchableOpacity onPress={() => setStreamModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>
              YouTube Live या RTSP/HLS स्ट्रीम लिंक दर्ज करें:
            </Text>
            <TextInput
              style={[s.modalInput, { height: 50 }]}
              value={streamUrlText}
              onChangeText={setStreamUrlText}
              placeholder="https://youtube.com/live/..."
            />
            <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveStream}>
              <Text style={s.modalSaveBtnText}>लिंक सुरक्षित करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  head: {
    backgroundColor: '#FAF7F0',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D6',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  headTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '700',
    color: colors.maroon,
  },
  headHelpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templeHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    ...shadow,
  },
  templeCardName: {
    fontFamily: serif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.maroon,
  },
  templeCardLoc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  liveControlsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadow,
  },
  sectionHeaderTitle: {
    fontFamily: serif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.maroon,
    marginBottom: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  controlTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  controlSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  announcementBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  announcementHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
  },
  editLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  announcementContent: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 6,
    lineHeight: 18,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontFamily: serif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  moduleSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  facilitiesCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  facilityChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  facilityChipText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  facilityChipTextActive: {
    color: colors.maroon,
    fontWeight: '700',
  },
  queueCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  sugItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F6F0E6',
  },
  sugUser: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  sugType: {
    fontSize: 11,
    color: colors.maroon,
    fontWeight: '600',
  },
  sugDetails: {
    fontSize: 11.5,
    color: colors.text,
    marginTop: 2,
    lineHeight: 16,
  },
  sugDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  sugActionCol: {
    marginLeft: 10,
    gap: 6,
  },
  sugApproveBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sugApproveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sugRejectBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sugRejectText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sugStatusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sugStatusText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
  },
  modalHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '700',
    color: colors.maroon,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginVertical: 8,
  },
  modalInput: {
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
    height: 90,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
