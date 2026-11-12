import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';

const PERIODS = ['This Month', 'Last Month', 'All Time'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildLiveBars(txList, period) {
  const now = new Date();
  const buckets = [];
  if (period === 'All Time') {
    for (let q = 0; q < 4; q++) {
      buckets.push({ key: `Q${q + 1}`, label: `Q${q + 1}`, earned: 0, withdrawn: 0 });
    }
  } else {
    const offset = period === 'Last Month' ? 1 : 0;
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i - offset, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_LABELS[d.getMonth()],
        earned: 0,
        withdrawn: 0,
      });
    }
  }

  for (const tx of txList || []) {
    const dt = new Date(tx.createdAt || tx.date || Date.now());
    const amt = Math.abs(Number(tx.amount || 0));
    if (!Number.isFinite(amt) || amt <= 0) continue;
    const isDebit =
      String(tx.type || '').toLowerCase() === 'debit' ||
      String(tx.type || '').toLowerCase() === 'withdrawal';
    const key =
      period === 'All Time'
        ? `Q${Math.floor(dt.getMonth() / 3) + 1}`
        : `${dt.getFullYear()}-${dt.getMonth()}`;
    const target = buckets.find((b) => b.key === key);
    if (target) {
      if (isDebit) target.withdrawn += amt;
      else target.earned += amt;
    }
  }

  const maxVal = Math.max(0, ...buckets.flatMap((b) => [b.earned, b.withdrawn]));
  const scaleTop = maxVal > 0 ? Math.ceil(maxVal / 100) * 100 : 0;
  return {
    scaleTop,
    bars: buckets.map((b) => ({
      label: b.label,
      vals: scaleTop > 0 ? [Math.round((b.withdrawn / scaleTop) * 32), Math.round((b.earned / scaleTop) * 32)] : [0, 0],
    })),
  };
}

