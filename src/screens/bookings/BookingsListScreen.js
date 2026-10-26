import React, { useState } from 'react';
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

const TABS = ['Upcoming', 'Completed', 'Cancelled'];

export default function BookingsListScreen({ navigation }) {
  const { bookings } = usePartner();
  const [selectedTab, setSelectedTab] = useState('Upcoming');

  const filteredBookings = bookings.filter((b) => {
    if (b.filterStatus === selectedTab) return true;
    const st = String(b.status || '').toUpperCase();
    if (selectedTab === 'Upcoming') {
      return (
        !st ||
        st === 'CONFIRMED' ||
        st === 'ACCEPTED' ||
        st === 'IN_PROGRESS' ||
        st === 'ASSIGNED' ||
        st === 'REQUESTED' ||
        st === 'ON_THE_WAY' ||
        st === 'ARRIVED'
      );
    }
    if (selectedTab === 'Completed') {
      return st === 'COMPLETED';
    }
    if (selectedTab === 'Cancelled') {
      return st === 'CANCELLED' || st === 'DECLINED';
    }
    return true;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'shiva':
        return { name: 'om', color: '#D48B28' };
      case 'kundali':
        return { name: 'creation', color: '#D48B28' };
      default:
        return { name: 'fire', color: '#D48B28' };
    }
  };

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
          <Text style={s.headerTitle}>My Bookings</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Filter Tabs */}
        <View style={s.tabContainer}>
          {TABS.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setSelectedTab(tab)}
                style={[s.tabPill, isActive && s.tabPillActive]}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {filteredBookings.length > 0 ? (
            <View style={s.list}>
              {filteredBookings.map((item) => {
                const iconInfo = getIconForType(item.imageType);
                const title = item.title || item.poojaName || item.service || 'Vaidic Pooja';
                const time = item.time || item.scheduledDate || (item.date ? `${item.date} ${item.slot || ''}` : 'Scheduled');
                const locRaw = item.location || item.address || item.customer?.address || 'Customer Location';
                const loc = String(locRaw).startsWith('Location:') ? locRaw : `Location: ${locRaw}`;
                const statusStr = item.status || 'Confirmed';

                return (
                  <TouchableOpacity
                    key={item.id || item._id}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id || item._id })}
                    style={s.bookingCard}
                  >
                    {/* Deity / Ritual Thumbnail */}
                    <View style={s.thumbnailCircle}>
                      <MaterialCommunityIcons
                        name={iconInfo.name}
                        size={24}
                        color={iconInfo.color}
                      />
                    </View>

                    {/* Booking Details */}
                    <View style={s.cardInfo}>
                      <Text style={s.cardTitle}>{title}</Text>
                      <Text style={s.cardTime}>{time}</Text>
                      <Text style={s.cardLocation}>{loc}</Text>

                      <View style={s.badgeWrap}>
                        <View style={s.confirmedBadge}>
                          <Text style={s.confirmedBadgeText}>{statusStr}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Chevron */}
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#A08E90" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={s.emptyWrap}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#C4B5A8" />
              <Text style={s.emptyTitle}>No {selectedTab.toLowerCase()} bookings</Text>
            </View>
          )}
        </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 18,
    gap: 10,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F2EAE1',
    borderWidth: 1,
    borderColor: '#E8DCD0',
  },
  tabPillActive: {
    backgroundColor: '#67101F',
    borderColor: '#67101F',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C4447',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  list: {
    gap: 14,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDF5EA',
    borderWidth: 1,
    borderColor: '#F6E4CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 3,
  },
  cardTime: {
    fontSize: 12.5,
    color: '#7D686B',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 12,
    color: '#7D686B',
    marginBottom: 6,
  },
  badgeWrap: {
    flexDirection: 'row',
  },
  confirmedBadge: {
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
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#7D686B',
    marginTop: 10,
  },
});
