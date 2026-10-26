import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { radius, spacing, shadow, serif } from '../theme/styles';

export const Sheet = ({ visible, onClose, children, title }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={ws.backdrop} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} style={ws.sheet}>
        <View style={ws.handle} />
        {title ? <Text style={ws.sheetTitle}>{title}</Text> : null}
        {children}
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

export const Chip = ({ label, active, onPress, icon }) => (
  <TouchableOpacity style={[ws.chip, active && ws.chipA]} onPress={onPress} activeOpacity={0.8}>
    {icon ? <MaterialCommunityIcons name={icon} size={15} color={active ? colors.onGold : colors.textMuted} style={{ marginRight: 5 }} /> : null}
    <Text style={[ws.chipT, active && ws.chipTA]}>{label}</Text>
  </TouchableOpacity>
);

export const Tag = ({ text, color = colors.maroon }) => (
  <View style={[ws.tag, { backgroundColor: color + '15', borderColor: color + '35' }]}>
    <Text style={[ws.tagT, { color }]}>{text}</Text>
  </View>
);

export const StatTile = ({ label, value, color = colors.maroon, icon }) => (
  <View style={ws.stat}>
    {icon ? <MaterialCommunityIcons name={icon} size={20} color={color} /> : null}
    <Text style={[ws.statV, { color }]}>{value}</Text>
    <Text style={ws.statL}>{label}</Text>
  </View>
);

export const Stepper = ({ steps, current }) => (
  <View style={ws.stepper}>
    {steps.map((s, i) => (
      <React.Fragment key={s}>
        <View style={ws.stepItem}>
          <View style={[ws.stepDot, i < current && ws.stepDone, i === current && ws.stepNow]}>
            {i < current ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : <Text style={[ws.stepNum, i === current && { color: colors.onGold }]}>{i + 1}</Text>}
          </View>
          <Text style={[ws.stepLbl, i === current && { color: colors.maroon, fontWeight: '800' }]} numberOfLines={1}>{s}</Text>
        </View>
        {i < steps.length - 1 && <View style={[ws.stepLine, i < current && ws.stepLineDone]} />}
      </React.Fragment>
    ))}
  </View>
);

export const Avatar = ({ icon = 'account', size = 48, color = colors.maroon, online }) => (
  <View style={{ width: size, height: size }}>
    <View style={[ws.av, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '18' }]}>
      <MaterialCommunityIcons name={icon} size={size * 0.55} color={color} />
    </View>
    {online != null && <View style={[ws.avDot, { backgroundColor: online ? colors.online : colors.offline }]} />}
  </View>
);

const ws = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 32 },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontFamily: serif, fontSize: 18, fontWeight: '800', color: colors.maroon, marginBottom: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', marginRight: 8, marginBottom: 8 },
  chipA: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipT: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTA: { color: colors.onGold, fontWeight: '800' },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  tagT: { fontSize: 11, fontWeight: '800' },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow },
  statV: { fontFamily: serif, fontSize: 20, fontWeight: '900', marginTop: 4 },
  statL: { fontSize: 11, color: colors.textMuted, marginTop: 3, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepItem: { alignItems: 'center', width: 70 },
  stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepNow: { backgroundColor: colors.gold, borderColor: colors.gold },
  stepNum: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  stepLbl: { fontSize: 10, color: colors.textMuted, marginTop: 5, textAlign: 'center' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 18 },
  stepLineDone: { backgroundColor: colors.success },
  av: { alignItems: 'center', justifyContent: 'center' },
  avDot: { position: 'absolute', right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
});

