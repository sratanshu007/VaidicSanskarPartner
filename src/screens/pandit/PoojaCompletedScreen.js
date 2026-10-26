import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import styles, { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import panditBookingStore from '../../services/panditBookingStore';

export default function PoojaCompletedScreen({ navigation, route }) {
  const { walletBalance } = usePartner();
  const job = route.params?.job || {};

  const [rating, setRating] = useState(5);
  const [blessing, setBlessing] = useState('ईश्वर यजमान के परिवार में सुख, शांति, स्वास्थ्य व समृद्धि बनाए रखें। शुभम् भवतु॥');
  const [submitted, setSubmitted] = useState(false);

  const poojaName = job?.poojaName || job?.pooja?.name || job?.name || 'वैदिक पूजा';
  const yajmanName = job?.yajmanName || 'यजमान';
  const totalPayout = job?.totalPayout || job?.dakshina || 0;

  const handleFinish = () => {
    panditBookingStore.reset();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#137338" />

      {/* SUCCESS HERO BANNER */}
      <LinearGradient colors={['#1E8E4A', '#137338']} style={s.heroBanner}>
        <View style={s.omGlow}>
          <MaterialCommunityIcons name="om" size={42} color="#F7C966" />
        </View>
        <Text style={s.heroTitle}>हरि ॐ! पूजा संपन्न हुई</Text>
        <Text style={s.heroSub}>सम्पूर्ण वैदिक विधि-विधान से पूजा संपन्न कराई गई।</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* EARNINGS UNLOCKED CARD */}
        <View style={s.earningCard}>
          <View style={s.earningTop}>
            <View>
              <Text style={s.earningLabel}>अर्जित कुल दक्षिणा राशि</Text>
              <Text style={s.earningAmount}>₹{totalPayout.toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.walletBadge}>
              <Ionicons name="wallet" size={18} color="#1E8E4A" />
              <Text style={s.walletBadgeText}>वॉलेट में जमा</Text>
            </View>
          </View>
          <Text style={s.earningNotice}>
            राशि आपके पंडित पार्टनर वॉलेट में तुरंत जोड़ दी गई है। आप इसे बैंक खाते में कभी भी अंतरित कर सकते हैं।
          </Text>
        </View>

        {/* POOJA SUMMARY DETAILS */}
        <View style={s.card}>
          <Text style={s.cardTitle}>पूजा विवरण (Ritual Summary)</Text>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>पूजा सेवा:</Text>
            <Text style={s.infoVal}>{poojaName}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>यजमान:</Text>
            <Text style={s.infoVal}>{yajmanName}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>स्थिति:</Text>
            <Text style={[s.infoVal, { color: colors.success, fontWeight: '800' }]}>सफलतापूर्वक संपन्न (COMPLETED)</Text>
          </View>
        </View>

        {/* DEVOTEE RATING & BLESSING */}
        <View style={s.card}>
          <Text style={s.cardTitle}>यजमान मूल्यांकन एवं आशीर्वाद</Text>
          <Text style={s.ratingPrompt}>यजमान के व्यवहार व तैयारी हेतु स्टार रेटिंग दें:</Text>

          {/* STAR RATING */}
          <View style={s.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ padding: 4 }}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* VEDIC BLESSING INPUT */}
          <Text style={[s.ratingPrompt, { marginTop: 14 }]}>वैदिक आशीर्वाद व टिप्पणी:</Text>
          <TextInput
            style={s.blessingInput}
            multiline
            numberOfLines={3}
            value={blessing}
            onChangeText={setBlessing}
            placeholder="यजमान हेतु आशीर्वाद संदेश लिखें..."
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM ACTION BUTTON */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={s.homeBtn}
          onPress={handleFinish}
        >
          <LinearGradient colors={['#67101F', '#490B15']} style={s.homeBtnGrad}>
            <Ionicons name="home" size={20} color="#FFFFFF" />
            <Text style={s.homeBtnText}>डैशबोर्ड पर लौटें (Return to Dashboard)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF8F2' },
  heroBanner: { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, ...shadow },
  omGlow: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F7C966', marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', fontFamily: serif, textAlign: 'center' },
  heroSub: { fontSize: 13, color: '#D1FAE5', marginTop: 4, textAlign: 'center' },
  content: { padding: 18 },
  earningCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 16, ...shadow },
  earningTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  earningLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  earningAmount: { fontSize: 28, fontWeight: '900', color: colors.maroon, marginTop: 2 },
  walletBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successBg, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  walletBadgeText: { fontSize: 12, fontWeight: '700', color: colors.success, marginLeft: 6 },
  earningNotice: { fontSize: 12, color: colors.textMuted, lineHeight: 18, borderTopWidth: 1, borderTopColor: '#F5EFE7', paddingTop: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 14, ...shadow },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.maroon, fontFamily: serif, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoVal: { fontSize: 13, fontWeight: '700', color: colors.text },
  ratingPrompt: { fontSize: 12, color: colors.textMuted, marginBottom: 8, fontWeight: '500' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 6 },
  blessingInput: { backgroundColor: '#FAF5EE', borderRadius: 12, borderWidth: 1, borderColor: '#EDE4DA', padding: 12, fontSize: 13, color: colors.text, minHeight: 70, textAlignVertical: 'top' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDE4DA', ...shadow },
  homeBtn: { borderRadius: 16, overflow: 'hidden', ...shadow },
  homeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  homeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginLeft: 8 },
});
