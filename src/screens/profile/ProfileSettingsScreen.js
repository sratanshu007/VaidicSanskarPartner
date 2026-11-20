import React from 'react';
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
import { serif } from '../../theme/styles';

const AVATAR_FALLBACK = require('../../../assets/profile_krishna_avatar.png');

export default function ProfileSettingsScreen({ navigation }) {
  const { vendor, role } = usePartner();
  const isAstro = role === 'astro' || vendor?.role === 'astro' || Boolean(vendor?.isAstroEnabled);

  const handleLogout = () => {
    navigation.navigate('Logout');
  };

  const menuItems = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: 'account-outline',
      onPress: () => navigation.navigate('ProfileSetup'),
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
      id: 'password',
      title: 'Change Password',
      icon: 'lock-outline',
      onPress: () => Alert.alert('Security', 'A password reset link will be sent to your registered email.'),
    },
    {
      id: 'languages',
      title: 'Languages',
      icon: 'translate',
      onPress: () => navigation.navigate('PoojaServices'),
    },
    {
      id: 'services',
      title: isAstro ? 'Astrology Dashboard & Rates' : 'My Services & Mandali',
      icon: isAstro ? 'creation' : 'hands-pray',
      onPress: () => navigation.navigate(isAstro ? 'AstroDashboard' : 'SelectServices', { manageMode: true }),
    },
    {
      id: 'support',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  const displayId = vendor?.partnerId || vendor?.id || vendor?._id || vendor?.phone || 'Partner';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <View style={s.container}>
        {/* Header matching Screen 14 */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate(isAstro ? 'AstroHome' : 'Home'))}
            style={s.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Pandit Avatar & Identity matching Screen 14 */}
          <View style={s.profileHero}>
            <View style={s.avatarOuter}>
              <Image
                source={vendor?.photo ? { uri: vendor.photo } : AVATAR_FALLBACK}
                style={s.avatarImg}
              />
            </View>
            <Text style={s.userName}>{vendor?.name || 'VaidicSanskar Partner'}</Text>
            <Text style={s.userId}>ID: {String(displayId).slice(0, 12)}</Text>
          </View>

          {/* Menu Rows Card Stack */}
          <View style={s.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.82}
                onPress={item.onPress}
                style={s.menuItem}
              >
                <View style={s.menuIconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={20} color="#67101F" />
                </View>
                <Text style={s.menuTitle}>{item.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#A08E90" />
              </TouchableOpacity>
            ))}

            {/* Red Logout Row matching Screen 14 */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleLogout}
              style={s.menuItem}
            >
              <View style={[s.menuIconWrap, { backgroundColor: '#FDECEC' }]}>
                <MaterialCommunityIcons name="logout" size={20} color="#D13939" />
              </View>
              <Text style={[s.menuTitle, { color: '#D13939' }]}>Logout</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#D13939" />
            </TouchableOpacity>
          </View>
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
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#2E1418', fontFamily: serif },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  profileHero: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  avatarOuter: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2.5,
    borderColor: '#D48B28',
    overflow: 'hidden',
    backgroundColor: '#FFF6E3',
    marginBottom: 12,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: serif,
    textAlign: 'center',
  },
  userId: {
    fontSize: 12.5,
    color: '#7D686B',
    fontWeight: '600',
    marginTop: 3,
  },
  menuList: { gap: 11 },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE2D1',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDF3E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
  },
});
