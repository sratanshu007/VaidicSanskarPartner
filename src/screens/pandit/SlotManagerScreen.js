import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/ui';
import { Chip, Tag } from '../../components/widgets';
import colors from '../../theme/colors';
import { radius, shadow, serif } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SlotManagerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { slots, toggleSlot } = usePartner();
  const [day, setDay] = useState('Mon');
  const list = slots.filter((s) => s.day === day);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Slot Manager" subtitle="One booking per slot — overlaps blocked" navigation={navigation} showBack={false} />
      <View style={s.dayBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {days.map((d) => <Chip key={d} label={d} active={day === d} onPress={() => setDay(d)} />)}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {list.length === 0 && <Text style={s.empty}>Is din koi slot define nahi.</Text>}
        {list.map((slot) => (
          <View key={slot.id} style={[s.slot, slot.booked && s.booked, slot.blocked && s.blocked]}>
            <MaterialCommunityIcons
              name={slot.booked ? 'calendar-check' : slot.blocked ? 'calendar-remove' : 'calendar-blank'}
              size={24} color={slot.booked ? colors.success : slot.blocked ? colors.danger : colors.maroon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.time}>{slot.time}</Text>
              {slot.booked ? <Text style={s.job}>Booked · {slot.job}</Text>
                : slot.blocked ? <Text style={s.blockedT}>Blocked (unavailable)</Text>
                : <Text style={s.free}>Available</Text>}
            </View>
            {slot.booked ? (
              <Tag text="Locked" color={colors.success} />
            ) : (
              <TouchableOpacity style={[s.btn, slot.blocked && s.btnOpen]} onPress={() => toggleSlot(slot.id)}>
                <Text style={[s.btnT, slot.blocked && { color: colors.success }]}>{slot.blocked ? 'Unblock' : 'Block'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={s.note}>
          <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
          <Text style={s.noteT}>Booked slots auto-lock — overlapping requests aapko nahi bheje jaate.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  dayBar: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  slot: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow },
  booked: { borderLeftWidth: 4, borderLeftColor: colors.success },
  blocked: { borderLeftWidth: 4, borderLeftColor: colors.danger, opacity: 0.85 },
  time: { fontFamily: serif, fontSize: 15.5, fontWeight: '700', color: colors.text },
  job: { fontSize: 12.5, color: colors.success, fontWeight: '700', marginTop: 2 },
  blockedT: { fontSize: 12.5, color: colors.danger, marginTop: 2 },
  free: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  btn: { borderWidth: 1, borderColor: colors.danger, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  btnOpen: { borderColor: colors.success },
  btnT: { color: colors.danger, fontWeight: '800', fontSize: 12.5 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF5EE', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: colors.primary + '20' },
  noteT: { flex: 1, fontSize: 12, color: colors.maroon, fontWeight: '600' },
});

