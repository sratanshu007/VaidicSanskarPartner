import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import styles, { serif, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import panditBookingStore from '../../services/panditBookingStore';
import socket from '../../services/socket';
import api from '../../services/api';

export default function EnRouteScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(
    () => panditBookingStore.getBooking() || route.params?.job || {}
  );

  const [distanceKm, setDistanceKm] = useState(1.8);
  const [etaMinutes, setEtaMinutes] = useState(8);
  const [isSharingLocation, setIsSharingLocation] = useState(true);

  const bId = booking?.id || booking?.bookingId || 'BK' + Date.now();
  const poojaName = booking?.pooja?.name || booking?.name || 'वैदिक पूजा';
  const yajmanName = booking?.yajmanName || 'यजमान';
  const address = booking?.address || booking?.serviceAddress || 'यजमान स्थान (Live GPS)';
  const landmark = booking?.landmark || '';

  // Periodic GPS simulation broadcasting
  useEffect(() => {
    socket?.join?.(bId);
    socket?.emit?.('booking:en_route', { bookingId: bId });
    socket?.emit?.('instant:update', { id: bId, bookingId: bId, status: 'ON_THE_WAY' });

    const interval = setInterval(() => {
      setDistanceKm((prev) => {
        const next = Math.max(0.1, Number((prev - 0.2).toFixed(1)));
        const nextEta = Math.max(1, Math.round(next * 4));
        setEtaMinutes(nextEta);

        // Emit real-time GPS stream to devotee across all channels
        if (isSharingLocation) {
          const locPayload = {
            bookingId: bId,
            latitude: 26.4499 + (0.01 * next),
            longitude: 80.3319 + (0.01 * next),
            vendorLatitude: 26.4499 + (0.01 * next),
            vendorLongitude: 80.3319 + (0.01 * next),
            distanceKm: next,
            etaMinutes: nextEta,
          };
          socket?.emit?.('vendor:location', locPayload);
          socket?.emit?.('tracking:update', locPayload);
          socket?.emit?.('booking:location', locPayload);
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [bId, isSharingLocation]);

  // Open Native Navigation (Apple Maps / Google Maps)
  const openMaps = () => {
    const query = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  // Safe Masked Call
  const handleCall = () => {
    Alert.alert(
      'सुरक्षित वर्चुअल कॉलिंग (Masked Call)',
      'वर्चुअल नंबर: +91 11 4084 4892\n\nयजमान व पंडित जी दोनों का व्यक्तिगत नंबर 100% सुरक्षित और छुपा हुआ है।',
      [
        { text: 'रद्द करें', style: 'cancel' },
        { text: 'कॉल मिलाएं', onPress: () => Linking.openURL('tel:+911140844892') },
      ]
    );
  };

  // Step: Pandit clicks "I Have Arrived"
  const handleArrived = () => {
    // 1. Update store
    panditBookingStore.setArrived(120);

    // 2. Notify socket & REST across all channels
    socket?.emit?.('booking:arrived', { bookingId: bId, startOtp: booking?.startOtp });
    socket?.emit?.('instant:update', { id: bId, bookingId: bId, status: 'ARRIVED' });
    api.put(`instant/${bId}/arrived`).catch(() => {});

    // 3. Move directly to Start OTP screen
    navigation.replace('StartOtp', { job: booking });
  };

  return (
    <SafeAreaView style={s.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <Header title="यजमान की ओर प्रस्थान" subtitle="चरण 1: नेविगेशन व आगमन" navigation={navigation} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* EN ROUTE HERO BANNER */}
        <LinearGradient colors={['#67101F', '#490B15']} style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={s.statusPill}>
              <View style={s.liveDot} />
              <Text style={s.statusPillText}>यात्रा जारी है (EN ROUTE)</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsSharingLocation(!isSharingLocation)}
              style={s.gpsToggle}
            >
              <Ionicons
                name={isSharingLocation ? 'navigate-circle' : 'navigate-circle-outline'}
                size={18}
                color={isSharingLocation ? '#4ADE80' : '#EDE4DA'}
              />
              <Text style={s.gpsToggleText}>{isSharingLocation ? 'GPS लाइव' : 'GPS रुका'}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.metricRow}>
            <View style={s.metricItem}>
              <Text style={s.metricVal}>{distanceKm} किमी</Text>
              <Text style={s.metricLabel}>शेष दूरी</Text>
            </View>
            <View style={s.metricDivider} />
            <View style={s.metricItem}>
              <Text style={s.metricVal}>~{etaMinutes} मिनट</Text>
              <Text style={s.metricLabel}>अनुमानित समय (ETA)</Text>
            </View>
          </View>

          <Text style={s.heroNotice}>
            लाइव जीपीएस सिग्नल यजमान की ऐप पर निरंतर अपडेट हो रहा है।
          </Text>
        </LinearGradient>

        {/* YAJMAN & ADDRESS DETAILS (UNLOCKED) */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <MaterialCommunityIcons name="home-map-marker" size={24} color={colors.primary} />
            <Text style={s.cardTitle}>यजमान का संपूर्ण पता (Address)</Text>
          </View>

          <View style={s.addressBox}>
            <Text style={s.addressText}>{address}</Text>
            {landmark ? (
              <View style={s.landmarkRow}>
                <Ionicons name="location-outline" size={16} color={colors.gold} />
                <Text style={s.landmarkText}>लैंडमार्क: {landmark}</Text>
              </View>
            ) : null}
          </View>

          {/* OPEN NAVIGATION BUTTON */}
          <TouchableOpacity activeOpacity={0.85} style={s.mapsBtn} onPress={openMaps}>
            <LinearGradient colors={['#F7C966', '#D48B28']} style={s.mapsBtnGrad}>
              <Ionicons name="navigate" size={18} color="#2E1418" />
              <Text style={s.mapsBtnText}>Google Maps में दिशा-निर्देश देखें</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* DEVOTEE CONTACT BAR */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <MaterialCommunityIcons name="account-tie" size={24} color={colors.primary} />
            <Text style={s.cardTitle}>यजमान संपर्क</Text>
          </View>

          <View style={s.devoteeRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.devoteeName}>{yajmanName}</Text>
              <Text style={s.devoteeSub}>{poojaName}</Text>
            </View>

            <TouchableOpacity style={s.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={s.callBtnText}>सुरक्षित कॉल</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PRE-ARRIVAL CHECKLIST */}
        <View style={s.card}>
          <Text style={s.cardTitle}>पूजा पूर्व सामग्री स्मरण सूची</Text>
          <View style={s.checkItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={s.checkText}>शुद्ध गंगाजल, पंचामृत एवं तुलसी दल</Text>
          </View>
          <View style={s.checkItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={s.checkText}>रोली, अक्षत, कलावा, जनेऊ व कलश</Text>
          </View>
          <View style={s.checkItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={s.checkText}>हवन सामग्री, काष्ठ एवं शुद्ध देशी घी</Text>
          </View>
        </View>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={s.arrivedBtn}
          onPress={handleArrived}
        >
          <LinearGradient colors={['#1E8E4A', '#137338']} style={s.arrivedBtnGrad}>
            <MaterialCommunityIcons name="map-marker-check" size={24} color="#FFFFFF" />
            <Text style={s.arrivedBtnText}>स्थान पर पहुँच गया हूँ (I Have Arrived)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF8F2' },
  content: { padding: 18 },
  heroCard: { borderRadius: 20, padding: 18, marginBottom: 16, ...shadow },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 6 },
  statusPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  gpsToggle: { flexDirection: 'row', alignItems: 'center' },
  gpsToggleText: { color: '#F4D8DE', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 18 },
  metricItem: { alignItems: 'center' },
  metricVal: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  metricLabel: { fontSize: 12, color: '#F4D8DE', marginTop: 2 },
  metricDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroNotice: { fontSize: 11, color: '#F4D8DE', textAlign: 'center', fontStyle: 'italic' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE4DA', marginBottom: 14, ...shadow },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.maroon, fontFamily: serif, marginLeft: 8 },
  addressBox: { backgroundColor: '#FAF5EE', padding: 12, borderRadius: 12, marginBottom: 12 },
  addressText: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20 },
  landmarkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  landmarkText: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  mapsBtn: { borderRadius: 12, overflow: 'hidden', ...shadow },
  mapsBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  mapsBtnText: { color: '#2E1418', fontWeight: '800', fontSize: 13, marginLeft: 8 },
  devoteeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  devoteeName: { fontSize: 15, fontWeight: '800', color: colors.text },
  devoteeSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  callBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  checkText: { fontSize: 13, color: colors.text, marginLeft: 8 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDE4DA', ...shadow },
  arrivedBtn: { borderRadius: 16, overflow: 'hidden', ...shadow },
  arrivedBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  arrivedBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginLeft: 8 },
});