export default function WalletEarningsScreen({ navigation }) {
  const {
    vendor,
    walletBalance,
    earnings,
    transactions,
    withdrawFunds,
    refreshEarnings,
  } = usePartner();

  const [period, setPeriod] = useState('This Month');
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState(vendor?.upiId || '');
  const [withdrawing, setWithdrawing] = useState(false);

  const displayTotal = useMemo(() => {
    const fallback = typeof earnings === 'object' ? earnings?.pending ?? earnings?.total : earnings;
    const raw = Number(walletBalance ?? fallback ?? 0);
    if (!Number.isFinite(raw)) return 0;
    return raw;
  }, [walletBalance, earnings]);

  const txList = useMemo(() => {
    if (Array.isArray(transactions) && transactions.length > 0) {
      return transactions;
    }
    return [];
  }, [transactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshEarnings?.();
    } finally {
      setRefreshing(false);
    }
  }, [refreshEarnings]);

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }
    if (amt > displayTotal) {
      Alert.alert('Insufficient Balance', 'Amount exceeds your available wallet balance.');
      return;
    }
    if (!upiId.trim()) {
      Alert.alert('UPI Required', 'Please enter your UPI ID for instant bank payout.');
      return;
    }

    setWithdrawing(true);
    try {
      await withdrawFunds?.(amt, upiId.trim());
      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      Alert.alert(
        'Payout Initiated',
        `₹ ${amt.toLocaleString('en-IN')} withdrawal requested to ${upiId.trim()}.`
      );
    } catch (err) {
      Alert.alert('Payout Notice', err?.message || 'Unable to process withdrawal right now.');
    } finally {
      setWithdrawing(false);
    }
  };

  const { scaleTop, bars } = useMemo(() => buildLiveBars(txList, period), [txList, period]);
  const formatAxis = (val) => (val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `${val}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4A0813" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#67101F" />
        }
      >
        {/* Maroon Total Earnings Card */}
        <LinearGradient
          colors={['#6E1020', '#4A0813']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, shadow]}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Total Earnings</Text>
            <Text style={styles.heroAmount}>₹ {displayTotal.toLocaleString('en-IN')}</Text>
            <View style={styles.growthRow}>
              <Ionicons name={txList.length > 0 ? 'trending-up' : 'time-outline'} size={13} color="#7CE39C" />
              <Text style={styles.growthText}>
                {txList.length > 0
                  ? `${txList.length} live transaction${txList.length === 1 ? '' : 's'}`
                  : 'New account • ₹0 earned yet'}
              </Text>
            </View>
          </View>

          <View style={styles.heroRight}>
            <View style={styles.miniTrendWrap}>
              <View style={[styles.miniBar, { height: 14, backgroundColor: '#C44530' }]} />
              <View style={[styles.miniBar, { height: 22, backgroundColor: '#D66931' }]} />
              <View style={[styles.miniBar, { height: 32, backgroundColor: '#E5973B' }]} />
              <Ionicons
                name="trending-up"
                size={26}
                color="#F2B84B"
                style={{ marginLeft: 4 }}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.withdrawPill}
              onPress={() => setWithdrawModalVisible(true)}
            >
              <Text style={styles.withdrawPillText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Period Filter Tabs */}
        <View style={styles.tabsRow}>
          {PERIODS.map((p) => {
            const active = period === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chart Card */}
        <View style={[styles.chartCard, shadow]}>
          <View style={styles.chartBody}>
            <View style={styles.yAxis}>
              <Text style={styles.yLabel}>{scaleTop > 0 ? formatAxis(scaleTop) : '0'}</Text>
              <Text style={styles.yLabel}>{scaleTop > 0 ? formatAxis(Math.round((scaleTop * 2) / 3)) : '0'}</Text>
              <Text style={styles.yLabel}>{scaleTop > 0 ? formatAxis(Math.round(scaleTop / 3)) : '0'}</Text>
              <Text style={styles.yLabel}>0</Text>
            </View>
            <View style={styles.barsArea}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.barsRow}>
                {bars.map((grp) => (
                  <View key={grp.label} style={styles.barGroup}>
                    <View style={styles.barPair}>
                      <View
                        style={[
                          styles.barColumn,
                          {
                            height: Math.min(100, grp.vals[0] * 3),
                            backgroundColor: '#C43E22',
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.barColumn,
                          {
                            height: Math.min(108, grp.vals[1] * 3),
                            backgroundColor: '#DF7F41',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.xLabel}>{grp.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {txList.length === 0 ? (
          <View style={[styles.txCard, shadow, { justifyContent: 'center', paddingVertical: 20 }]}>
            <Text style={[styles.txMeta, { textAlign: 'center' }]}>
              No live earnings or withdrawals yet. Completed Poojas & consultations appear here immediately.
            </Text>
          </View>
        ) : txList.map((tx, idx) => {
          const isDebit =
            String(tx.type || '').toLowerCase() === 'debit' ||
            String(tx.type || '').toLowerCase() === 'withdrawal';
          const amt = Math.abs(Number(tx.amount || 0));
          return (
            <View key={tx.id || idx} style={[styles.txCard, shadow]}>
              <View style={styles.txIconCircle}>
                <Ionicons
                  name={isDebit ? 'arrow-up-circle' : 'notifications'}
                  size={18}
                  color={isDebit ? '#D13939' : '#DF7F28'}
                />
              </View>
              <View style={styles.txBody}>
                <Text
                  style={[
                    styles.txAmount,
                    { color: isDebit ? '#D13939' : '#1E8E4A' },
                  ]}
                >
                  {isDebit ? '- ' : '+ '}₹{amt.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.txMeta}>
                  {tx.sub || tx.date || tx.createdAt || 'Recent'}
                  {tx.title ? ` • ${tx.title}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9A8879" />
            </View>
          );
        })}
      </ScrollView>

      {/* UPI Withdraw Modal */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4A0813" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBalance}>
              Available Balance: ₹ {displayTotal.toLocaleString('en-IN')}
            </Text>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.inputBox}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="e.g. 5000"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>UPI ID</Text>
            <TextInput
              style={styles.inputBox}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="yourname@okaxis"
              autoCapitalize="none"
            />

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={withdrawing}
              onPress={handleWithdraw}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={['#7E1627', '#530A17']}
                style={styles.submitWithdrawBtn}
              >
                {withdrawing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitWithdrawText}>Confirm Payout</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D6',
    backgroundColor: '#FBF6EE',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '700',
    color: '#4A0813',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 34,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13.5,
    color: '#F3DFC6',
    fontWeight: '500',
  },
  heroAmount: {
    fontFamily: serif,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  growthText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7CE39C',
  },
  heroRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  miniTrendWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  miniBar: {
    width: 7,
    borderRadius: 3,
  },
  withdrawPill: {
    backgroundColor: '#F6E6CF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  withdrawPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4A0813',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#67101F',
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#7A6859',
  },
  tabTextActive: {
    color: '#4A0813',
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 20,
  },
  chartBody: {
    flexDirection: 'row',
    height: 145,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingRight: 10,
  },
  yLabel: {
    fontSize: 11.5,
    color: '#8D7B6E',
  },
  barsArea: {
    flex: 1,
    justifyContent: 'space-between',
    position: 'relative',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F2EAE0',
    width: '100%',
  },
  barsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  barGroup: {
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    marginBottom: 6,
  },
  barColumn: {
    width: 14,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  xLabel: {
    fontSize: 12,
    color: '#5D4037',
    fontWeight: '500',
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 17.5,
    fontWeight: '700',
    color: '#4A0813',
    marginBottom: 12,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 10,
    gap: 12,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF2DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBody: {
    flex: 1,
  },
  txAmount: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  txMeta: {
    fontSize: 12.5,
    color: '#7A6859',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,10,8,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FBF6EE',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 19,
    fontWeight: '700',
    color: '#4A0813',
  },
  modalBalance: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E8E4A',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A1E19',
    marginBottom: 6,
  },
  inputBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D8C8',
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: '#2F1510',
    marginBottom: 12,
  },
  submitWithdrawBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitWithdrawText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
