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
import * as Location from 'expo-location';
import colors from '../../theme/colors';
import styles, { serif, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import panditBookingStore from '../../services/panditBookingStore';
import socket from '../../services/socket';
import api from '../../services/api';
import {
  startPanditLocationWatch,
  getPanditLiveLocation,
  syncPanditLocationToBackend,
} from '../../services/partnerLocationService';

// Haversine formula for distance calculation in kilometers
function calcDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 1.5;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function EnRouteScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(
    () => panditBookingStore.getBooking() || route.params?.job || {}
  );

  const initialStarted =
    String(booking?.status || '').toUpperCase() === 'ON_THE_WAY' ||
    String(booking?.status || '').toUpperCase() === 'EN_ROUTE';
  const [isJourneyStarted, setIsJourneyStarted] = useState(initialStarted);
  const [distanceKm, setDistanceKm] = useState(1.8);
  const [etaMinutes, setEtaMinutes] = useState(8);
  const [isSharingLocation, setIsSharingLocation] = useState(true);

  const watchSubRef = useRef(null);
  const lastBackendSyncTimeRef = useRef(0);

  const bId = booking?.id || booking?.bookingId || 'BK' + Date.now();
  const poojaName = booking?.pooja?.name || booking?.name || 'वैदिक पूजा';
  const yajmanName = booking?.yajmanName || 'यजमान';
  const address = booking?.address || booking?.serviceAddress || 'यजमान स्थान (Live GPS)';
  const landmark = booking?.landmark || '';

  // Yajman target coordinates (default to Noida center if not yet geocoded)
  const destLat = Number(booking?.latitude) || 28.5355;
  const destLng = Number(booking?.longitude) || 77.3910;

  const handleStartJourney = () => {
    setIsJourneyStarted(true);
    socket?.emit?.('booking:en_route', { bookingId: bId });
    socket?.emit?.('instant:update', { id: bId, bookingId: bId, status: 'ON_THE_WAY' });
    api.post(`bookings/${bId}/start-journey`).catch(() => {});
  };

  const emitRealLocation = (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const dist = calcDistance(lat, lng, destLat, destLng);
    // Average urban speed ~20 km/h -> ~3 minutes per km
    const eta = Math.max(1, Math.round(dist * 3.5));

    setDistanceKm(dist);
    setEtaMinutes(eta);

    if (isSharingLocation) {
      const locPayload = {
        bookingId: bId,
        vendorId: booking?.pandit?.id || 'PND-ACTIVE',
        latitude: lat,
        longitude: lng,
        vendorLatitude: lat,
        vendorLongitude: lng,
        distanceKm: dist,
        etaMinutes: eta,
        lastUpdated: new Date().toISOString(),
      };

      // Broadcast real-time GPS stream to devotee across all channels
      socket?.emit?.('vendor:location', locPayload);
      socket?.emit?.('tracking:update', locPayload);
      socket?.emit?.('booking:location', locPayload);

      // Throttled sync to backend database (every 12 seconds)
      const now = Date.now();
      if (now - lastBackendSyncTimeRef.current > 12000) {
        lastBackendSyncTimeRef.current = now;
        syncPanditLocationToBackend({
          latitude: lat,
          longitude: lng,
          formattedAddress: 'Live En Route',
          city: 'Live GPS',
        });
      }
    }
  };

  // Hardware GPS Tracking (runs ONLY when journey has officially started)
  useEffect(() => {
    socket?.join?.(bId);

    // Reactive cancellation listener: automatically handles Yajman cancelling booking
    const handleCancelled = (data) => {
      const cancelId = data?.bookingId || data?.id;
      if (cancelId && bId && String(cancelId) !== String(bId)) {
        return; // Event for a different booking
      }

      // 1. Remove active GPS location watch subscription
      if (watchSubRef.current) {
        watchSubRef.current.remove();
        watchSubRef.current = null;
      }

      // 2. Reset pandit booking store
      panditBookingStore.reset();

      // 3. Alert Pandit & redirect directly to Home (Main)
      Alert.alert(
        '⚠️ पूजा रद्द (Cancelled)',
        'यजमान द्वारा यह पूजा बुकिंग रद्द कर दी गई है।',
        [
          {
            text: 'होम पर जाएं',
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }),
          },
        ],
        { cancelable: false }
      );

      // Instant programmatic navigation fallback
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 2000);
    };

    const unsubC1 = socket?.on?.('booking:cancelled', handleCancelled);
    const unsubC2 = socket?.on?.('booking:cancel', handleCancelled);
    const unsubC3 = socket?.on?.('job:cancel', handleCancelled);
    const unsubC4 = socket?.on?.('instant:cancel', handleCancelled);
    const unsubC5 = socket?.on?.('instant:update', (data) => {
      if (data && String(data.status).toUpperCase() === 'CANCELLED') {
        handleCancelled(data);
      }
    });

    if (!isJourneyStarted) {
      return () => {
        if (typeof unsubC1 === 'function') unsubC1();
        if (typeof unsubC2 === 'function') unsubC2();
        if (typeof unsubC3 === 'function') unsubC3();
        if (typeof unsubC4 === 'function') unsubC4();
        if (typeof unsubC5 === 'function') unsubC5();
      };
    }

    socket?.emit?.('booking:en_route', { bookingId: bId });
    socket?.emit?.('instant:update', { id: bId, bookingId: bId, status: 'ON_THE_WAY' });
    api.post(`bookings/${bId}/start-journey`).catch(() => {});

    // 1. Fetch initial location immediately
    getPanditLiveLocation().then((res) => {
      if (res?.coords) {
        emitRealLocation(res.coords.latitude, res.coords.longitude);
      }
    });

    // 2. Start hardware GPS watch subscription
    let isSubscribed = true;
    startPanditLocationWatch(
      (loc) => {
        if (isSubscribed) {
          emitRealLocation(loc.latitude, loc.longitude);
        }
      },
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 4000,
        distanceInterval: 10,
      }
    ).then((sub) => {
      if (isSubscribed) {
        watchSubRef.current = sub;
      } else if (sub) {
        sub.remove();
      }
    });

    return () => {
      isSubscribed = false;
      if (watchSubRef.current) {
        watchSubRef.current.remove();
        watchSubRef.current = null;
      }
      if (typeof unsubC1 === 'function') unsubC1();
      if (typeof unsubC2 === 'function') unsubC2();
      if (typeof unsubC3 === 'function') unsubC3();
      if (typeof unsubC4 === 'function') unsubC4();
      if (typeof unsubC5 === 'function') unsubC5();
    };
  }, [bId, isJourneyStarted, isSharingLocation]);

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

  // Live In-App Chat with Devotee
  const handleChat = () => {
    navigation.navigate('Chat', {
      bookingId: bId,
      id: bId,
      jobId: bId,
      name: yajmanName,
      yajmanName,
      poojaName,
      job: booking,
    });
  };

  // Step: Pandit clicks "I Have Arrived"
  const handleArrived = () => {
    // 1. Clean up active GPS watch subscription
    if (watchSubRef.current) {
      watchSubRef.current.remove();
      watchSubRef.current = null;
    }

    // 2. Update store
    panditBookingStore.setArrived(120);

    // 3. Notify socket & REST across all channels
    socket?.emit?.('booking:arrived', { bookingId: bId, startOtp: booking?.startOtp });
    socket?.emit?.('instant:update', { id: bId, bookingId: bId, status: 'ARRIVED' });
    api.put(`instant/${bId}/arrived`).catch(() => {});

    // 4. Move directly to Start OTP screen
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
            <View style={[s.statusPill, !isJourneyStarted && { backgroundColor: 'rgba(212, 139, 40, 0.3)' }]}>
              <View style={[s.liveDot, !isJourneyStarted && { backgroundColor: '#D48B28' }]} />
              <Text style={s.statusPillText}>
                {isJourneyStarted ? 'यात्रा जारी है (EN ROUTE)' : 'प्रस्थान की तैयारी (READY)'}
              </Text>
            </View>
            {isJourneyStarted ? (
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
            ) : null}
          </View>

          {isJourneyStarted ? (
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
          ) : (
            <View style={{ marginVertical: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFF', fontFamily: serif }}>
                {poojaName}
              </Text>
              <Text style={{ fontSize: 13, color: '#EDE4DA', marginTop: 4 }}>
                यजमान: {yajmanName} • निर्धारित समय: {booking?.scheduledAt || booking?.scheduledTime || 'आज'}
              </Text>
            </View>
          )}

          <Text style={s.heroNotice}>
            {isJourneyStarted
              ? 'लाइव जीपीएस सिग्नल यजमान की ऐप पर निरंतर अपडेट हो रहा है।'
              : 'यजमान के घर प्रस्थान करते समय नीचे "यात्रा प्रारंभ करें" दबाएं।'}
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
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={s.devoteeName}>{yajmanName}</Text>
              <Text style={s.devoteeSub}>{poojaName}</Text>
            </View>

            <View style={s.contactActionsCol}>
              <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.85}>
                <Ionicons name="call" size={15} color="#FFFFFF" />
                <Text style={s.callBtnText}>सुरक्षित कॉल</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.chatBtn} onPress={handleChat} activeOpacity={0.85}>
                <MaterialCommunityIcons name="message-text-outline" size={15} color="#67101F" />
                <Text style={s.chatBtnText}>यजमान से चैट</Text>
              </TouchableOpacity>
            </View>
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
        {!isJourneyStarted ? (
          <TouchableOpacity
            activeOpacity={0.88}
            style={s.arrivedBtn}
            onPress={handleStartJourney}
          >
            <LinearGradient colors={['#F7C966', '#D48B28']} style={s.arrivedBtnGrad}>
              <MaterialCommunityIcons name="moped" size={24} color="#2E1418" />
              <Text style={[s.arrivedBtnText, { color: '#2E1418' }]}>
                यात्रा प्रारंभ करें (Start Journey)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
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
        )}
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
  contactActionsCol: {
    gap: 8,
    minWidth: 124,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    ...shadow,
  },
  callBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5EE',
    borderWidth: 1.2,
    borderColor: '#D48B28',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  chatBtnText: { color: '#67101F', fontSize: 12, fontWeight: '800', marginLeft: 6 },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  checkText: { fontSize: 13, color: colors.text, marginLeft: 8 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDE4DA', ...shadow },
  arrivedBtn: { borderRadius: 16, overflow: 'hidden', ...shadow },
  arrivedBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  arrivedBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginLeft: 8 },
});
