import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner } from '../../context/PartnerContext';
import colors from '../../theme/colors';

export default function BookingDetailsScreen({ navigation, route }) {
  const { bookings } = usePartner();
  const bookingId = route?.params?.bookingId;

  const booking = bookings.find((b) => b.id === bookingId || b._id === bookingId) || (bookingId ? null : bookings[0]);

  if (!booking) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Booking Details</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={56} color="#C4B5A8" />
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '700', color: '#6B5A5C' }}>
              No Booking Selected
            </Text>
            <Text style={{ marginTop: 8, fontSize: 13.5, color: '#9E8B8E', textAlign: 'center' }}>
              Select a booking from your schedule to view comprehensive details.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const title = booking.title || booking.poojaName || booking.service || 'Vaidic Ritual';
  const time = booking.timeSlot || booking.time || booking.scheduledDate || (booking.date ? `${booking.date} ${booking.slot || ''}` : 'Scheduled');
  const status = booking.status || 'Confirmed';
  const customerName = booking.customer?.name || booking.userName || booking.yajmanName || 'Devotee';
  const customerPhone = booking.customer?.phone || booking.phone || 'Available upon assignment';
  const address = booking.customer?.address || booking.address || booking.location || 'Location details via GPS';
  const mandaliName = booking.mandali || booking.mandaliName || 'Direct Booking';
  const totalAmount = booking.amount || booking.total || booking.price || 0;

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
          <Text style={s.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Booking Header Card */}
          <View style={s.mainCard}>
            <View style={s.thumbnailCircle}>
              <MaterialCommunityIcons name="fire" size={28} color="#D48B28" />
            </View>

            <View style={s.mainCardInfo}>
              <Text style={s.poojaTitle}>{title}</Text>
              <Text style={s.poojaTimeSlot}>{time}</Text>
              <View style={s.confirmedBadge}>
                <Text style={s.confirmedBadgeText}>{status}</Text>
              </View>
            </View>
          </View>

          {/* Customer Details Card */}
          <View style={s.detailsCard}>
            <Text style={s.sectionHeader}>Customer Details</Text>

            {/* Name & Phone */}
            <View style={s.detailRow}>
              <View style={s.iconWrap}>
                <MaterialCommunityIcons name="account" size={22} color="#67101F" />
              </View>
              <View style={s.detailTextCol}>
                <Text style={s.customerName}>{customerName}</Text>
                <Text style={s.customerPhone}>{customerPhone}</Text>
              </View>
            </View>

            {/* Address */}
            <View style={s.detailRow}>
              <View style={s.iconWrap}>
                <MaterialCommunityIcons name="map-marker" size={22} color="#67101F" />
              </View>
              <View style={s.detailTextCol}>
                <Text style={s.detailLabel}>Address</Text>
                <Text style={s.addressText}>{address}</Text>
              </View>
            </View>

            {/* Mandali */}
            <View style={s.detailRow}>
              <View style={s.iconWrap}>
                <MaterialCommunityIcons name="account-group" size={22} color="#67101F" />
              </View>
              <View style={s.detailTextCol}>
                <Text style={s.detailLabel}>Mandali</Text>
                <Text style={s.mandaliText}>{mandaliName}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar: Total Amount & View Location Button */}
        <View style={s.bottomBar}>
          <View style={s.amountWrap}>
            <Text style={s.amountLabel}>Total Amount</Text>
            <Text style={s.amountValue}>₹ {Number(totalAmount).toLocaleString('en-IN')}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('LiveLocationTracking', { bookingId: booking.id || booking._id, booking })}
            style={s.viewLocationBtn}
          >
            <Text style={s.viewLocationBtnText}>फुल स्क्रीन लोकेशन (View Live Location)</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: 'serif',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  thumbnailCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDF5EA',
    borderWidth: 1,
    borderColor: '#F6E4CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mainCardInfo: {
    flex: 1,
  },
  poojaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 4,
  },
  poojaTimeSlot: {
    fontSize: 13,
    color: '#7D686B',
    marginBottom: 8,
  },
  confirmedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF8F0',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  confirmedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E8E4A',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 18,
    fontFamily: 'serif',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  iconWrap: {
    width: 36,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  detailTextCol: {
    flex: 1,
  },
  customerName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: '#7D686B',
  },
  detailLabel: {
    fontSize: 12,
    color: '#7D686B',
    fontWeight: '600',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13.5,
    color: '#2E1418',
    lineHeight: 19,
  },
  mandaliText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E1418',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE4DA',
  },
  amountWrap: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#7D686B',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2E1418',
  },
  viewLocationBtn: {
    backgroundColor: '#67101F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  viewLocationBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
