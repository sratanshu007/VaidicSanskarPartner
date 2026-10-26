import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Header, Screen, GoldButton } from '../../components/ui';
import colors from '../../theme/colors';
import { serif, shadow } from '../../theme/styles';
import { useCountdown } from '../../services/hooks';

export default function OtpScreen({ navigation, route }) {
  const phone = route?.params?.phone || 'your number';
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef([]);
  const { seconds, reset, start } = useCountdown(30, {});

  const change = (v, i) => { const n = [...otp]; n[i] = v.slice(-1); setOtp(n); if (v && i < 3) inputs.current[i + 1]?.focus(); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Verify OTP" navigation={navigation} />
      <Screen>
        <Text style={s.h}>Enter OTP Code</Text>
        <Text style={s.sub}>Sent via SMS to +91 {phone}</Text>
        <View style={s.row}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => (inputs.current[i] = r)}
              style={[s.box, d ? s.boxActive : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={d}
              onChangeText={(v) => change(v, i)}
            />
          ))}
        </View>
        <GoldButton title="Verify & Continue  ›" style={{ marginTop: 32 }} onPress={() => navigation.replace('RoleSelect', { phone })} />
        <Text style={s.resend}>
          {seconds > 0 ? `Resend in 00:${String(seconds).padStart(2, '0')}` : <Text style={s.resendLink} onPress={() => { reset(30); start(); }}>Resend OTP</Text>}
        </Text>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  h: { fontFamily: serif, fontSize: 24, fontWeight: '700', color: colors.maroon },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 6, marginBottom: 26 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  box: { width: 62, height: 66, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', textAlign: 'center', fontSize: 26, fontWeight: '800', color: colors.maroon, ...shadow },
  boxActive: { borderColor: colors.gold, borderWidth: 2 },
  resend: { textAlign: 'center', marginTop: 22, color: colors.textMuted, fontSize: 13 },
  resendLink: { color: colors.primary, fontWeight: '800' },
});

