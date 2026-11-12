import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner } from '../context/PartnerContext';
import partnerAstroStore from '../services/talkToAstroStore';
import {
  broadcastAstroOnline,
  broadcastAstroOffline,
  isDirectAstroRole,
} from '../services/astroPresenceHelper';
import { serif } from '../theme/styles';

// Coordinates optional pending Astrologer activation with the mounted home screen.
let pendingAstroActivation = false;

export function setPendingAstroActivation(enabled) {
  pendingAstroActivation = Boolean(enabled);
}

export function getPendingAstroActivation() {
  return pendingAstroActivation;
}

export default function PanditAstroToggleCard({ compact = false, style }) {
  const { vendor, role, updateVendor } = usePartner();
  const isDirectAstro = isDirectAstroRole(role, vendor);
  const isEnabled = isDirectAstro || Boolean(vendor?.isAstroEnabled);

  useEffect(() => {
    if (!isDirectAstro && pendingAstroActivation) {
      pendingAstroActivation = false;
      if (!vendor?.isAstroEnabled && typeof updateVendor === 'function') {
        updateVendor({ isAstroEnabled: true });
      }
      broadcastAstroOnline(vendor, partnerAstroStore.getPresence(), partnerAstroStore.getRates());
    }
  }, [isDirectAstro, vendor, updateVendor]);

  // Direct Astrologer login always stays pure Astrology without Pandit switch clutter.
  if (isDirectAstro) return null;

  const handleToggle = (nextValue) => {
    const targetVal = typeof nextValue === 'boolean' ? nextValue : !isEnabled;
    if (typeof updateVendor === 'function') {
      updateVendor({ isAstroEnabled: targetVal });
    }
    if (targetVal) {
      broadcastAstroOnline(
        { ...vendor, isAstroEnabled: true },
        partnerAstroStore.getPresence(),
        partnerAstroStore.getRates()
      );
    } else {
      broadcastAstroOffline(vendor);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleToggle(!isEnabled)}
        style={[s.compactCard, style]}
      >
        <View style={s.compactLeft}>
          <View style={s.compactIconCircle}>
            <MaterialCommunityIcons name="star-crescent" size={18} color="#D48B28" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.compactTitle}>पंडित + ज्योतिषी दोनों सक्रिय</Text>
            <Text style={s.compactSub}>
              पूजा होम पर लौटने के लिए ज्योतिषी टॉगल ऑफ करें
            </Text>
          </View>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: '#D6C8BE', true: '#1E8E4A' }}
          thumbColor="#FFFFFF"
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => handleToggle(!isEnabled)}
      style={[s.dockedCard, style]}
    >
      <View style={s.dockedLeft}>
        <View style={s.dockedIconBox}>
          <MaterialCommunityIcons name="creation" size={22} color="#67101F" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Text style={s.dockedTitle}>Astrologer भी सक्रिय करें</Text>
            <View style={s.pillBadge}>
              <Text style={s.pillBadgeText}>Live Calls</Text>
            </View>
          </View>
          <Text style={s.dockedSub}>
            टॉगल ऑन करें और एक ही Astrologer Home Screen व कॉल्स पाएं
          </Text>
        </View>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        trackColor={{ false: '#D6C8BE', true: '#1E8E4A' }}
        thumbColor="#FFFFFF"
      />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.2,
    borderColor: '#E5B869',
    marginBottom: 12,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  compactIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#67101F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#67101F',
    fontFamily: serif,
  },
  compactSub: {
    fontSize: 11,
    color: '#7D686B',
    marginTop: 1,
  },
  dockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7EA',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D48B28',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  dockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dockedIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F6DFB8',
    borderWidth: 1,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dockedTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#67101F',
    fontFamily: serif,
  },
  pillBadge: {
    backgroundColor: '#1E8E4A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  pillBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dockedSub: {
    fontSize: 11,
    color: '#6E5A5E',
    marginTop: 2,
    lineHeight: 15,
  },
});
