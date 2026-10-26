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

export default function TempleTimingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [, setTick] = useState(0);

  const [editAartiModal, setEditAartiModal] = useState(false);
  const [selectedAarti, setSelectedAarti] = useState(null);
  const [newAartiTime, setNewAartiTime] = useState('');

  useEffect(() => {
    const unsub = templeAdminStore.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const temple = templeAdminStore.getTemple();

  const openEditAarti = (aarti) => {
    setSelectedAarti(aarti);
    setNewAartiTime(aarti.time);
    setEditAartiModal(true);
  };

  const handleSaveAartiTime = () => {
    if (!newAartiTime.trim()) {
      Alert.alert('त्रुटि', 'कृपया समय भरें।');
      return;
    }
    templeAdminStore.updateAartiTime(selectedAarti.id, newAartiTime.trim());
    setEditAartiModal(false);
    Alert.alert('अद्यतन सम्पन्न', `${selectedAarti.name} का समय परिवर्तित कर दिया गया है।`);
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
            <Text style={s.headTitle}>दर्शन व आरती समय सारिणी</Text>
            <Text style={s.headSub}>Darshan & Aarti Timings</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Darshan Sessions Card */}
        <View style={s.sectionCard}>
          <View style={s.sectionHead}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.maroon} />
            <Text style={s.sectionTitle}>दैनिक दर्शन सत्र (Darshan Sessions)</Text>
          </View>
          <Text style={s.timingsTotal}>समग्र मंदिर समय: {temple.timings}</Text>

          {temple.darshanSessions.map((ds, idx) => (
            <View key={idx} style={s.sessionRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.sessionTitle}>{ds.session}</Text>
                <Text style={s.sessionTime}>{ds.time}</Text>
              </View>
              <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            </View>
          ))}
        </View>

        {/* 5 Aartis Schedule Card */}
        <View style={s.sectionCard}>
          <View style={s.sectionHead}>
            <MaterialCommunityIcons name="bell-ring-outline" size={20} color={colors.maroon} />
            <Text style={s.sectionTitle}>दैनिक महाआरती सारिणी (Aarti Schedule)</Text>
          </View>
          <Text style={s.aartiNote}>
            आरती के समय में बदलाव होने पर भक्त ऐप में लाइव काउंटडाउन स्वतः अपडेट हो जाता है:
          </Text>

          {temple.aartis.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={s.aartiCard}
              activeOpacity={0.8}
              onPress={() => openEditAarti(a)}
            >
              <View style={s.aartiIconBox}>
                <MaterialCommunityIcons name="fire" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.aartiName}>{a.name}</Text>
                <Text style={s.aartiDesc}>{a.desc}</Text>
              </View>
              <View style={s.aartiTimeTag}>
                <Text style={s.aartiTimeText}>{a.time}</Text>
                <Ionicons name="pencil-outline" size={13} color={colors.maroon} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Aarti Time Modal */}
      <Modal visible={editAartiModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>{selectedAarti?.name} समय बदलें</Text>
              <TouchableOpacity onPress={() => setEditAartiModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>नया समय दर्ज करें:</Text>
            <TextInput
              style={s.input}
              value={newAartiTime}
              onChangeText={setNewAartiTime}
              placeholder="उदा. 07:00 PM - 08:15 PM"
            />

            <TouchableOpacity style={s.saveBtn} onPress={handleSaveAartiTime}>
              <Text style={s.saveBtnText}>समय सुरक्षित करें</Text>
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
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.maroon,
  },
  timingsTotal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F6F0E6',
  },
  sessionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  sessionTime: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  aartiNote: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  aartiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F6F0E6',
  },
  aartiIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aartiName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  aartiDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  aartiTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aartiTimeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.maroon,
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
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
