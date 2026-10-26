import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { radius, spacing, shadow, serif } from '../theme/styles';

export const Header = ({ title, subtitle, navigation, right, showBack = true }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 8;
  return (
    <View style={[hs.header, { paddingTop: topPadding }]}>
      <View style={hs.row}>
        {showBack && navigation ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={hs.back} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : <View style={{ width: 36 }} />}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={hs.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={hs.sub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right || <View style={{ width: 36 }} />}
      </View>
    </View>
  );
};

export const Button = ({ title, onPress, style, variant = 'primary', icon, disabled, color }) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={[{ opacity: disabled ? 0.5 : 1 }, style]}>
        <LinearGradient colors={color ? [color, color] : colors.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={bs.btn}>
          {icon ? <MaterialCommunityIcons name={icon} size={18} color={colors.onGold} style={{ marginRight: 8 }} /> : null}
          <Text style={bs.btnText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={[bs.outline, style]}>
      {icon ? <MaterialCommunityIcons name={icon} size={18} color={colors.maroon} style={{ marginRight: 8 }} /> : null}
      <Text style={bs.outlineText}>{title}</Text>
    </TouchableOpacity>
  );
};

export const GoldButton = Button;

export const Field = ({ label, icon, ...props }) => (
  <View style={{ marginBottom: spacing.lg }}>
    {label ? <Text style={fs.label}>{label}</Text> : null}
    <View style={fs.wrap}>
      {icon ? <MaterialCommunityIcons name={icon} size={20} color={colors.primary} style={{ marginRight: 8 }} /> : null}
      <TextInput placeholderTextColor={colors.textMuted} style={fs.input} {...props} />
    </View>
  </View>
);

export const Card = ({ children, style, onPress }) => {
  const W = onPress ? TouchableOpacity : View;
  return <W activeOpacity={0.9} onPress={onPress} style={[cs.card, style]}>{children}</W>;
};

export const Screen = ({ children, scroll = true, style }) => {
  const insets = useSafeAreaInsets();
  return scroll ? (
    <ScrollView style={[{ flex: 1, backgroundColor: colors.cream }, style]} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 60 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
  ) : (
    <View style={[{ flex: 1, backgroundColor: colors.cream, padding: spacing.lg, paddingBottom: insets.bottom + 20 }, style]}>{children}</View>
  );
};

const hs = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
    backgroundColor: '#FAF7F0',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D6',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE4D6', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 19, fontFamily: serif, fontWeight: '700', textAlign: 'center' },
  sub: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 2 },
});
const bs = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 100, ...shadow },
  btnText: { color: colors.onGold, fontSize: 15, fontWeight: '800' },
  outline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 100, borderWidth: 1.5, borderColor: colors.maroon, backgroundColor: '#fff' },
  outlineText: { color: colors.maroon, fontSize: 15, fontWeight: '800' },
});
const fs = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.maroon, marginBottom: 6 },
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, minHeight: 52 },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 },
});
const cs = StyleSheet.create({ card: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow } });

