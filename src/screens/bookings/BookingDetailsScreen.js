import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import { JobService } from '../../services/api';
import socket from '../../services/socket';

export default function BookingDetailsScreen({ navigation, route }) {
  const { bookings, setBookings, refreshBookings, addEarning, vendor } = usePartner();

  const bookingId = route?.params?.bookingId;
  const passedBooking = route?.params?.booking;

  const booking = useMemo(() => {
    const found = (bookings || []).find(
      (b) => (b.id || b._id || b.bookingId) === bookingId
    );
    return (
      found ||
      passedBooking || {
        id: bookingId || 'VS-1042',
        poojaName: 'Satyanarayan Puja',
        date: '12 Oct 2025',
        time: '10:00 AM',
        amount: 2500,
        status: 'confirmed',
        customerName: 'Rahul Sharma',
        customerPhone: '+91 98765 43210',
        address: '101, Sunrise Apartment, Sector 12, New Delhi - 110001',
      }
    );
  }, [bookings, bookingId, passedBooking]);

  const statusRaw = String(booking.status || 'confirmed').toLowerCase();
  const isCompleted = statusRaw === 'completed' || statusRaw === 'done';
  const isPending =
    statusRaw === 'pending' ||
    statusRaw === 'pending_acceptance' ||
    statusRaw === 'new' ||
    statusRaw === 'requested';
  const isInProgress =
    statusRaw === 'pooja_started' || statusRaw === 'in_progress' || statusRaw === 'started';

  const statusLabel = isCompleted
    ? 'Completed'
    : isPending
    ? 'Pending'
    : isInProgress
    ? 'In Progress'
    : statusRaw === 'arrived'
    ? 'Arrived'
    : 'Confirmed';

  const customerName =
    booking.yajmanName ||
    booking.customerName ||
    booking.user?.name ||
    booking.clientName ||
    'Devotee';
  const customerPhone =
    booking.customerPhone ||
    booking.phone ||
    booking.user?.phone ||
    '';
  const customerAddress =
    booking.serviceAddress ||
    booking.address ||
    booking.location ||
    'Address provided upon booking';
  const pujaTitle =
    booking.ritualName ||
    booking.poojaName ||
    booking.serviceName ||
    booking.title ||
    'Satyanarayan Pooja';
  const displayDate = booking.scheduledDate || booking.date || 'Today';
  const displayTime = booking.scheduledTime || booking.time || booking.slot || '10:00 AM';
  const amount = Number(booking.totalAmount ?? booking.amount ?? booking.dakshina ?? booking.price ?? 2500);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCallCustomer = () => {
    const cleanPhone = String(customerPhone).replace(/\s+/g, '');
    if (!cleanPhone) {
      Alert.alert('Phone Unavailable', 'Customer phone number is not attached to this booking.');
      return;
    }
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Failed', `Unable to place call to ${customerPhone}`);
    });
  };

  const handleViewLocation = () => {
    const id = booking.id || booking._id || booking.bookingId;
    navigation.navigate('LiveLocationTracking', {
      bookingId: id,
      booking,
      address: customerAddress,
      customerName,
    });
  };

  const handleAcceptBooking = async () => {
    const id = booking.id || booking._id || booking.bookingId;
    setSubmitting(true);
    try {
      try {
        await JobService.accept(id);
      } catch (err) {
        console.log('Accept notice:', err?.message);
      }
      socket.emit('job:accept', {
        bookingId: id,
        job_id: id,
        vendorId: vendor?.id || vendor?._id || vendor?.email,
      });
      setBookings?.((prev) =>
        (prev || []).map((b) =>
          (b.id || b._id || b.bookingId) === id ? { ...b, status: 'confirmed' } : b
        )
      );
      Alert.alert('Booking Confirmed', `${pujaTitle} is now confirmed.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteWithOtp = async () => {
    const cleanOtp = otpInput.replace(/[^0-9]/g, '').trim();
    if (cleanOtp.length < 4) {
      Alert.alert('Enter OTP', 'Please ask the devotee for the 4-digit OTP shown on their app.');
      return;
    }
    const id = booking.id || booking._id || booking.bookingId;
    setSubmitting(true);
    try {
      let verifiedComplete = false;
      let verifiedStart = false;
      let rejectMsg = null;

      // 1. Try Start OTP first if pooja is not yet in progress and Start OTP matches
      if (!isInProgress) {
        try {
          const startRes = await JobService.verifyStartOtp(id, cleanOtp);
          if (startRes?.success) verifiedStart = true;
        } catch (err) {
          if (err?.status === 400 || err?.status === 429) {
            rejectMsg = err?.message;
          }
        }
      }

      // 2. If Start OTP verified, start the pooja cleanly without premature completion
      if (verifiedStart) {
        socket.emit('booking:pooja_started', { bookingId: id });
        socket.emit('instant:update', { id, bookingId: id, status: 'IN_PROGRESS' });
        setBookings?.((prev) =>
          (prev || []).map((b) =>
            (b.id || b._id || b.bookingId) === id ? { ...b, status: 'POOJA_STARTED' } : b
          )
        );
        refreshBookings?.();
        setOtpModalVisible(false);
        setOtpInput('');
        Alert.alert(
          'Start OTP Verified',
          'Pooja is now In Progress. Ask the devotee for their Completion OTP once the ritual finishes.'
        );
        return;
      }

      // 3. Verify Completion OTP via backend
      try {
        const res = await JobService.verifyCompleteOtp(id, cleanOtp);
        if (res?.success) verifiedComplete = true;
      } catch (err) {
        if (err?.status === 400 || err?.status === 429) {
          rejectMsg = err?.message;
        }
        try {
          const legacyRes = await JobService.complete(id, cleanOtp);
          if (legacyRes?.success) verifiedComplete = true;
        } catch (legacyErr) {
          if (legacyErr?.status === 400 || legacyErr?.status === 429) {
            rejectMsg = rejectMsg || legacyErr?.message;
          }
        }
      }

      // 4. Offline/synced booking OTP fallback ONLY when local completeOtp matches exactly
      if (!verifiedComplete && booking?.completeOtp && String(booking.completeOtp).trim() === cleanOtp) {
        verifiedComplete = true;
      }

      if (!verifiedComplete) {
        Alert.alert(
          'Invalid OTP',
          rejectMsg || 'The entered OTP did not match. Please verify the 4-digit code on the devotee app.'
        );
        return;
      }

      socket.emit('job:complete', {
        bookingId: id,
        job_id: id,
        otp: cleanOtp,
      });
      socket.emit('booking:completed', { bookingId: id });
      setBookings?.((prev) =>
        (prev || []).map((b) =>
          (b.id || b._id || b.bookingId) === id ? { ...b, status: 'COMPLETED' } : b
        )
      );
      addEarning?.(amount, pujaTitle);
      refreshBookings?.();
      setOtpModalVisible(false);
      setOtpInput('');
      Alert.alert('Pooja Completed', `₹ ${amount.toLocaleString('en-IN')} added to your earnings.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4A0813" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View
          style={[
            styles.topBadge,
            isCompleted
              ? styles.badgeDone
              : isPending
              ? styles.badgePending
              : styles.badgeConfirmed,
          ]}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'checkmark-circle'}
            size={14}
            color={isPending ? '#B5630A' : '#1E8E4A'}
          />
          <Text
            style={[
              styles.topBadgeText,
              { color: isPending ? '#B5630A' : '#1E8E4A' },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Puja Summary Header Card */}
        <View style={styles.pujaHero}>
          <Image
            source={require('../../../assets/banner_havan_kund.png')}
            style={styles.pujaThumb}
            resizeMode="cover"
          />
          <View style={styles.pujaInfo}>
            <Text style={styles.pujaTitle}>{pujaTitle}</Text>
            <Text style={styles.pujaDateTime}>
              {displayDate} • {displayTime}
            </Text>
            <Text style={styles.pujaFee}>
              Dakshina: ₹ {amount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Customer Details Card */}
        <View style={[styles.detailCard, shadow]}>
          <View style={styles.cardHeadingRow}>
            <Ionicons name="sparkles-outline" size={18} color="#8D4917" />
            <Text style={styles.cardHeading}>Customer Details</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={16} color="#5D4037" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoPrimary}>{customerName}</Text>
              <Text style={styles.infoSecondary}>
                {customerPhone || 'Masked call available below'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={16} color="#5D4037" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoAddress}>{customerAddress}</Text>
            </View>
          </View>
        </View>

        {/* Ritual Notes / Samagri Card */}
        <View style={[styles.detailCard, shadow]}>
          <View style={styles.cardHeadingRow}>
            <Ionicons name="document-text-outline" size={18} color="#8D4917" />
            <Text style={styles.cardHeading}>Ritual Summary</Text>
          </View>
          <View style={styles.metaSplitRow}>
            <Text style={styles.metaKey}>Booking ID</Text>
            <Text style={styles.metaVal}>#{String(booking.id || 'VS1042').slice(-8)}</Text>
          </View>
          <View style={styles.metaSplitRow}>
            <Text style={styles.metaKey}>Duration</Text>
            <Text style={styles.metaVal}>{booking.duration || 'Approx. 2 Hours'}</Text>
          </View>
          <View style={styles.metaSplitRow}>
            <Text style={styles.metaKey}>Samagri Included</Text>
            <Text style={styles.metaVal}>{booking.samagriIncluded ? 'Yes' : 'With Standard Samagri'}</Text>
          </View>
        </View>

        {!isCompleted && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.completeActionBtn}
            onPress={() =>
              isPending ? handleAcceptBooking() : setOtpModalVisible(true)
            }
          >
            <Ionicons
              name={isPending ? 'checkmark-done-circle' : 'shield-checkmark-outline'}
              size={18}
              color="#67101F"
            />
            <Text style={styles.completeActionText}>
              {isPending
                ? 'Accept & Confirm Booking'
                : isInProgress
                ? 'Verify Completion OTP & Finish'
                : 'Verify Start / Completion OTP'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Side-by-Side Buttons (Mockup Screen 9) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.callBtn}
          onPress={handleCallCustomer}
        >
          <Text style={styles.callBtnText}>Call Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.locationBtnWrap}
          onPress={handleViewLocation}
        >
          <LinearGradient
            colors={['#7E1627', '#530A17']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.locationBtn}
          >
            <Text style={styles.locationBtnText}>View Location</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* OTP Verification Modal */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isInProgress ? 'Enter Completion OTP' : 'Enter Start / Completion OTP'}
            </Text>
            <Text style={styles.modalSub}>
              Enter the 4-digit verification code shown on {customerName}'s app.
            </Text>
            <TextInput
              style={styles.otpInput}
              value={otpInput}
              onChangeText={(val) => setOtpInput(val.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 1234"
              placeholderTextColor="#B0A098"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setOtpModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                disabled={submitting}
                onPress={handleCompleteWithOtp}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D6',
    backgroundColor: '#FBF6EE',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: serif,
    fontSize: 19,
    fontWeight: '700',
    color: '#4A0813',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeConfirmed: {
    backgroundColor: '#DCF3E4',
  },
  badgeDone: {
    backgroundColor: '#E5F5EB',
  },
  badgePending: {
    backgroundColor: '#FFF1D9',
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  pujaHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 16,
  },
  pujaThumb: {
    width: 78,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#EFE4D6',
  },
  pujaInfo: {
    flex: 1,
  },
  pujaTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '700',
    color: '#2F1510',
  },
  pujaDateTime: {
    fontSize: 13.5,
    color: '#7A6859',
    marginTop: 4,
  },
  pujaFee: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#B55B19',
    marginTop: 5,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 14,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EAE0',
  },
  cardHeading: {
    fontFamily: serif,
    fontSize: 16,
    fontWeight: '700',
    color: '#4A0813',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoTextCol: {
    flex: 1,
  },
  infoPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F1510',
  },
  infoSecondary: {
    fontSize: 13.5,
    color: '#6E5A4B',
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A1E19',
    marginBottom: 2,
  },
  infoAddress: {
    fontSize: 13.5,
    color: '#5C4B3E',
    lineHeight: 19,
  },
  metaSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  metaKey: {
    fontSize: 13,
    color: '#7A6859',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F1510',
  },
  completeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F6EAE3',
    borderWidth: 1,
    borderColor: '#E3CFC4',
    marginTop: 4,
  },
  completeActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#67101F',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE4D6',
    backgroundColor: '#FBF6EE',
  },
  callBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#D7C4B2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#4A0813',
  },
  locationBtnWrap: {
    flex: 1,
  },
  locationBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,10,8,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FBF6EE',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '700',
    color: '#4A0813',
  },
  modalSub: {
    fontSize: 13,
    color: '#6E5A4B',
    marginTop: 6,
    marginBottom: 14,
  },
  otpInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DECFC0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 6,
    color: '#4A0813',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D7C4B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    color: '#5D4037',
  },
  modalConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#67101F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
