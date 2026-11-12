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
import { useNotification } from '../../context/NotificationContext';
import { serif } from '../../theme/styles';

const CATEGORIES = ['All', 'Jobs & Puja', 'SMS & OTP', 'Updates'];

export default function NotificationsScreen({ navigation }) {
  const { notifications: mockNotifications } = usePartner() || { notifications: [] };
  const { notificationHistory, clearAllNotifications } = useNotification();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const combined = [
    ...(notificationHistory || []).map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.message,
      otp: n.otp,
      time: n.createdAt || 'Just now',
      type: n.type === 'job' || n.type === 'booking' ? 'Jobs & Puja' : (n.otp || n.type === 'sms' ? 'SMS & OTP' : 'Updates'),
      icon: n.type === 'job' || n.type === 'booking' ? 'bell' : (n.otp ? 'shield-key' : 'bell'),
      color: n.otp ? '#1E8E4A' : '#E0821D',
      bg: n.otp ? '#EBF8F0' : '#FFF2DF',
      onAction: n.onAction,
    })),
    ...(mockNotifications || []).map((m) => ({
      ...m,
      type: m.type === 'Bookings' ? 'Jobs & Puja' : (m.type === 'Messages' ? 'SMS & OTP' : 'Updates'),
      icon: 'bell',
      color: '#E0821D',
      bg: '#FFF2DF',
    })),
  ];

  const filtered = combined.filter(
    (n) => selectedCategory === 'All' || n.type === selectedCategory
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <View style={s.container}>
        {/* Header matching Screen 12 */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          {combined.length > 0 ? (
            <TouchableOpacity onPress={clearAllNotifications} style={s.clearBtn}>
              <Text style={s.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View>

        {/* Compact Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabContainer}
          style={{ flexGrow: 0 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat)}
                style={[s.tabPill, isActive && s.tabPillActive]}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="bell-outline" size={38} color="#D48B28" />
              </View>
              <Text style={s.emptyTitle}>No Notifications Yet</Text>
              <Text style={s.emptySub}>
                New booking requests, payment alerts, and OTP updates will appear here.
              </Text>
            </View>
          ) : (
            <View style={s.list}>
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={item.onAction}
                  style={s.notificationCard}
                >
                  <View style={[s.iconCircle, { backgroundColor: item.bg || '#FFF2DF' }]}>
                    <MaterialCommunityIcons
                      name={item.icon || 'bell'}
                      size={22}
                      color={item.color || '#E0821D'}
                    />
                  </View>

                  <View style={s.notificationInfo}>
                    <View style={s.rowTop}>
                      <Text style={s.notificationTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={s.timeText}>{item.time}</Text>
                    </View>
                    <Text style={s.notificationSub}>{item.subtitle}</Text>
                    {item.otp ? (
                      <View style={s.otpBadge}>
                        <MaterialCommunityIcons name="shield-key" size={13} color="#15803D" />
                        <Text style={s.otpBadgeText}>OTP CODE: {item.otp}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF6EE' },
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: { width: 42, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#2E1418', fontFamily: serif },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F2E7D8',
  },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#67101F' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DAC8',
  },
  tabPillActive: {
    backgroundColor: '#67101F',
    borderColor: '#67101F',
  },
  tabText: { fontSize: 12.5, fontWeight: '600', color: '#5C4447' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  list: { gap: 12 },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EFE2D1',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notificationInfo: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: { fontSize: 14.5, fontWeight: '800', color: '#2E1418', flex: 1, marginRight: 8 },
  notificationSub: { fontSize: 12.5, color: '#6E5A5E', lineHeight: 18 },
  timeText: { fontSize: 11, color: '#9E888A', fontWeight: '600' },
  otpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  otpBadgeText: { fontSize: 11.5, fontWeight: '800', color: '#15803D' },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE2D1',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF2DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#2E1418', fontFamily: serif },
  emptySub: { fontSize: 13, color: '#7D686B', textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
