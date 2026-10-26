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
import colors from '../../theme/colors';

const CATEGORIES = ['All', 'Jobs & Puja', 'SMS & OTP', 'Updates'];

export default function NotificationsScreen({ navigation }) {
  const { notifications: mockNotifications } = usePartner() || { notifications: [] };
  const { notificationHistory, clearAllNotifications } = useNotification();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Merge live notifications with any partner mock updates
  const combined = [
    ...(notificationHistory || []).map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.message,
      otp: n.otp,
      time: n.createdAt || 'Just now',
      date: n.date || '',
      type: n.type === 'job' || n.type === 'booking' ? 'Jobs & Puja' : (n.otp || n.type === 'sms' ? 'SMS & OTP' : 'Updates'),
      icon: n.type === 'job' || n.type === 'booking' ? 'fire' : (n.otp ? 'shield-key' : 'bell-ring'),
      color: n.type === 'job' || n.type === 'booking' ? '#D48B28' : (n.otp ? '#1E8E4A' : '#67101F'),
      actionText: n.actionText,
      onAction: n.onAction,
    })),
    ...(mockNotifications || []).map((m) => ({
      ...m,
      type: m.type === 'Bookings' ? 'Jobs & Puja' : (m.type === 'Messages' ? 'SMS & OTP' : 'Updates'),
    })),
  ];

  const filtered = combined.filter(
    (n) => selectedCategory === 'All' || n.type === selectedCategory
  );

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
          <Text style={s.headerTitle}>Notification Center</Text>
          {combined.length > 0 ? (
            <TouchableOpacity onPress={clearAllNotifications} style={s.clearBtn}>
              <Text style={s.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Filter Pills */}
        <View style={s.tabContainer}>
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
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="bell-badge-outline" size={40} color="#B79E88" />
              </View>
              <Text style={s.emptyTitle}>कोई सूचना नहीं है (No Notifications)</Text>
              <Text style={s.emptySub}>
                नए पूजा अनुरोध, OTP सत्यापन व भुगतान अपडेट यहाँ प्राप्त होंगे।
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
                  <View style={[s.iconCircle, { backgroundColor: item.color ? item.color + '15' : '#FAF0E4' }]}>
                    <MaterialCommunityIcons
                      name={item.icon || 'bell-outline'}
                      size={22}
                      color={item.color || '#67101F'}
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
    paddingHorizontal: 18,
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
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 2,
  },
  notificationSub: {
    fontSize: 12,
    color: '#7D686B',
  },
  timeText: {
    fontSize: 11.5,
    color: '#A08E90',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FAF0E4',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#67101F',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  otpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  otpBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#7D686B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
