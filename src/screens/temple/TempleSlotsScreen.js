import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { serif, shadow } from '../../theme/styles';
import templeAdminStore from '../../services/templeAdminStore';

export default function TempleSlotsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [, setTick] = useState(0);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState('02:00 PM');
  const [newSlotCapacity, setNewSlotCapacity] = useState('300');
  const [newVipPrice, setNewVipPrice] = useState('351');

  useEffect(() => {
    const unsub = templeAdminStore.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const temple = templeAdminStore.getTemple();

  const handleAddSlot = () => {
    if (!newSlotTime.trim()) {
      Alert.alert('त्रुटि', 'कृपया स्लॉट का समय भरें।');
      return;
    }
    templeAdminStore.addSlot(newSlotTime.trim(), newSlotCapacity, newVipPrice);
    setAddModalVisible(false);
    Alert.alert('सफल', `नया दर्शन स्लॉट (${newSlotTime}) सफलता से जोड़ा गया।`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Header */}
      <View style={[s.head, { paddingTop: insets.top + 8 }]}>
        <View style={s.headRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.headTitle}>दर्शन स्लॉट प्रबंधन</Text>
            <Text style={s.headSub}>Darshan Slots & Quota</Text>
          </View>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => setAddModalVisible(true)}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Quota Summary Box */}
        <View style={s.summaryCard}>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>
              {temple.slots.reduce((sum, sl) => sum + sl.capacity, 0)}
            </Text>
            <Text style={s.summaryLabel}>दैनिक कुल क्षमता</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.primary }]}>
              {temple.slots.reduce((sum, sl) => sum + sl.booked, 0)}
            </Text>
            <Text style={s.summaryLabel}>आज कुल आरक्षित</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.success }]}>
              {temple.slots.reduce((sum, sl) => sum + (sl.capacity - sl.booked), 0)}
            </Text>
            <Text style={s.summaryLabel}>अवशेष स्थान</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>आज के सक्रिय दर्शन स्लॉट्स</Text>

        {/* Slot Cards List */}
        {temple.slots.map((sl) => {
          const percent = Math.min(100, Math.round((sl.booked / sl.capacity) * 100));
          const isFull = sl.booked >= sl.capacity;

          return (
            <View key={sl.id} style={s.slotCard}>
              <View style={s.slotTopRow}>
                <View style={s.slotTimeBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.maroon} />
                  <Text style={s.slotTimeText}>{sl.time}</Text>
                </View>
                <View style={[s.statusPill, isFull ? s.statusPillFull : s.statusPillOpen]}>
                  <Text style={[s.statusPillText, isFull ? s.statusPillFullText : s.statusPillOpenText]}>
                    {isFull ? 'पूर्ण (Housefull)' : `${sl.capacity - sl.booked} स्थान शेष`}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={s.progressBarTrack}>
                <View
                  style={[
                    s.progressBarFill,
                    {
                      width: `${percent}%`,
                      backgroundColor: percent > 90 ? '#DC2626' : colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={s.slotMetaRow}>
                <Text style={s.slotMetaText}>आरक्षित: {sl.booked} / {sl.capacity} भक्त ({percent}%)</Text>
              </View>

              {/* VIP / Sugam pass info */}
              <View style={s.vipPassStrip}>
                <MaterialCommunityIcons name="crown" size={16} color="#D97706" />
                <Text style={s.vipPassText}>
                  सुगम दर्शन पास: ₹{sl.vipPrice} • कोटा: {sl.vipBooked}/{sl.vipQuota}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Slot Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>नया दर्शन स्लॉट जोड़ें</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>स्लॉट समय *</Text>
            <TextInput
              style={s.input}
              value={newSlotTime}
              onChangeText={setNewSlotTime}
              placeholder="उदा. 02:00 PM"
            />

            <Text style={s.fieldLabel}>प्रति स्लॉट भक्त क्षमता (Capacity) *</Text>
            <TextInput
              style={s.input}
              value={newSlotCapacity}
              onChangeText={setNewSlotCapacity}
              placeholder="300"
              keyboardType="number-pad"
            />

            <Text style={s.fieldLabel}>सुगम/VIP पास शुल्क (₹)</Text>
            <TextInput
              style={s.input}
              value={newVipPrice}
              onChangeText={setNewVipPrice}
              placeholder="351"
              keyboardType="number-pad"
            />

            <TouchableOpacity style={s.saveBtn} onPress={handleAddSlot}>
              <Text style={s.saveBtnText}>स्लॉट सुरक्षित करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  head: {
    backgroundColor: '#FAF7F0',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D6',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '700',
    color: colors.maroon,
  },
  headSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    marginBottom: 16,
    ...shadow,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#EFE4D6',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.maroon,
    marginBottom: 10,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.maroon,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillOpen: {
    backgroundColor: '#DCFCE7',
  },
  statusPillOpenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  statusPillFull: {
    backgroundColor: '#FEE2E2',
  },
  statusPillFullText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  slotMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  slotMetaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  vipPassStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  vipPassText: {
    fontSize: 11.5,
    color: '#92400E',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
  },
  modalHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '700',
    color: colors.maroon,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
