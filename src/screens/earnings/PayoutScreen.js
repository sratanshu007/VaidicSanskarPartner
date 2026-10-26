import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import { usePartner } from '../../context/PartnerContext';

export default function PayoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { earnings, requestPayout, vendor } = usePartner();

  const availableBalance = earnings?.pending || 0;
  const [amount, setAmount] = useState(availableBalance > 0 ? String(availableBalance) : '');
  const [selectedMethod, setSelectedMethod] = useState('bank'); // 'bank' or 'upi'
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const handleSubmit = () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      Alert.alert('त्रुटि', 'कृपया वैध राशि दर्ज करें।');
      return;
    }
    if (num > availableBalance) {
      Alert.alert('अपर्याप्त शेष', `आप अधिकतम ₹${availableBalance.toLocaleString('en-IN')} निकाल सकते हैं।`);
      return;
    }

    requestPayout(num);
    setPayoutSuccess(true);
  };

  if (payoutSuccess) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={s.successCircle}>
          <MaterialCommunityIcons name="check-decagram" size={56} color="#15803D" />
        </View>
        <Text style={s.successTitle}>तुरंत आहरण अनुरोध स्वीकृत</Text>
        <Text style={s.successAmt}>₹ {Number(amount).toLocaleString('en-IN')}</Text>
        <Text style={s.successDesc}>
          राशि आपके {selectedMethod === 'bank' ? 'बैंक खाते' : 'UPI ID'} में 5-15 मिनट में जमा हो जाएगी।
          लेज़र रिकॉर्ड अपडेट कर दिया गया है।
        </Text>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.backBtnText}>कमाई डैशबोर्ड पर वापस जाएं</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Header
        title="तुरंत बैंक आहरण (Instant Payout)"
        subtitle="UPI / IMPS द्वारा 24x7 तत्काल ट्रांसफर"
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Available Balance Card */}
        <View style={s.balanceCard}>
          <View style={s.balanceRow}>
            <View>
              <Text style={s.balLabel}>उपलब्ध निकासी शेष राशि</Text>
              <Text style={s.balAmount}>₹ {availableBalance.toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.secureBadge}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#15803D" />
              <Text style={s.secureText}>100% सुरक्षित</Text>
            </View>
          </View>
          <View style={s.holdNotice}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#92400E" />
            <Text style={s.holdText}>
              24 घंटे की यजमान समीक्षा व विवाद अवधि पूर्ण होने पर राशि तत्काल निकासी हेतु स्वतः अनलॉक होती है।
            </Text>
          </View>
        </View>

        {/* Commission Engine Breakdown Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>प्लेटफॉर्म कमीशन व आय गणना नीति</Text>
          <View style={s.calcRow}>
            <Text style={s.calcLabel}>पूजा दक्षिणा पर प्लेटफॉर्म कमीशन</Text>
            <Text style={s.calcValRed}>−15%</Text>
          </View>
          <View style={s.calcRow}>
            <Text style={s.calcLabel}>पंडित जी की शुद्ध दक्षिणा</Text>
            <Text style={s.calcValGreen}>85%</Text>
          </View>
          <View style={s.calcRow}>
            <Text style={s.calcLabel}>सामग्री शुल्क (यदि सामग्री पंडित जी लाएं)</Text>
            <Text style={s.calcValGreen}>100% पंडित जी को (₹0 कमीशन)</Text>
          </View>
          <View style={s.calcRow}>
            <Text style={s.calcLabel}>यजमान द्वारा दी गई टिप (Tips)</Text>
            <Text style={s.calcValGreen}>100% पंडित जी को (₹0 कमीशन)</Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={s.card}>
          <Text style={s.cardTitle}>निकासी राशि (₹)</Text>
          <View style={s.inputContainer}>
            <Text style={s.rupeeSymbol}>₹</Text>
            <TextInput
              style={s.amountInput}
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#8C786E"
            />
            <TouchableOpacity
              style={s.maxBtn}
              onPress={() => setAmount(String(availableBalance))}
            >
              <Text style={s.maxBtnText}>पूरी राशि</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transfer Destination Selection */}
        <View style={s.card}>
          <Text style={s.cardTitle}>भुगतान माध्यम चुनें</Text>

          <TouchableOpacity
            style={[s.methodOption, selectedMethod === 'bank' && s.methodActive]}
            onPress={() => setSelectedMethod('bank')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bank"
              size={22}
              color={selectedMethod === 'bank' ? colors.primary : '#8C786E'}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.methodTitle}>पंजीकृत बैंक खाता</Text>
              <Text style={s.methodSub}>
                {vendor?.bank?.account ? `••••${String(vendor.bank.account).slice(-4)}` : 'अपरिभाषित खाता'} {vendor?.bank?.ifsc ? `· ${vendor.bank.ifsc}` : ''}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={selectedMethod === 'bank' ? 'radiobox-marked' : 'radiobox-blank'}
              size={20}
              color={selectedMethod === 'bank' ? colors.primary : '#8C786E'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.methodOption, selectedMethod === 'upi' && s.methodActive]}
            onPress={() => setSelectedMethod('upi')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="cellphone-check"
              size={22}
              color={selectedMethod === 'upi' ? colors.primary : '#8C786E'}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.methodTitle}>त्वरित UPI ट्रांसफर (VPA)</Text>
              <Text style={s.methodSub}>{vendor?.bank?.upi || 'UPI ID उपलब्ध नहीं'}</Text>
            </View>
            <MaterialCommunityIcons
              name={selectedMethod === 'upi' ? 'radiobox-marked' : 'radiobox-blank'}
              size={20}
              color={selectedMethod === 'upi' ? colors.primary : '#8C786E'}
            />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={s.withdrawBtn}
          activeOpacity={0.85}
          onPress={handleSubmit}
        >
          <MaterialCommunityIcons name="bank-transfer-out" size={22} color="#FFF" />
          <Text style={s.withdrawBtnText}>
            तुरंत निकासी करें (₹ {Number(amount || 0).toLocaleString('en-IN')}) ›
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    padding: 18,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C786E',
    textTransform: 'uppercase',
  },
  balAmount: {
    fontFamily: serif,
    fontSize: 32,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 4,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  secureText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  holdNotice: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  holdText: {
    flex: 1,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
    marginBottom: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EDE4',
  },
  calcLabel: {
    fontSize: 12.5,
    color: '#7A6458',
  },
  calcValRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  calcValGreen: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ECE3D7',
    paddingHorizontal: 14,
    height: 58,
  },
  rupeeSymbol: {
    fontSize: 24,
    fontFamily: serif,
    fontWeight: '800',
    color: '#3A1208',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#3A1208',
  },
  maxBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  maxBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 10,
  },
  methodActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF',
  },
  methodTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3A1208',
  },
  methodSub: {
    fontSize: 12,
    color: '#8C786E',
    marginTop: 2,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    ...shadow,
  },
  withdrawBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successTitle: {
    fontFamily: serif,
    fontSize: 22,
    fontWeight: '800',
    color: '#3A1208',
    textAlign: 'center',
  },
  successAmt: {
    fontFamily: serif,
    fontSize: 34,
    fontWeight: '800',
    color: '#15803D',
    marginVertical: 10,
  },
  successDesc: {
    fontSize: 13.5,
    color: '#7A6458',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
