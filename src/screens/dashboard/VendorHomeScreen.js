import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePartner } from '../../context/PartnerContext';
import IncomingRequestModal from '../../components/IncomingRequestModal';
import PanditAstroToggleCard from '../../components/PanditAstroToggleCard';
import * as VendorAstroHelper from '../../services/astroPresenceHelper';
import socket from '../../services/socket';
import panditBookingStore from '../../services/panditBookingStore';
import { JobService, getAuthToken } from '../../services/api';
import api from '../../services/api';
import { serif } from '../../theme/styles';
import partnerAstroStore from '../../services/talkToAstroStore';

const AVATAR_FALLBACK = require('../../../assets/profile_krishna_avatar.png');
const PUJA_THUMB = require('../../../assets/banner_havan_kund.png');

export default function VendorHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const partnerData = usePartner() || {};
  const {
    vendor = null,
    bookings = [],
    setBookings,
    refreshBookings,
    refreshEarnings,
    walletBalance = 0,
    expectedEarnings = 0,
    notifications = [],
  } = partnerData;

  useFocusEffect(
    useCallback(() => {
      refreshBookings?.();
      refreshEarnings?.();
    }, [refreshBookings, refreshEarnings])
  );

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
    const partnerId = VendorAstroHelper.resolvePartnerId(vendor, 'PND-VERIFIED');
    socket?.emit?.('pandit:join', { vendorId: partnerId });
    socket?.emit?.('vendor:join', { vendorId: partnerId });
    if (vendor?.isAstroEnabled) {
      VendorAstroHelper.broadcastAstroOnline(vendor);
    }

    const onNewJob = (jobData) => {
      if (jobData) setIncomingJob(jobData);
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
      if (callData) setIncomingCall(callData);
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
        caller: {
          ...(call.caller || {}),
          name: call.userName || call.caller?.name || 'Customer / Devotee',
          mode: call.mode || 'video',
          rate: call.rate || 5,
          id: call.caller?.id || call.userId || 'U101',
          agoraToken: call.agoraToken,
        },
        channelName: call.channelName,
        agoraToken: call.agoraToken,
        vendorId: vendor?.id || 'V4569',
        alreadyAccepted: true,
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
    const pData = {
      id: vendor?.id || vendor?._id || 'PND-VERIFIED',
      name: vendor?.name || 'पंडित जी',
      phone: vendor?.phone || '',
      photo: vendor?.photo || null,
      rating: Number(vendor?.rating || 0),
      reviewsCount: Number(vendor?.reviewsCount || vendor?.completedPoojaCount || 0),
      gurukul: vendor?.gurukul || vendor?.bio || 'वैदिक आचार्य',
    };

    const acceptedBooking = {
      ...currentJob,
      id: bId,
      status: 'ACCEPTED',
      pandit: pData,
      acceptedAt: new Date().toISOString(),
    };

    panditBookingStore.setBooking(acceptedBooking);
    if (setBookings) {
      setBookings((prev) => [acceptedBooking, ...prev.filter((b) => (b.id || b._id) !== bId)]);
    }

    socket.emit('job:accept', { job_id: bId, bookingId: bId, vendorId: pData.id, pandit: pData });
    socket.emit('booking:accepted', {
      id: bId,
      bookingId: bId,
      status: 'ACCEPTED',
      assignedVendor: pData,
      vendor: pData,
    });
    socket.emit('instant:update', {
      id: bId,
      requestId: bId,
      status: 'ACCEPTED',
      assignedVendor: pData,
      vendor: pData,
    });

    try {
      await JobService.accept(bId);
    } catch (e) {
      console.log('Accept API notice:', e?.message);
    }
    api.put(`instant/${bId}/accept`).catch(() => {});

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
  const totalBookingsCount = (bookings || []).length;
  const displayEarnings = Number(walletBalance || expectedEarnings || 0).toLocaleString('en-IN');
  const recentBookings = (bookings || []).slice(0, 3);

  const getStatusStyle = (statusRaw) => {
    const st = String(statusRaw || 'Confirmed').toUpperCase();
    if (st === 'COMPLETED' || st === 'DONE') return { bg: '#EBF8F0', text: '#1E8E4A', label: 'Completed' };
    if (st === 'IN_PROGRESS' || st === 'POOJA_STARTED' || st === 'STARTED') {
      return { bg: '#FFF4E0', text: '#C57B13', label: 'In Progress' };
    }
    if (st === 'ARRIVED') return { bg: '#EBF8F0', text: '#1E8E4A', label: 'Arrived' };
    if (st === 'ON_THE_WAY' || st === 'EN_ROUTE') return { bg: '#EBF8F0', text: '#1E8E4A', label: 'On The Way' };
    if (st === 'ACCEPTED' || st === 'CONFIRMED') {
      return { bg: '#EBF8F0', text: '#1E8E4A', label: 'Confirmed' };
    }
    if (st === 'CANCELLED' || st === 'DECLINED' || st.startsWith('CANCELLED_')) {
      return { bg: '#FDECEC', text: '#D13939', label: 'Cancelled' };
    }
    if (st === 'PENDING_ACCEPTANCE' || st === 'PENDING' || st === 'REQUESTED') {
      return { bg: '#FFF4E0', text: '#C57B13', label: 'New' };
    }
    return { bg: '#FFF4E0', text: '#C57B13', label: statusRaw || 'Pending' };
  };

  return (
    <SafeAreaView style={s.safe} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#67101F" />
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Curved Maroon Header matching Screen 3 */}
        <LinearGradient
          colors={['#6E1020', '#4A0813']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.curvedHeader, { paddingTop: Math.max(insets.top, 20) + 14 }]}
        >
          <View style={s.headerTopRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={s.greetingSmall}>Good Morning,</Text>
              <Text style={s.partnerName} numberOfLines={1}>
                {vendor?.name || 'VaidicSanskar Partner'}
              </Text>
              <View style={s.onlineBadge}>
                <View style={s.onlineDot} />
                <Text style={s.onlineText}>Online</Text>
              </View>
            </View>

            <View style={s.headerRight}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Notifications')}
                style={s.bellBtn}
              >
                <MaterialCommunityIcons name="bell-outline" size={22} color="#FFF6E3" />
                {unreadCount > 0 && <View style={s.redBadge} />}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ProfileSettings')}
                style={s.avatarRing}
              >
                <Image
                  source={vendor?.photo ? { uri: vendor.photo } : AVATAR_FALLBACK}
                  style={s.avatarImg}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Overlapping Summary Metric Cards matching Screen 3 */}
        <View style={s.metricsWrap}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('BookingsList')}
            style={s.metricCard}
          >
            <View style={s.metricIconBox}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#67101F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.metricLabel}>Total Bookings</Text>
              <Text style={s.metricValue}>{totalBookingsCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('WalletEarnings')}
            style={s.metricCard}
          >
            <View style={[s.metricIconBox, { backgroundColor: '#FDF3DC' }]}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color="#D48B28" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.metricLabel}>Earnings</Text>
              <Text style={s.metricValue}>₹ {displayEarnings}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={s.bodyPad}>
          {/* ACTIVE PUJA RESUME BANNER */}
          {activeBooking &&
            activeBooking.status !== 'COMPLETED' &&
            activeBooking.status !== 'CANCELLED' && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={s.activeResumeCard}
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
                <View style={s.activeTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={s.activeDot} />
                    <Text style={s.activeStatusText}>
                      सक्रिय पूजा जारी • {activeBooking.status}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={20} color="#D48B28" />
                </View>
                <Text style={s.activeTitle}>
                  {activeBooking.pooja?.name || activeBooking.name || 'वैदिक पूजा'}
                </Text>
                <Text style={s.activeSub}>
                  यजमान: {activeBooking.yajmanName || 'यजमान'} • [चरण जारी रखें ›]
                </Text>
              </TouchableOpacity>
            )}

          {/* Quick Actions 4-Circle Row matching Screen 3 */}
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickCircleRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SelectServices', { manageMode: true })}
              style={s.quickCircleItem}
            >
              <View style={s.quickCircle}>
                <MaterialCommunityIcons name="hands-pray" size={24} color="#67101F" />
              </View>
              <Text style={s.quickCircleLabel}>My Services</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Calendar')}
              style={s.quickCircleItem}
            >
              <View style={s.quickCircle}>
                <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#67101F" />
              </View>
              <Text style={s.quickCircleLabel}>Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('WalletEarnings')}
              style={s.quickCircleItem}
            >
              <View style={s.quickCircle}>
                <MaterialCommunityIcons name="wallet-outline" size={24} color="#67101F" />
              </View>
              <Text style={s.quickCircleLabel}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('HelpSupport')}
              style={s.quickCircleItem}
            >
              <View style={s.quickCircle}>
                <MaterialCommunityIcons name="headphones" size={24} color="#67101F" />
              </View>
              <Text style={s.quickCircleLabel}>Support</Text>
            </TouchableOpacity>
          </View>

          {/* Compact Service Shortcuts for Pandit, Mandali & Astrology */}
          <View style={s.shortcutRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PoojaServices')}
              style={s.shortcutChip}
            >
              <MaterialCommunityIcons name="fire" size={16} color="#D48B28" />
              <Text style={s.shortcutChipText}>Pandit Services</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MandaliManagement')}
              style={s.shortcutChip}
            >
              <MaterialCommunityIcons name="account-group-outline" size={16} color="#D48B28" />
              <Text style={s.shortcutChipText}>Mandali</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (typeof partnerData.updateVendor === 'function') {
                  partnerData.updateVendor({ isAstroEnabled: true });
                }
                VendorAstroHelper.broadcastAstroOnline(
                  { ...vendor, isAstroEnabled: true },
                  partnerAstroStore.getPresence(),
                  partnerAstroStore.getRates()
                );
              }}
              style={s.shortcutChip}
            >
              <MaterialCommunityIcons name="creation" size={16} color="#D48B28" />
              <Text style={s.shortcutChipText}>Astro Mode</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Bookings matching Screen 3 */}
          <View style={s.recentHeader}>
            <Text style={s.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BookingsList')}>
              <Text style={s.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentBookings.length > 0 ? (
            <View style={{ gap: 12 }}>
              {recentBookings.map((item) => {
                const badge = getStatusStyle(item.status);
                const id = item.id || item._id || item.bookingId;
                const title = item.ritualName || item.title || item.poojaName || item.service || 'Satyanarayan Pooja';
                const time =
                  item.scheduledDate
                    ? `${item.scheduledDate}${item.scheduledTime ? ` • ${item.scheduledTime}` : ''}`
                    : item.timeSlot || item.time || 'Scheduled';
                const price = item.totalAmount ?? item.amount ?? item.total ?? item.price ?? 0;
                return (
                  <TouchableOpacity
                    key={id || title}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('BookingDetails', { bookingId: id, booking: item })}
                    style={s.bookingCard}
                  >
                    <Image source={PUJA_THUMB} style={s.bookingThumb} />
                    <View style={s.bookingInfo}>
                      <Text style={s.bookingTitle} numberOfLines={1}>{title}</Text>
                      <Text style={s.bookingTime} numberOfLines={1}>{time}</Text>
                      <Text style={s.bookingPrice}>₹ {Number(price).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={[s.statusPill, { backgroundColor: badge.bg }]}>
                      <Text style={[s.statusPillText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate('PoojaServices')}
              style={s.emptyBookingsCard}
            >
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="calendar-clock" size={26} color="#D48B28" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.emptyTitle}>No Recent Bookings Yet</Text>
                <Text style={s.emptySub}>
                  Keep your status Online — incoming pooja & yajman requests appear here instantly.
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Real-time Rapido/Uber Pooja Request Modal */}
      <IncomingRequestModal
        visible={!!incomingJob}
        job={incomingJob}
        onAccept={handleAcceptJob}
        onDecline={handleDeclineJob}
      />

      {/* Real-time Astrologer Agora Incoming Call Modal */}
      <Modal
        visible={!!incomingCall}
        transparent
        animationType="slide"
        onRequestClose={handleDeclineCall}
      >
        <View style={s.callModalOverlay}>
          <View style={s.callModalCard}>
            <LinearGradient colors={['#2D0B3F', '#4A154B']} style={s.callModalGrad}>
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
                <TouchableOpacity style={[s.callBtn, s.declineCallBtn]} onPress={handleDeclineCall}>
                  <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFFFFF" />
                  <Text style={s.callBtnText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.callBtn, s.acceptCallBtn]} onPress={handleAcceptCall}>
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

      <PanditAstroToggleCard />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF6EE' },
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  content: { paddingBottom: 24 },
  curvedHeader: {
    paddingTop: Platform.OS === 'android' ? 42 : 52,
    paddingHorizontal: 20,
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSmall: {
    fontSize: 13.5,
    color: '#F5DFC4',
    fontWeight: '500',
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: serif,
    marginTop: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 7,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F87171',
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#F7C966',
    overflow: 'hidden',
    backgroundColor: '#FFF6E3',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  metricsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 12,
    marginTop: -32,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE2D1',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FBECEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  metricLabel: {
    fontSize: 11.5,
    color: '#7D686B',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1418',
    marginTop: 2,
  },
  bodyPad: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  activeResumeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#D48B28',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1E8E4A',
    marginRight: 7,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E8E4A',
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    marginTop: 6,
  },
  activeSub: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    marginBottom: 12,
  },
  quickCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickCircleItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF5E4',
    borderWidth: 1.2,
    borderColor: '#EBD3B0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickCircleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A1F23',
    textAlign: 'center',
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  shortcutChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#EFE2D1',
    gap: 5,
  },
  shortcutChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4A2B2F',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#67101F',
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE2D1',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  bookingThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#FAF2E6',
  },
  bookingInfo: {
    flex: 1,
    marginRight: 8,
  },
  bookingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
  },
  bookingTime: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 2,
  },
  bookingPrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#67101F',
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBookingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE2D1',
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF5E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
  },
  emptySub: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 3,
    lineHeight: 17,
  },
  callModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 5, 25, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  callModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  callModalGrad: {
    padding: 24,
    alignItems: 'center',
  },
  callPulseDisc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  callIncomingBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  callNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  callRateText: {
    fontSize: 13.5,
    color: '#D8BFD8',
    marginBottom: 24,
  },
  callActionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  declineCallBtn: { backgroundColor: '#D32F2F' },
  acceptCallBtn: { backgroundColor: '#2E7D32' },
  callBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
