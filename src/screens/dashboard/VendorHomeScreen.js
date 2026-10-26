import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePartner } from '../../context/PartnerContext';
import IncomingRequestModal from '../../components/IncomingRequestModal';
import socket from '../../services/socket';
import panditBookingStore from '../../services/panditBookingStore';
import { JobService, getAuthToken } from '../../services/api';
import api from '../../services/api';
import colors from '../../theme/colors';
import { serif } from '../../theme/styles';
import partnerAstroStore from '../../services/talkToAstroStore';

const TEMPLE_IMAGE = require('../../../assets/sacred_temple_emblem.png');

export default function VendorHomeScreen({ navigation }) {
  const partnerData = usePartner() || {};
  const {
    vendor = null,
    bookings = [],
    setBookings,
    walletBalance = 0,
    expectedEarnings = 0,
    notifications = [],
  } = partnerData;

  const [incomingJob, setIncomingJob] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeBooking, setActiveBooking] = useState(panditBookingStore?.getBooking?.() || null);

  useEffect(() => {
    const unsub = panditBookingStore?.subscribe?.((b) => {
      setActiveBooking(b ? { ...b } : null);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Strictly enforce Admin Approval before allowing partner into the dashboard
  useEffect(() => {
    if (vendor) {
      const isApproved = vendor.status === 'Active' || vendor.kyc === 'Verified' || vendor.status === 'approved';
      if (!isApproved) {
        if (vendor.profileCompleted === false || vendor.status === 'Incomplete') {
          navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
        } else {
          navigation.reset({
            index: 0,
            routes: [{
              name: 'Pending',
              params: {
                email: vendor.email,
                phone: vendor.phone,
                name: vendor.name,
                role: vendor.role,
              },
            }],
          });
        }
      }
    }
  }, [vendor, navigation]);

  useEffect(() => {
    const token = vendor?.token || getAuthToken?.();
    socket?.connect?.(token);
    socket?.emit?.('pandit:join', { vendorId: vendor?.id || 'PND-VERIFIED' });
    socket?.emit?.('astro:online', {
      id: vendor?.id || vendor?._id || 'V4569',
      vendorId: vendor?.id || vendor?._id || 'V4569',
      name: vendor?.name || 'पंडित जी (Live Partner)',
      nameHi: vendor?.name || 'पंडित जी (Live Partner)',
      title: 'सत्यापित वैदिक ज्योतिषी • पार्टनर ऐप',
      isOnline: true,
      rates: { chat: 5, audio: 5, video: 5 },
      rating: 5.0,
      skills: ['Vedic', 'KP Astrology', 'Kundli'],
    });

    // Listen for incoming booking / instant request broadcasts
    const onNewJob = (jobData) => {
      if (jobData) {
        setIncomingJob(jobData);
      }
    };

    const unsubReq = socket?.on?.('booking:request', onNewJob);
    const unsubBrd = socket?.on?.('job:broadcast', onNewJob);
    const unsubJob = socket?.on?.('job:new', onNewJob);
    const unsubInst = socket?.on?.('instant:request', onNewJob);
    const unsubInstNew = socket?.on?.('instant:new', onNewJob);
    const unsubOffer = socket?.on?.('instant:offer', onNewJob);

    const unsubTaken = socket?.on?.('booking:taken', ({ bookingId }) => {
      setIncomingJob((prev) => ((prev?.id || prev?.bookingId) === bookingId ? null : prev));
    });

    const unsubCall = socket?.on?.('astro:call:incoming', (callData) => {
      if (callData) {
        setIncomingCall(callData);
      }
    });

    const unsubCallEnd = socket?.on?.('astro:call:ended', () => {
      setIncomingCall(null);
    });

    return () => {
      [unsubReq, unsubBrd, unsubJob, unsubInst, unsubInstNew, unsubOffer, unsubTaken, unsubCall, unsubCallEnd].forEach((fn) => {
        if (typeof fn === 'function') fn();
      });
    };
  }, [vendor?.id, vendor?.token]);

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
        rate: call.rate || 15,
        topic: call.topic || 'करियर व जीवन परामर्श',
        birthDetails: call.caller?.birthDetails || {
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
        netRatePerMinute: call.rate || 5,
        chatMessages: [
          {
            id: `M-${Date.now()}`,
            sender: 'client',
            text: 'प्रणाम गुरुजी! कृपया मार्गदर्शन करें।',
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

  const handleAcceptJob = async (job) => {
    const currentJob = job || incomingJob;
    if (!currentJob) return;
    setIncomingJob(null);

    const bId = currentJob.id || currentJob.bookingId || currentJob.requestId || 'BK' + Date.now();

    const partnerData = {
      id: vendor?.id || vendor?._id || 'PND-VERIFIED',
      name: vendor?.name || 'पंडित जी',
      phone: vendor?.phone || '',
      photo: vendor?.photo || null,
      rating: vendor?.rating || 5.0,
      reviewsCount: vendor?.reviewsCount || vendor?.completedPoojaCount || 1,
      gurukul: vendor?.gurukul || vendor?.bio || 'वैदिक आचार्य',
    };

    const acceptedBooking = {
      ...currentJob,
      id: bId,
      status: 'ACCEPTED',
      pandit: partnerData,
      acceptedAt: new Date().toISOString(),
    };

    // 1. Store locally in Pandit reactive state store
    panditBookingStore.setBooking(acceptedBooking);

    // 2. Add to Partner bookings list
    if (setBookings) {
      setBookings((prev) => [acceptedBooking, ...prev.filter((b) => (b.id || b._id) !== bId)]);
    }

    // 3. Emit real-time acceptance across backend WebSocket so devotee's screen transitions instantly
    socket.emit('job:accept', { job_id: bId, bookingId: bId, vendorId: partnerData.id, pandit: partnerData });
    socket.emit('booking:accepted', {
      id: bId,
      bookingId: bId,
      status: 'ACCEPTED',
      assignedVendor: partnerData,
      vendor: partnerData,
    });
    socket.emit('instant:update', {
      id: bId,
      requestId: bId,
      status: 'ACCEPTED',
      assignedVendor: partnerData,
      vendor: partnerData,
    });

    try {
      await JobService.accept(bId);
    } catch (e) {
      console.log('Accept API notice:', e?.message);
    }
    api.put(`instant/${bId}/accept`).catch(() => {});

    // 4. Navigate directly to En Route travel navigation screen
    navigation.navigate('EnRoute', { job: acceptedBooking });
  };

  const handleDeclineJob = (reason = 'manual') => {
    if (incomingJob) {
      const bId = incomingJob.id || incomingJob.bookingId;
      socket.emit('job:decline', { job_id: bId, bookingId: bId, reason });
      try {
        JobService.decline(bId).catch(() => {});
      } catch (_) {}
      api.put(`instant/${bId}/decline`).catch(() => {});
    }
    setIncomingJob(null);
  };

  const unreadCount = (notifications || []).length;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar */}
        <View style={s.topBar}>
          <View>
            <Text style={s.brandTitle}>VaidicSanskar</Text>
            <Text style={s.partnerSubtitle}>Vendor Partner</Text>
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
              {vendor?.photo ? (
                <Image source={{ uri: vendor.photo }} style={s.avatarImg} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={22} color="#67101F" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIVE PUJA RESUME BANNER */}
        {activeBooking &&
          activeBooking.status !== 'COMPLETED' &&
          activeBooking.status !== 'CANCELLED' && (
            <TouchableOpacity
              activeOpacity={0.88}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 16,
                marginBottom: 18,
                borderWidth: 1.5,
                borderColor: '#D48B28',
                shadowColor: '#67101F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => {
                const currentStatus = String(activeBooking.status || '').toUpperCase();
                if (currentStatus === 'ARRIVED') {
                  navigation.navigate('StartOtp', { job: activeBooking });
                } else if (currentStatus === 'POOJA_STARTED' || currentStatus === 'IN_PROGRESS') {
                  navigation.navigate('PoojaInProgress', { job: activeBooking });
                } else if (currentStatus === 'COMPLETION_REQUESTED') {
                  navigation.navigate('CompletionOtp', { job: activeBooking });
                } else {
                  navigation.navigate('EnRoute', { job: activeBooking });
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E8E4A', marginRight: 8 }} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E8E4A', letterSpacing: 0.5 }}>
                    सक्रिय पूजा कार्य जारी है • {activeBooking.status}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={20} color="#D48B28" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#2E1418', fontFamily: serif, marginTop: 6 }}>
                {activeBooking.pooja?.name || activeBooking.name || 'वैदिक पूजा'}
              </Text>
              <Text style={{ fontSize: 12, color: '#7D686B', marginTop: 2 }}>
                यजमान: {activeBooking.yajmanName || 'यजमान'} • [टैप कर चरण जारी रखें ›]
              </Text>
            </TouchableOpacity>
          )}

        {/* Today's Overview Card */}
        <LinearGradient
          colors={['#67101F', '#490B15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.overviewCard}
        >
          <Text style={s.overviewHeading}>Today's Overview</Text>

          <View style={s.overviewRow}>
            {/* Left metric */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BookingsList')}
              style={s.metricCol}
            >
              <Text style={s.metricValue}>{(bookings || []).length}</Text>
              <Text style={s.metricLabel}>Upcoming Bookings</Text>
            </TouchableOpacity>

            {/* Vertical separator */}
            <View style={s.metricDivider} />

            {/* Right metric */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('WalletEarnings')}
              style={s.metricCol}
            >
              <Text style={s.metricValue}>₹ {Number(expectedEarnings || 0).toLocaleString('en-IN')}</Text>
              <Text style={s.metricLabel}>Expected Earnings</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions Header */}
        <Text style={s.sectionTitle}>Quick Actions</Text>

        {/* 2x2 Grid of Actions */}
        <View style={s.grid}>
          {/* 1. My Bookings */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BookingsList')}
            style={s.actionCard}
          >
            <View style={s.actionIconCircle}>
              <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#D48B28" />
            </View>
            <Text style={s.actionTitle}>My Bookings</Text>
          </TouchableOpacity>

          {/* 2. Mandali (Pooja Group) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MandaliManagement')}
            style={s.actionCard}
          >
            <View style={s.actionIconCircle}>
              <MaterialCommunityIcons name="account-group-outline" size={24} color="#D48B28" />
            </View>
            <Text style={s.actionTitle}>Mandali{'\n'}(Pooja Group)</Text>
          </TouchableOpacity>

          {/* 3. Astrology Consultations */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AstrologyServices')}
            style={s.actionCard}
          >
            <View style={s.actionIconCircle}>
              <MaterialCommunityIcons name="creation" size={24} color="#D48B28" />
            </View>
            <Text style={s.actionTitle}>Astrology{'\n'}Consultations</Text>
          </TouchableOpacity>

          {/* 4. Profile & Services */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ProfileSettings')}
            style={s.actionCard}
          >
            <View style={s.actionIconCircle}>
              <MaterialCommunityIcons name="account-cog-outline" size={24} color="#D48B28" />
            </View>
            <Text style={s.actionTitle}>Profile & Services</Text>
          </TouchableOpacity>
        </View>

        {/* Spiritual Devotion Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PoojaServices')}
          style={s.devotionBanner}
        >
          <LinearGradient
            colors={['#5A0D1A', '#3C060F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.devotionBannerGrad}
          >
            <View style={s.devotionTextWrap}>
              <Text style={s.devotionTitle}>Your Devotion</Text>
              <Text style={s.devotionSub}>Supports Devotees</Text>
            </View>
            <Image
              source={TEMPLE_IMAGE}
              style={s.devotionTempleImg}
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Real-time Rapido/Uber Pooja Request Modal */}
      <IncomingRequestModal
        visible={!!incomingJob}
        job={incomingJob}
        onAccept={handleAcceptJob}
        onDecline={handleDeclineJob}
      />

      {/* Real-time Astrologer Agora Incoming Audio / Video Call Modal */}
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
                Astrology Consultation · ₹{incomingCall?.rate || 25}/min
              </Text>

              <View style={s.callActionButtons}>
                <TouchableOpacity
                  style={[s.callBtn, s.declineCallBtn]}
                  onPress={handleDeclineCall}
                >
                  <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFFFFF" />
                  <Text style={s.callBtnText}>Decline</Text>
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
                  <Text style={s.callBtnText}>Accept</Text>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#67101F',
    letterSpacing: 0.3,
    fontFamily: 'serif',
  },
  partnerSubtitle: {
    fontSize: 12.5,
    color: '#7D686B',
    fontWeight: '600',
    marginTop: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    position: 'relative',
  },
  redBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D13939',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF5EA',
    borderWidth: 1.5,
    borderColor: '#D48B28',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 26,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  overviewHeading: {
    fontSize: 13,
    color: '#F4D8DE',
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#F4D8DE',
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 14,
    fontFamily: 'serif',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 120,
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDF5EA',
    borderWidth: 1,
    borderColor: '#F6E4CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E1418',
    textAlign: 'center',
    lineHeight: 17,
  },
  devotionBanner: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  devotionBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  devotionTextWrap: {
    flex: 1,
  },
  devotionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
  devotionSub: {
    fontSize: 13,
    color: '#F4D8DE',
    fontWeight: '500',
    marginTop: 2,
  },
  devotionTempleImg: {
    width: 80,
    height: 60,
    opacity: 0.85,
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
    fontFamily: 'serif',
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
    fontSize: 15,
    fontWeight: '700',
  },
});
