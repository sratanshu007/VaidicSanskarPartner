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
import colors from '../../theme/colors';

export default function HelpSupportScreen({ navigation }) {
  const items = [
    {
      id: 'faqs',
      title: 'FAQs',
      subtitle: 'Find answers to common questions',
      icon: 'frequently-asked-questions',
      onPress: () =>
        Alert.alert(
          'Partner FAQs',
          '• How do I get booking requests?\nKeep your profile active and service radius set.\n\n• When are payouts released?\nPayouts can be requested anytime to your verified UPI/bank account.'
        ),
    },
    {
      id: 'contact',
      title: 'Contact Support',
      subtitle: 'support@vaidicsanskar.com',
      icon: 'email-outline',
      onPress: () => Linking.openURL('mailto:support@vaidicsanskar.com').catch(() => {}),
    },
    {
      id: 'call',
      title: 'Call Us',
      subtitle: '+91 98765 43210',
      icon: 'phone-outline',
      onPress: () => Linking.openURL('tel:+919876543210').catch(() => {}),
    },
    {
      id: 'cancellation',
      title: 'Cancellation Policy',
      subtitle: 'Learn about cancellations',
      icon: 'shield-alert-outline',
      onPress: () =>
        Alert.alert(
          'Cancellation Policy',
          'Devotee cancellations before 2 hours receive a full refund. Partner cancellations should be avoided to preserve your service badge.'
        ),
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
                activeOpacity={0.8}
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
  cardList: {
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
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE7',
  },
  iconWrap: {
    width: 38,
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 3,
  },
  itemSub: {
    fontSize: 12.5,
    color: '#7D686B',
  },
});
