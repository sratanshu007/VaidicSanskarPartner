import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import styles, { serif, radius, shadow } from '../theme/styles';

/**
 * Incoming Request Modal (Rapido / Ride-Hailing Style for Pandit)
 * PRD Specifications:
 * - 30-second countdown bar with urgency color shift
 * - Wave radius indicator (Wave 1: 5km, Wave 2: 10km, Wave 3: 20km)
 * - Area name only (Full address locked until acceptance for customer privacy)
 * - Pooja name, duration, Dakshina & Samagri breakdown
 * - Customer Gotra & language requirement
 * - Accept / Decline buttons (3 consecutive declines triggers offline prompt)
 */
export default function IncomingRequestModal({
  visible,
  job,
  onAccept,
  onDecline,
}) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible || !job) {
      setSecondsLeft(30);
      progressAnim.setValue(1);
      return;
    }

    setSecondsLeft(30);
    progressAnim.setValue(1);

    // Pulse animation for ringing flame icon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 30s countdown bar
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    // Countdown interval
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline?.('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pulseLoop.stop();
    };
  }, [visible, job]);

  if (!visible || !job) return null;

  const poojaName = job?.pooja?.name || job?.name || 'श्री सत्यनारायण कथा';
  const area = job?.area || job?.address || 'यजमान स्थान (Live GPS)';
  const duration = job?.pooja?.duration || '2.5 घंटे';
  const language = job?.language || 'हिंदी व संस्कृत';
  const gotra = job?.gotra || 'काश्यप';
  const dakshina = job?.dakshina || 2100;
  const netEarning = Math.round(dakshina * 0.85); // 15% platform commission
  const samagriFee = job?.withSamagri ? (job?.samagriFee || 600) : 0;
  const wave = job?.wave || 1;

  // Progress bar interpolation for color
  const progressColor = secondsLeft <= 10 ? '#DC2626' : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Top Urgency Header */}
          <View style={s.urgencyBar}>
            <View style={s.urgencyLeft}>
              <Animated.View style={[s.flameIconBox, { transform: [{ scale: pulseAnim }] }]}>
                <MaterialCommunityIcons name="fire" size={24} color="#FFF" />
              </Animated.View>
              <View style={{ marginLeft: 10 }}>
                <Text style={s.urgencyTitle}>नया पूजा अनुरोध! (Wave {wave})</Text>
                <Text style={s.urgencySub}>निकटतम उपलब्ध पंडित जी को भेजा गया</Text>
              </View>
            </View>
            <View style={[s.timerBadge, secondsLeft <= 10 && { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={16}
                color={secondsLeft <= 10 ? '#DC2626' : colors.primary}
              />
              <Text style={[s.timerText, secondsLeft <= 10 && { color: '#DC2626' }]}>
                {secondsLeft}s
              </Text>
            </View>
          </View>

          {/* Countdown Progress Line */}
          <View style={s.progressTrack}>
            <Animated.View
              style={[
                s.progressBar,
                {
                  backgroundColor: progressColor,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Main Card Content */}
          <View style={s.body}>
            {/* Pooja Title and Duration */}
            <View style={s.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.poojaTitle}>{poojaName}</Text>
                <Text style={s.poojaSub}>अवधि: {duration} · भाषा: {language}</Text>
              </View>
              <View style={s.tagBadge}>
                <Text style={s.tagBadgeText}>तत्काल बुकिंग</Text>
              </View>
            </View>

            {/* Location & Distance (Area only - Address locked for privacy) */}
            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <View style={s.iconCircle}>
                  <MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.infoLabel}>स्थान (स्थान की दूरी)</Text>
                  <Text style={s.infoValue}>{area}</Text>
                  <Text style={s.privacyNotice}>
                    🔒 पूरा पता (मकान सं., लैंडमार्क) स्वीकार करने के बाद खुलेगा
                  </Text>
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.infoRow}>
                <View style={[s.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="hands-pray" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.infoLabel}>यजमान गोत्र व संकल्प</Text>
                  <Text style={s.infoValue}>गोत्र: {gotra} · सपरिवार संकल्प</Text>
                </View>
              </View>

              {samagriFee > 0 && (
                <>
                  <View style={s.divider} />
                  <View style={s.infoRow}>
                    <View style={[s.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <MaterialCommunityIcons name="package-variant-closed" size={18} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={s.infoLabel}>सामग्री व्यवस्था</Text>
                      <Text style={[s.infoValue, { color: '#16A34A' }]}>
                        पंडित जी साथ लाएंगे (+₹{samagriFee} नकद यजमान द्वारा देय)
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Payout Breakdown Pill */}
            <View style={s.earningsCard}>
              <View style={s.earnLeft}>
                <Text style={s.earnLabel}>आपकी शुद्ध दक्षिणा (Net Earning)</Text>
                <Text style={s.earnSub}>
                  ₹{dakshina} दक्षिणा − 15% प्लेटफॉर्म कट{samagriFee > 0 ? ` + ₹${samagriFee} सामग्री` : ''}
                </Text>
              </View>
              <View style={s.earnRight}>
                <Text style={s.earningAmount}>₹{netEarning + samagriFee}</Text>
                <Text style={s.instantTag}>तुरंत बैंक ट्रांसफर</Text>
              </View>
            </View>

            {/* Action Buttons: Accept / Decline */}
            <View style={s.actions}>
              <TouchableOpacity
                style={s.declineBtn}
                activeOpacity={0.8}
                onPress={() => onDecline?.('manual')}
              >
                <MaterialCommunityIcons name="close" size={20} color="#DC2626" />
                <Text style={s.declineText}>अस्वीकार</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.acceptBtn}
                activeOpacity={0.85}
                onPress={() => onAccept?.(job)}
              >
                <MaterialCommunityIcons name="check-bold" size={22} color="#FFF" />
                <Text style={s.acceptText}>स्वीकार करें (Accept)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 10, 5, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAF7F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...shadow,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  urgencyBar: {
    backgroundColor: '#3A1208',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flameIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyTitle: {
    color: '#FFF8F0',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  urgencySub: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    gap: 4,
  },
  timerText: {
    color: colors.goldLight,
    fontWeight: '800',
    fontSize: 13,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E8DED1',
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  body: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  poojaTitle: {
    fontFamily: serif,
    fontSize: 21,
    fontWeight: '800',
    color: '#3A1208',
  },
  poojaSub: {
    fontSize: 13,
    color: '#7A6258',
    marginTop: 3,
    fontWeight: '500',
  },
  tagBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#9E8B80',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A1208',
    marginTop: 2,
  },
  privacyNotice: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 3,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EDE4',
    marginVertical: 10,
  },
  earningsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  earnLeft: {
    flex: 1,
    marginRight: 8,
  },
  earnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  earnSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  earnRight: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontFamily: serif,
    fontSize: 24,
    fontWeight: '800',
    color: '#15803D',
  },
  instantTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  declineText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#15803D',
    gap: 8,
    ...shadow,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
