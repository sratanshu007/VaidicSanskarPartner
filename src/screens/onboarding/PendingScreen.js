import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton, Button } from '../../components/ui';
import colors from '../../theme/colors';
import { serif, shadow, radius } from '../../theme/styles';
import { VendorService } from '../../services/api';
import socket from '../../services/socket';
import { usePartner } from '../../context/PartnerContext';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';

export default function PendingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { vendor, register } = usePartner();
  const { isHindi } = useLanguage();

  const identifier = route.params?.email || route.params?.phone || vendor?.email || vendor?.phone || '';
  const phone = route.params?.phone || vendor?.phone || '';
  const email = route.params?.email || vendor?.email || '';
  const name = route.params?.name || vendor?.name || 'Partner';
  const role = route.params?.role || vendor?.role || 'pandit';

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusInfo, setStatusInfo] = useState({
    kyc: vendor?.kyc || 'Pending',
    status: vendor?.status || 'Review',
    rejectionReason: null,
  });

  const checkStatus = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await VendorService.checkStatus(identifier);
      if (res?.success) {
        setStatusInfo({
          kyc: res.kyc,
          status: res.status,
          rejectionReason: res.rejectionReason,
        });

        if (res.kyc === 'Verified' || res.status === 'Active') {
          register({
            ...vendor,
            ...res.vendor,
            kyc: 'Verified',
            status: 'Active',
            verified: true,
          });
          Alert.alert(
            isHindi ? 'सत्यापन स्वीकृत! 🙏' : 'Verification Approved! 🙏',
            isHindi
              ? 'बधाई हो! आपकी प्रोफ़ाइल एडमिन द्वारा स्वीकृत कर दी गई है। अब आप सेवाएं प्राप्त करने हेतु तैयार हैं।'
              : 'Congratulations! Your profile has been approved by admin. You can now accept booking requests.',
            [
              {
                text: isHindi ? 'डैशबोर्ड में प्रवेश करें ›' : 'Enter Dashboard ›',
                onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }),
              },
            ]
          );
        } else if (res.kyc === 'Rejected') {
          Alert.alert(
            isHindi ? 'आवेदन अस्वीकृत' : 'Application Rejected',
            res.rejectionReason || (isHindi ? 'कृपया अपने दस्तावेज़ पुनः जांचें अथवा हेल्पलाइन से संपर्क करें।' : 'Please check your documents or contact support.')
          );
        } else if (!isSilent) {
          Alert.alert(
            isHindi ? 'समीक्षा जारी है' : 'Under Review',
            isHindi
              ? 'आपकी प्रोफ़ाइल अभी एडमिन सत्यापन कतार में है। जैसे ही अनुमोदन होगा, आपका डैशबोर्ड सक्रिय हो जाएगा।'
              : 'Your profile is currently in the admin verification queue. Your dashboard will activate upon approval.'
          );
        }
      }
    } catch (e) {
      if (!isSilent) {
        Alert.alert(
          isHindi ? 'सत्यापन स्थिति' : 'Verification Status',
          isHindi ? 'सर्वर से संपर्क हो रहा है।' : 'Connecting to server.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [identifier, vendor, register, navigation, isHindi]);

  useEffect(() => {
    checkStatus(true);

    socket.connect();
    const handleLiveApproval = (updated) => {
      if (!updated) return;
      const matchId = updated.id && (updated.id === vendor?.id);
      const matchEmail = updated.email && (updated.email.toLowerCase().trim() === email?.toLowerCase().trim() || updated.email.toLowerCase().trim() === identifier?.toLowerCase().trim());
      const matchPhone = updated.phone && (updated.phone.trim() === phone?.trim() || updated.phone.trim() === identifier?.trim());

      if (matchId || matchEmail || matchPhone) {
        setStatusInfo({
          kyc: updated.kyc,
          status: updated.status,
          rejectionReason: updated.rejectionReason,
        });

        if (updated.kyc === 'Verified' || updated.status === 'Active') {
          register({
            ...vendor,
            ...updated,
            kyc: 'Verified',
            status: 'Active',
            verified: true,
          });
          Alert.alert(
            isHindi ? 'सत्यापन स्वीकृत! 🙏' : 'Verification Approved! 🙏',
            isHindi
              ? 'बधाई हो! आपकी प्रोफ़ाइल एडमिन द्वारा स्वीकृत कर दी गई है। अब आप सेवाएं प्राप्त करने हेतु तैयार हैं।'
              : 'Congratulations! Your profile has been approved by admin. You can now accept booking requests.',
            [
              {
                text: isHindi ? 'डैशबोर्ड में प्रवेश करें ›' : 'Enter Dashboard ›',
                onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }),
              },
            ]
          );
        }
      }
    };

    const unsub1 = socket.on('vendor:update', handleLiveApproval);
    const unsub2 = socket.on('vendor:status', handleLiveApproval);
    const unsub3 = socket.on('kyc:approved', handleLiveApproval);

    return () => {
      unsub1 && unsub1();
      unsub2 && unsub2();
      unsub3 && unsub3();
    };
  }, [checkStatus, vendor, email, phone, identifier, register, navigation, isHindi]);

  const onRefresh = () => {
    setRefreshing(true);
    checkStatus(false);
  };

  const isApproved = statusInfo.kyc === 'Verified' || statusInfo.status === 'Active';
  const isRejected = statusInfo.kyc === 'Rejected';

  return (
    <View style={[s.c, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <View style={s.topBar}>
        <View style={{ width: 40 }} />
        <LanguageSwitcher />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={s.circle}>
          <MaterialCommunityIcons
            name={isApproved ? 'check-decagram' : isRejected ? 'alert-circle' : 'clock-check'}
            size={56}
            color={isApproved ? colors.success : isRejected ? '#DC2626' : colors.primary}
          />
        </View>

        <Text style={s.t}>
          {isApproved
            ? (isHindi ? 'प्रोफ़ाइल स्वीकृत ✓' : 'Profile Verified ✓')
            : isRejected
            ? (isHindi ? 'सत्यापन अस्वीकृत' : 'Verification Rejected')
            : (isHindi ? 'केवाईसी समीक्षाधीन 🙏' : 'KYC Under Review 🙏')}
        </Text>

        <Text style={s.p}>
          {isApproved
            ? (isHindi ? 'आपकी प्रोफ़ाइल एडमिन द्वारा सत्यापित हो चुकी है।' : 'Your partner profile has been verified by the administrator.')
            : isRejected
            ? statusInfo.rejectionReason || (isHindi ? 'दस्तावेज़ों में विसंगति पाई गई है।' : 'Issues found in uploaded documents.')
            : (isHindi ? 'आपकी समस्त जानकारी व योग्यताएं एडमिन अनुमोदन हेतु प्रेषित हैं।' : 'Your details and credentials have been submitted for administrator review.')}
        </Text>

        {/* Live Partner Profile Summary Card */}
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{isHindi ? 'पंजीकृत नाम:' : 'Registered Name:'}</Text>
            <Text style={s.summaryValue}>{name}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{isHindi ? 'श्रेणी (Role):' : 'Service Role:'}</Text>
            <Text style={[s.summaryValue, { textTransform: 'capitalize' }]}>{role}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{isHindi ? 'ईमेल / फ़ोन:' : 'Email / Mobile:'}</Text>
            <Text style={s.summaryValue}>{email || phone}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{isHindi ? 'केवाईसी दस्तावेज़:' : 'KYC Document:'}</Text>
            <Text style={[s.summaryValue, { color: '#1E8E4A', fontWeight: '700' }]}>
              {vendor?.aadhaarNumber
                ? `Aadhaar (••• ${vendor.aadhaarNumber.slice(-4)}) ✓`
                : vendor?.panNumber
                ? `PAN (${vendor.panNumber.slice(0, 2)}•••${vendor.panNumber.slice(-2)}) ✓`
                : (isHindi ? 'आईडी दस्तावेज़ संलग्न ✓' : 'ID Attached ✓')}
            </Text>
          </View>
          <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={s.summaryLabel}>{isHindi ? 'वर्तमान स्थिति:' : 'Current Status:'}</Text>
            <View style={[s.statusBadge, isApproved ? s.statusApproved : isRejected ? s.statusRejected : s.statusPending]}>
              <Text style={[s.statusBadgeText, isApproved ? s.statusApprovedText : isRejected ? s.statusRejectedText : s.statusPendingText]}>
                {isApproved ? '✓ VERIFIED' : isRejected ? '✗ REJECTED' : '⏳ ADMIN REVIEW'}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.badge}>
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.maroon} />
          <Text style={s.badgeT}>Admin Approval Live Linked</Text>
        </View>

        {/* Action Buttons */}
        <View style={{ width: '100%', marginTop: 28, gap: 12 }}>
          {isApproved ? (
            <GoldButton
              title={isHindi ? 'डैशबोर्ड में प्रवेश करें ›' : 'Enter Dashboard ›'}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
            />
          ) : (
            <GoldButton
              title={loading ? (isHindi ? 'जांच जारी है...' : 'Checking...') : (isHindi ? 'अनुमोदन स्थिति जांचें ⟳' : 'Check Approval Status ⟳')}
              onPress={() => checkStatus(false)}
              disabled={loading}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  circle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
    ...shadow.sm,
  },
  t: { ...serif, fontSize: 22, color: colors.maroon, textAlign: 'center', marginBottom: 10, fontWeight: '700' },
  p: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EADF',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#8A6850',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#3A1208',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusApprovedText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusRejectedText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sand,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
  },
  badgeT: { fontSize: 12, color: colors.maroon, fontWeight: '700' },
});
