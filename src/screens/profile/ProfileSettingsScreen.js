import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner } from '../../context/PartnerContext';
import colors from '../../theme/colors';

export default function ProfileSettingsScreen({ navigation }) {
  const { vendor, logout } = usePartner();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of VaidicSanskar Partner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Logout' }],
          });
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: 'account-outline',
      onPress: () => navigation.navigate('ProfileSetup'),
    },
    {
      id: 'kyc',
      title: 'KYC & Identity Verification',
      icon: 'shield-check-outline',
      onPress: () => navigation.navigate('ProfileSetup'),
    },
    {
      id: 'services',
      title: 'Services & Mandali',
      icon: 'account-group-outline',
      onPress: () => navigation.navigate('MandaliManagement'),
    },
    {
      id: 'bank',
      title: 'Bank Details',
      icon: 'bank-outline',
      onPress: () =>
        Alert.alert(
          'Bank Details',
          vendor?.bank?.account || vendor?.bank?.upi
            ? `Account: ${vendor.bank.account ? '•••• ' + String(vendor.bank.account).slice(-4) : 'N/A'}\nIFSC: ${vendor.bank.ifsc || 'N/A'}\nUPI ID: ${vendor.bank.upi || 'N/A'}`
            : 'No bank details configured yet. Please complete KYC / Profile to add bank info.'
        ),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell-outline',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: 'lock-reset',
      onPress: () => Alert.alert('Security', 'A password reset link will be sent to your registered email.'),
    },
    {
      id: 'support',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

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
          <Text style={s.headerTitle}>Profile & Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Header Card */}
          <View style={s.userCard}>
            <View style={s.avatarCircle}>
              {vendor?.photo ? (
                <Image source={{ uri: vendor.photo }} style={s.avatarImg} />
              ) : (
                <MaterialCommunityIcons name="account" size={34} color="#67101F" />
              )}
            </View>

            <View style={s.userInfo}>
              <Text style={s.userName}>{vendor?.name || 'Verified Partner'}</Text>
              <Text style={s.userEmail}>{vendor?.email || vendor?.phone || 'Account Active'}</Text>
              <View style={s.ratingRow}>
                <MaterialCommunityIcons name="star" size={14} color="#F5A623" />
                <Text style={s.ratingText}>
                  {vendor?.rating ? String(vendor.rating) : 'New'} ({vendor?.reviewsCount || 0} reviews)
                </Text>
              </View>
            </View>
          </View>

          {/* Settings Menu List */}
          <View style={s.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={item.onPress}
                style={s.menuItem}
              >
                <View style={s.menuIconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={22} color="#67101F" />
                </View>
                <Text style={s.menuTitle}>{item.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#A08E90" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Log Out Link */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleLogout}
            style={s.logoutRow}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#D13939" style={{ marginRight: 8 }} />
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  userCard: {
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
    marginBottom: 24,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FDF5EA',
    borderWidth: 1.5,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#7D686B',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#7D686B',
    fontWeight: '500',
  },
  menuList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE7',
  },
  menuIconWrap: {
    width: 32,
    alignItems: 'flex-start',
  },
  menuTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#2E1418',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D13939',
  },
});
