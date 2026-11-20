import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { serif } from '../../theme/styles';

export default function HelpSupportScreen({ navigation }) {
  const items = [
    {
      id: 'faqs',
      title: 'FAQs',
      subtitle: 'Find answers to common questions',
      icon: 'help-circle-outline',
      onPress: () =>
        Alert.alert(
          'Partner FAQs',
          '• How do I get booking requests?\nKeep your service status active.\n\n• When are payouts released?\nPayouts can be requested anytime to your verified UPI/bank account.'
        ),
    },
    {
      id: 'contact',
      title: 'Contact Support',
      subtitle: 'support@vaidicsanskar.com',
      icon: 'headphones',
      onPress: () => Linking.openURL('mailto:support@vaidicsanskar.com').catch(() => {}),
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      subtitle: 'Read our terms and conditions',
      icon: 'file-document-outline',
      onPress: () =>
        Alert.alert(
          'Terms & Conditions',
          'VaidicSanskar operates in devotion and sacred trust, empowering purohits, acharyas, and mandalis across India.'
        ),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield-lock-outline',
      onPress: () =>
        Alert.alert(
          'Privacy Policy',
          'Your personal profile, KYC documents, and bank details are encrypted and used strictly for partner verification and payouts.'
        ),
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <View style={s.container}>
        {/* Header matching Screen 13 */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Help & Support</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.cardList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={item.onPress}
                style={s.itemRow}
              >
                <View style={s.iconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={22} color="#67101F" />
                </View>

                <View style={s.itemInfo}>
                  <Text style={s.itemTitle}>{item.title}</Text>
                  <Text style={s.itemSub}>{item.subtitle}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={22} color="#A08E90" />
              </TouchableOpacity>
            ))}
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
    paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#2E1418', fontFamily: serif },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  cardList: { gap: 12 },
  itemRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF3E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: '#2E1418', marginBottom: 2 },
  itemSub: { fontSize: 12.5, color: '#7D686B' },
});
