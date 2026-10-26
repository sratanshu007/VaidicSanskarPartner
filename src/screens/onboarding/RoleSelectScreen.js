import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';

const rolesData = [
  {
    key: 'pandit',
    title_en: 'Pandit',
    title_hi: 'वैदिक पंडित',
    desc_en: 'Perform Poojas &\nReligious Services',
    desc_hi: 'पूजा-अनुष्ठान व\nवैदिक सेवाएं',
    image: require('../../../assets/images/pandit_banner.jpg'),
    icon: 'account-tie-hat',
    colors: ['#F59E0B', '#D97706'],
  },
  {
    key: 'mandali',
    title_en: 'Mandali',
    title_hi: 'भजन मंडली',
    desc_en: 'Organize & Lead\nBhajans / Kirtan',
    desc_hi: 'संकीर्तन व जागरण\nआयोजन',
    image: require('../../../assets/images/mandali_banner.jpg'),
    icon: 'account-group',
    colors: ['#16A34A', '#15803D'],
  },
  {
    key: 'astro',
    title_en: 'Astrologer',
    title_hi: 'ज्योतिषाचार्य',
    desc_en: 'Provide Astrology &\nConsultations',
    desc_hi: 'कुंडली व ज्योतिषीय\nपरामर्श',
    image: require('../../../assets/images/astro_banner.jpg'),
    icon: 'creation',
    colors: ['#7C3AED', '#5B21B6'],
  },
  {
    key: 'merchant',
    title_en: 'Merchant',
    title_hi: 'पूजा सामग्री',
    desc_en: 'Sell Pooja Samagri &\nSpiritual Products',
    desc_hi: 'पूजा सामग्री व\nकिट विक्रेता',
    image: require('../../../assets/images/merchant_banner.jpg'),
    icon: 'store',
    colors: ['#2563EB', '#1D4ED8'],
  },
  {
    key: 'temple',
    title_en: 'Temple Admin',
    title_hi: 'मंदिर व्यवस्थापक',
    desc_en: 'Manage Mandir Timings,\nAarti, Darshan & Daan',
    desc_hi: 'आरती, दर्शन व\nदान प्रबंधन',
    image: require('../../../assets/images/pandit_banner.jpg'),
    icon: 'temple-hindu',
    colors: ['#D97706', '#92400E'],
  },
];

export default function RoleSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { language, isHindi, t } = useLanguage();

  const isSmallScreen = height < 720;
  const isVerySmall = height < 650;

  const handleSelect = (roleKey) => {
    navigation.navigate('Login', { role: roleKey });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFDF9" />
      
      {/* Top Header with Back Chevron & Language Switcher */}
      <View style={[s.header, { height: isSmallScreen ? 38 : 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }]}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#2D1517" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <LanguageSwitcher />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.content,
          {
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Welcome Typography Header */}
        <View style={[s.titleWrap, { marginBottom: isVerySmall ? 14 : isSmallScreen ? 20 : 26 }]}>
          <Text style={s.welcomeText} maxFontSizeMultiplier={1.15}>{isHindi ? 'स्वागत है' : 'Welcome to'}</Text>
          <Text style={s.brandText} maxFontSizeMultiplier={1.15}>VaidicSanskar Partners</Text>
          <Text style={s.subText} maxFontSizeMultiplier={1.15}>{isHindi ? 'आगे बढ़ने के लिए अपनी सेवा श्रेणी चुनें' : 'Select your role to continue'}</Text>
        </View>

        {/* 2x2 Grid with Gradient Cards */}
        <View style={s.grid}>
          {rolesData.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.88}
              style={[
                s.gridItem,
                isSmallScreen && { aspectRatio: 0.84 },
              ]}
              onPress={() => handleSelect(item.key)}
            >
              <LinearGradient colors={item.colors} style={s.cardGradient}>
                {/* Visual Avatar with Circular Border */}
                <View style={[s.avatarFrame, isSmallScreen && { width: 50, height: 50, borderRadius: 25 }]}>
                  <Image
                    source={item.image}
                    style={s.avatarImg}
                    resizeMode="cover"
                  />
                </View>

                {/* Role Title */}
                <Text
                  style={[s.cardTitle, isSmallScreen && { fontSize: 16 }]}
                  maxFontSizeMultiplier={1.15}
                >
                  {isHindi ? item.title_hi : item.title_en}
                </Text>

                {/* Role Description */}
                <Text
                  style={[s.cardDesc, isSmallScreen && { fontSize: 10.5, lineHeight: 14 }]}
                  maxFontSizeMultiplier={1.15}
                >
                  {isHindi ? item.desc_hi : item.desc_en}
                </Text>

                {/* Circular Arrow Button */}
                <View style={[s.arrowBtn, isSmallScreen && { width: 26, height: 26, borderRadius: 13 }]}>
                  <MaterialCommunityIcons name="arrow-right" size={15} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Community Footer */}
        <View style={[s.footer, { marginTop: isVerySmall ? 16 : isSmallScreen ? 24 : 32 }]}>
          <MaterialCommunityIcons name="flower-tulip-outline" size={24} color="#D97706" />
          <Text style={s.footerText} maxFontSizeMultiplier={1.15}>
            Together for a stronger{'\n'}spiritual community
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  header: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
  brandText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  subText: {
    fontSize: 13.5,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '400',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 14,
  },
  gridItem: {
    width: '47.5%',
    aspectRatio: 0.88,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardGradient: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarFrame: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '500',
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#92400E',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 6,
  },
});
