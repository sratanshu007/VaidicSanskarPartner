import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { usePartner } from '../../context/PartnerContext';
import { useElapsed, fmtClock } from '../../services/hooks';
import AgoraCallView from '../../components/agora/AgoraCallView';
import socket from '../../services/socket';

/**
 * Astrologer In-Call Overlay — Powered by Agora RTC Engine
 * Live real-time Audio & Video consultation with accrued earnings ledger.
 */
const COMMISSION = 0.15; // 15% platform commission, 85% astrologer earning

export default function InCallScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const caller = route.params?.caller || { name: 'Devotee / Customer', mode: 'video', rate: 5 };
  const channelName = useRef(route.params?.channelName || `vartalap_room_${Date.now().toString().slice(-6)}`).current;
  const { addEarning } = usePartner();
  const sec = useElapsed(true);

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoCamOff, setIsVideoCamOff] = useState(caller.mode === 'audio');
  const [isFrontCam, setIsFrontCam] = useState(true);

  const mins = Math.max(1, Math.ceil(sec / 60));
  const rate = Number(caller.rate || 5);
  const gross = mins * rate;
  const net = Math.round(gross * (1 - COMMISSION));

  useEffect(() => {
    // Notify caller that astrologer connected
    socket.emit('astro:call:accept', {
      channelName,
      callerId: caller.id || 'U101',
      vendorId: 'V4569',
    });

    const handleRemoteEnd = () => {
      end(false);
    };

    socket.on('astro:call:ended', handleRemoteEnd);

    return () => {
      socket.off('astro:call:ended', handleRemoteEnd);
    };
  }, []);

  const end = (notifyRemote = true) => {
    if (notifyRemote) {
      socket.emit('astro:call:end', {
        channelName,
        recipientId: caller.id || 'U101',
      });
    }
    addEarning(Math.round(net), `Vartalap ${caller.mode} (${mins} min)`);
    Alert.alert('Consultation Completed 🙏', `Total Time: ${mins} mins\nNet Earnings: ₹${net} credited to your wallet.`);
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#1F0C2C', '#3D1554']}
      style={[
        s.c,
        {
          paddingTop: Math.max(insets.top, 24) + 8,
          paddingBottom: Math.max(insets.bottom, 20) + 10,
        },
      ]}
    >
      {/* Top Bar: Floating Duration + Accrued Earnings Meter */}
      <View style={s.overlay}>
        <View style={s.oItem}>
          <MaterialCommunityIcons name="timer-outline" size={16} color="#fff" />
          <Text style={s.oText}>{fmtClock(sec)}</Text>
        </View>
        <View style={s.oDiv} />
        <View style={s.oItem}>
          <MaterialCommunityIcons name="cash" size={16} color="#9CF7C0" />
          <Text style={[s.oText, { color: '#9CF7C0' }]}>₹{net} earned</Text>
        </View>
      </View>

      {/* Main Agora RTC Video / Audio Consultation Center Canvas */}
      <View style={s.center}>
        <AgoraCallView
          channelName={channelName}
          mode={caller.mode || 'video'}
          isMuted={isMuted}
          isSpeaker={isSpeaker}
          isVideoCamOff={isVideoCamOff}
          isFrontCam={isFrontCam}
          remoteName={caller.name}
          role="vendor"
          onCallEnded={() => end(false)}
        />
      </View>

      {/* Bottom Floating Control Bar */}
      <View style={s.ctrls}>
        {/* Mute Microphone */}
        <TouchableOpacity
          style={[s.ctrl, isMuted && s.ctrlActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Speakerphone */}
        <TouchableOpacity
          style={[s.ctrl, isSpeaker && s.ctrlActive]}
          onPress={() => setIsSpeaker(!isSpeaker)}
        >
          <MaterialCommunityIcons
            name={isSpeaker ? 'volume-high' : 'volume-medium'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity style={s.hang} onPress={() => end(true)}>
          <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Video Camera Toggle */}
        {caller.mode === 'video' && (
          <>
            <TouchableOpacity
              style={[s.ctrl, isVideoCamOff && s.ctrlActive]}
              onPress={() => setIsVideoCamOff(!isVideoCamOff)}
            >
              <MaterialCommunityIcons
                name={isVideoCamOff ? 'video-off' : 'video'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.ctrl}
              onPress={() => setIsFrontCam(!isFrontCam)}
            >
              <MaterialCommunityIcons name="camera-flip" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, position: 'relative' },
  overlay: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 10, 30, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    zIndex: 99,
    borderWidth: 1,
    borderColor: 'rgba(230, 126, 0, 0.35)',
    marginBottom: 10,
  },
  oItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  oText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  oDiv: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 14 },
  center: { flex: 1, width: '100%', overflow: 'hidden' },
  ctrls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 10,
    zIndex: 99,
  },
  ctrl: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hang: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.4)',
  },
});
