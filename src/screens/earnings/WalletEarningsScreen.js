import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePartner } from '../../context/PartnerContext';
import colors from '../../theme/colors';

export default function WalletEarningsScreen({ navigation }) {
  const { walletBalance, transactions, withdrawFunds, vendor } = usePartner();

  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState(vendor?.bank?.upi || '');

  const handleWithdraw = () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid', 'Please enter a valid amount');
      return;
    }
    if (amt > walletBalance) {
      Alert.alert('Insufficient Balance', 'Withdrawal amount exceeds available balance.');
      return;
    }
    withdrawFunds(amt);
    setWithdrawModalVisible(false);
    Alert.alert('Payout Initiated', `₹ ${amt} has been transferred to ${upiId}.`);
  };

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
          <Text style={s.headerTitle}>Wallet & Earnings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Available Balance Maroon Card */}
          <LinearGradient
            colors={['#67101F', '#490B15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.balanceCard}
          >
            <View style={s.balanceHeaderRow}>
              <View>
                <Text style={s.balanceLabel}>Available Balance</Text>
                <Text style={s.balanceValue}>₹ {walletBalance.toLocaleString('en-IN')}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setWithdrawModalVisible(true)}
                style={s.withdrawBtn}
              >
                <Text style={s.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Recent Transactions Header */}
          <Text style={s.sectionTitle}>Recent Transactions</Text>

          {/* Transactions List */}
          <View style={s.list}>
            {transactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <View key={tx.id} style={s.txCard}>
                  <View
                    style={[
                      s.txIconCircle,
                      { backgroundColor: isCredit ? '#EBF8F0' : '#FDECEC' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        tx.icon || (isCredit ? 'cash-plus' : 'bank-transfer-out')
                      }
                      size={22}
                      color={isCredit ? '#1E8E4A' : '#D13939'}
                    />
                  </View>

                  <View style={s.txInfo}>
                    <Text style={s.txTitle}>{tx.title}</Text>
                    <Text style={s.txSub}>{tx.sub}</Text>
                  </View>

                  <Text
                    style={[
                      s.txAmount,
                      { color: isCredit ? '#1E8E4A' : '#D13939' },
                    ]}
                  >
                    {isCredit
                      ? `+ ₹ ${tx.amount.toLocaleString('en-IN')}`
                      : `- ₹ ${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Withdraw Modal */}
        <Modal
          visible={withdrawModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setWithdrawModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Withdraw Earnings</Text>

              <View style={s.modalForm}>
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Amount (₹)</Text>
                  <TextInput
                    style={s.modalInput}
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    keyboardType="numeric"
                  />
                </View>

                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>UPI ID / Bank Account</Text>
                  <TextInput
                    style={s.modalInput}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleWithdraw}
                  style={s.modalSubmitBtn}
                >
                  <Text style={s.modalSubmitBtnText}>Proceed to Withdraw</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setWithdrawModalVisible(false)}
                  style={s.modalCancelBtn}
                >
                  <Text style={s.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  balanceCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 26,
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#F4D8DE',
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  withdrawBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 14,
    fontFamily: 'serif',
  },
  list: {
    gap: 12,
  },
  txCard: {
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
  txIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 2,
  },
  txSub: {
    fontSize: 12,
    color: '#7D686B',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D4C8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 16,
    fontFamily: 'serif',
  },
  modalForm: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14.5,
    color: '#2E1418',
  },
  modalSubmitBtn: {
    height: 48,
    backgroundColor: '#67101F',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    color: '#7D686B',
    fontSize: 14,
  },
});
