import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import { JobService } from '../../services/api';
import socket from '../../services/socket';

const FILTER_TABS = [
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
];

const isPendingStatus = (st) => {
  const s = String(st || '').toLowerCase();
  return !s || s === 'pending' || s === 'pending_acceptance' || s === 'requested' || s === 'broadcast' || s === 'new';
};

const isConfirmedStatus = (st) => {
  const s = String(st || '').toLowerCase();
  return (
    s === 'confirmed' ||
    s === 'accepted' ||
    s === 'ongoing' ||
    s === 'in_progress' ||
    s === 'pooja_started' ||
    s === 'started' ||
    s === 'en_route' ||
    s === 'on_the_way' ||
    s === 'arrived' ||
    s === 'completion_requested'
  );
};

const isCompletedStatus = (st) => {
  const s = String(st || '').toLowerCase();
  return s === 'completed' || s === 'done' || s === 'finished';
};

const formatAmount = (val) => {
  const n = Number(val || 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-IN');
};

export default function BookingsListScreen({ navigation, route }) {
  const { bookings, setBookings, refreshBookings, vendor } = usePartner();

  const initialTab = route?.params?.initialTab || 'new';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const list = Array.isArray(bookings) ? bookings : [];

  const counts = useMemo(() => {
    let n = 0;
    let c = 0;
    let d = 0;
    list.forEach((b) => {
      if (isPendingStatus(b.status)) n += 1;
      else if (isConfirmedStatus(b.status)) c += 1;
      else if (isCompletedStatus(b.status)) d += 1;
    });
    return { new: n, confirmed: c, completed: d };
  }, [list]);

  const filteredBookings = useMemo(() => {
    return list.filter((b) => {
      if (activeTab === 'new') return isPendingStatus(b.status);
      if (activeTab === 'confirmed') return isConfirmedStatus(b.status);
      if (activeTab === 'completed') return isCompletedStatus(b.status);
      return true;
    });
  }, [list, activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBookings?.();
    } finally {
      setRefreshing(false);
    }
  }, [refreshBookings]);

  useFocusEffect(
    useCallback(() => {
      refreshBookings?.();
    }, [refreshBookings])
  );

  const handleAccept = async (item) => {
    const id = item.id || item._id || item.bookingId;
    if (!id) return;
    setBusyId(id);
    try {
      try {
        await JobService.accept(id);
      } catch (err) {
        console.log('Job accept API notice:', err?.message);
      }
      socket.emit('job:accept', {
        bookingId: id,
        job_id: id,
        vendorId: vendor?.id || vendor?._id || vendor?.email,
        vendorName: vendor?.name,
        vendorPhone: vendor?.phone,
      });
      setBookings?.((prev) =>
        (prev || []).map((b) =>
          (b.id || b._id || b.bookingId) === id ? { ...b, status: 'confirmed' } : b
        )
      );
      Alert.alert('Booking Accepted', `${item.poojaName || item.title || 'Puja'} is now confirmed.`);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item) => {
    const id = item.id || item._id || item.bookingId;
    if (!id) return;
    setBusyId(id);
    try {
      try {
        await JobService.decline(id);
      } catch (err) {
        console.log('Job decline API notice:', err?.message);
      }
      socket.emit('job:decline', {
        bookingId: id,
        job_id: id,
        vendorId: vendor?.id || vendor?._id || vendor?.email,
      });
      setBookings?.((prev) =>
        (prev || []).filter((b) => (b.id || b._id || b.bookingId) !== id)
      );
    } finally {
      setBusyId(null);
    }
  };

  const renderCard = ({ item }) => {
    const id = item.id || item._id || item.bookingId;
    const title = item.ritualName || item.poojaName || item.serviceName || item.title || 'Satyanarayan Pooja';
    const dateLabel = item.scheduledDate || item.date || item.bookingDate || 'Today';
    const timeLabel = item.scheduledTime || item.time || item.slot || '10:00 AM';
    const amount = item.totalAmount ?? item.amount ?? item.dakshina ?? item.price ?? 2500;
    const pending = isPendingStatus(item.status);
    const completed = isCompletedStatus(item.status);
    const stLower = String(item.status || '').toLowerCase();
    const activeLabel =
      stLower === 'arrived'
        ? 'Arrived'
        : stLower === 'pooja_started' || stLower === 'in_progress'
        ? 'In Progress'
        : stLower === 'en_route' || stLower === 'on_the_way'
        ? 'On The Way'
        : 'Confirmed';
    const busy = busyId === id;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, shadow]}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: id, booking: item })}
      >
        <View style={styles.cardTop}>
          <Image
            source={require('../../../assets/banner_havan_kund.png')}
            style={styles.thumb}
            resizeMode="cover"
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.cardDate}>
              {dateLabel} • {timeLabel}
            </Text>
            <Text style={styles.cardAmount}>₹ {formatAmount(amount)}</Text>
          </View>

          {!pending && (
            <View
              style={[
                styles.statusPill,
                isCompletedStatus(item.status) ? styles.completedPill : styles.confirmedPill,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  completed ? styles.completedText : styles.confirmedText,
                ]}
              >
                {completed ? 'Completed' : activeLabel}
              </Text>
            </View>
          )}
        </View>

        {pending && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={busy}
              style={styles.rejectBtn}
              onPress={() => handleReject(item)}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={busy}
              style={styles.acceptBtn}
              onPress={() => handleAccept(item)}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.acceptText}>Accept</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4A0813" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={styles.headerTitle}>Booking Requests</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Ionicons name="ellipsis-vertical" size={20} color="#4A0813" />
        </TouchableOpacity>
      </View>

      {/* Segmented Tabs: New (N) | Confirmed | Completed */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentBar}>
          {FILTER_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const label =
              tab.key === 'new' ? `${tab.label} (${counts.new})` : tab.label;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Requests List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item, idx) => String(item.id || item._id || idx)}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#67101F"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-clear-outline" size={44} color="#B8A392" />
            <Text style={styles.emptyTitle}>No {activeTab} requests</Text>
            <Text style={styles.emptySub}>
              Pull down to refresh or check back when new devotee requests arrive.
            </Text>
          </View>
        }
      />
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '700',
    color: '#4A0813',
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#F3E9DC',
    borderRadius: 24,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#67101F',
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5C4438',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#EFE4D6',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: 16.5,
    fontWeight: '700',
    color: '#2F1510',
  },
  cardDate: {
    fontSize: 13,
    color: '#7A6859',
    marginTop: 3,
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B55B19',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  confirmedPill: {
    backgroundColor: '#E7F6EC',
  },
  completedPill: {
    backgroundColor: '#F3EDE4',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  confirmedText: {
    color: '#1E8E4A',
  },
  completedText: {
    color: '#6A5446',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4ECE2',
  },
  rejectBtn: {
    minWidth: 88,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DECFC0',
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  rejectText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5D4037',
  },
  acceptBtn: {
    minWidth: 96,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#67101F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  acceptText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: serif,
    fontSize: 17.5,
    fontWeight: '700',
    color: '#4A0813',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#8B7666',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
});
