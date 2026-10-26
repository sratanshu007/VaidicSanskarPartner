import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import * as Location from 'expo-location';
import { usePartner } from '../../context/PartnerContext';
import panditBookingStore from '../../services/panditBookingStore';
import socket from '../../services/socket';
import { getPanditLiveLocation } from '../../services/partnerLocationService';
import colors from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Try importing react-native-maps safely
let MapView = null;
let Marker = null;
let Polyline = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps.MapView;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
} catch (e) {
  console.log('react-native-maps native load notice:', e?.message);
}

// Distance helper (Haversine formula in km)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
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

export default function LiveLocationTrackingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { bookings, vendor } = usePartner();

  // Booking data resolution
  const bookingId = route?.params?.bookingId;
  const storeBooking = panditBookingStore.getBooking();
  const contextBooking = bookings.find((b) => b.id === bookingId || b._id === bookingId);
  const booking = route?.params?.booking || storeBooking || contextBooking || bookings[0] || {};

  // Partner live GPS state
  const [partnerCoords, setPartnerCoords] = useState({
    latitude: 28.5355,
    longitude: 77.391,
  });
  const [gpsReady, setGpsReady] = useState(false);

  // Devotee exact destination location (from booking or default to Sector 62 Noida)
  const devoteeCoords = {
    latitude: booking?.coords?.latitude || booking?.lat || 28.628,
    longitude: booking?.coords?.longitude || booking?.lng || 77.3649,
  };

  // Status lifecycle
  const [status, setStatus] = useState(booking?.status || 'ACCEPTED');
  const [distanceKm, setDistanceKm] = useState(2.4);
  const [etaMin, setEtaMin] = useState(8);

  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for live tracking indicator
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Subscribe to live GPS coordinates and watch position
  useEffect(() => {
    let watcher = null;

    (async () => {
      try {
        const live = await getPanditLiveLocation();
        if (live?.success && live.coords) {
          const coords = {
            latitude: live.coords.latitude,
            longitude: live.coords.longitude,
          };
          setPartnerCoords(coords);
          setGpsReady(true);

          const d = calculateDistanceKm(
            coords.latitude,
            coords.longitude,
            devoteeCoords.latitude,
            devoteeCoords.longitude
          );
          setDistanceKm(d);
          setEtaMin(Math.max(3, Math.round(d * 3.5)));
        }

        // Watch device movement
        const { status: permStatus } = await Location.getForegroundPermissionsAsync();
        if (permStatus === 'granted') {
          watcher = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 4000,
              distanceInterval: 10,
            },
            (newLoc) => {
              const updated = {
                latitude: newLoc.coords.latitude,
                longitude: newLoc.coords.longitude,
              };
              setPartnerCoords(updated);
              const d = calculateDistanceKm(
                updated.latitude,
                updated.longitude,
                devoteeCoords.latitude,
                devoteeCoords.longitude
              );
              setDistanceKm(d);
              setEtaMin(Math.max(2, Math.round(d * 3.5)));

              // Broadcast live position to user app
              if (booking?.id) {
                socket.emit('vendor:location', {
                  bookingId: booking.id,
                  latitude: updated.latitude,
                  longitude: updated.longitude,
                  distanceKm: d,
                  etaMinutes: Math.max(2, Math.round(d * 3.5)),
                  status,
                });
                socket.emit('tracking:update', {
                  bookingId: booking.id,
                  latitude: updated.latitude,
                  longitude: updated.longitude,
                  status,
                });
              }
            }
          );
        }
      } catch (err) {
        console.log('Live tracking watcher note:', err?.message);
      }
    })();

    // Subscribe to store updates
    const unsub = panditBookingStore.subscribe((b) => {
      if (b?.status) setStatus(b.status);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      if (typeof watcher?.remove === 'function') watcher.remove();
    };
  }, [booking?.id, status]);

  // Recenter map
  const handleRecenter = () => {
    if (mapRef.current?.fitToCoordinates) {
      mapRef.current.fitToCoordinates([partnerCoords, devoteeCoords], {
        edgePadding: { top: 90, right: 60, bottom: 260, left: 60 },
        animated: true,
      });
    }
  };

  // Launch native turn-by-turn navigation in Google Maps / Apple Maps
  const handleOpenTurnByTurnNavigation = () => {
    const destLat = devoteeCoords.latitude;
    const destLng = devoteeCoords.longitude;
    const destLabel = encodeURIComponent(booking?.address || booking?.area || 'Yajman Location');

    const url = Platform.select({
      ios: `maps://app?daddr=${destLat},${destLng}&dirflg=d`,
      android: `google.navigation:q=${destLat},${destLng}&mode=d`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_id=${destLabel}`
          );
        }
      })
      .catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`
        );
      });
  };

  // Call devotee
  const handleCall = () => {
    const phone =
      booking?.customer?.phone || booking?.phone || booking?.yajmanPhone || '+91 98765 43210';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Calling Devotee', `Connecting call to: ${phone}`);
    });
  };

  // Step 1: Start Journey / On the way
  const handleStartJourney = () => {
    panditBookingStore.setOnTheWay();
    setStatus('ON_THE_WAY');

    socket.emit('vendor:location', {
      bookingId: booking.id,
      latitude: partnerCoords.latitude,
      longitude: partnerCoords.longitude,
      distanceKm,
      etaMinutes: etaMin,
      status: 'ON_THE_WAY',
    });
    socket.emit('instant:update', {
      id: booking.id,
      requestId: booking.id,
      status: 'ON_THE_WAY',
      assignedVendor: vendor || { name: 'Verified Pandit' },
    });

    Alert.alert(
      'यात्रा प्रारंभ!',
      'यजमान को सूचना भेज दी गई है कि आप पूजा स्थल के लिए निकल चुके हैं।'
    );
  };

  // Step 2: Mark Arrived
  const handleMarkArrived = () => {
    panditBookingStore.setArrived(100);
    setStatus('ARRIVED');

    socket.emit('booking:arrived', { bookingId: booking.id });
    socket.emit('instant:update', {
      id: booking.id,
      requestId: booking.id,
      status: 'ARRIVED',
    });

    Alert.alert(
      'पहुँच गए!',
      'आप यजमान के द्वार पर पहुँच चुके हैं। कृपया यजमान से Start OTP लेकर पूजा आरंभ करें।'
    );
  };

  const devoteeName =
    booking?.yajmanName || booking?.customer?.name || booking?.userName || 'यजमान';
  const poojaTitle =
    booking?.pooja?.name || booking?.title || booking?.poojaName || 'वैदिक पूजा';
  const fullAddress =
    booking?.address || 'यजमान स्थान (Live Location)';
  const landmark = booking?.landmark || '';
  const sankalp = booking?.sankalpName || `${devoteeName} एवं सपरिवार`;
  const gotra = booking?.gotra || 'काश्यप';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <View style={s.container}>
        {/* Top Floating Glass Header */}
        <View style={[s.headerOverlay, { top: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#2E1418" />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <View style={s.gpsBadge}>
              <Animated.View
                style={[
                  s.liveDot,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Text style={s.gpsText}>LIVE GPS TRACKING</Text>
            </View>
            <Text style={s.headerSubtitle} numberOfLines={1}>
              {poojaTitle} • {status}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleRecenter}
            style={s.recenterBtn}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#67101F" />
          </TouchableOpacity>
        </View>

        {/* FULL SCREEN INTERACTIVE MAP AREA */}
        <View style={s.fullMapContainer}>
          {MapView ? (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude: (partnerCoords.latitude + devoteeCoords.latitude) / 2,
                longitude: (partnerCoords.longitude + devoteeCoords.longitude) / 2,
                latitudeDelta:
                  Math.abs(partnerCoords.latitude - devoteeCoords.latitude) * 1.8 + 0.02,
                longitudeDelta:
                  Math.abs(partnerCoords.longitude - devoteeCoords.longitude) * 1.8 + 0.02,
              }}
              showsUserLocation={true}
              showsCompass={false}
            >
              {/* Partner Marker (Pandit) */}
              <Marker
                coordinate={partnerCoords}
                title="आप (पंडित जी)"
                description="Your live GPS position"
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={s.partnerMarkerWrap}>
                  <View style={s.partnerMarkerCircle}>
                    <MaterialCommunityIcons name="fire" size={20} color="#FFFFFF" />
                  </View>
                  <View style={s.markerLabel}>
                    <Text style={s.markerLabelText}>पंडित जी (You)</Text>
                  </View>
                </View>
              </Marker>

              {/* Devotee Marker (Yajman Location) */}
              <Marker
                coordinate={devoteeCoords}
                title={devoteeName}
                description={fullAddress}
                anchor={{ x: 0.5, y: 0.9 }}
              >
                <View style={s.devoteeMarkerWrap}>
                  <View style={s.devoteeMarkerCircle}>
                    <MaterialCommunityIcons name="home-heart" size={22} color="#FFFFFF" />
                  </View>
                  <View style={s.devoteePinTail} />
                  <View style={s.markerLabelDevotee}>
                    <Text style={s.markerLabelDevoteeText}>{devoteeName}</Text>
                  </View>
                </View>
              </Marker>

              {/* Route Polyline connecting Pandit & Devotee */}
              <Polyline
                coordinates={[
                  partnerCoords,
                  {
                    latitude: partnerCoords.latitude + (devoteeCoords.latitude - partnerCoords.latitude) * 0.45,
                    longitude: partnerCoords.longitude + (devoteeCoords.longitude - partnerCoords.longitude) * 0.35,
                  },
                  {
                    latitude: partnerCoords.latitude + (devoteeCoords.latitude - partnerCoords.latitude) * 0.75,
                    longitude: partnerCoords.longitude + (devoteeCoords.longitude - partnerCoords.longitude) * 0.85,
                  },
                  devoteeCoords,
                ]}
                strokeColor="#2563EB"
                strokeWidth={5}
                lineDashPattern={[0]}
              />
            </MapView>
          ) : (
            /* Interactive High-Fidelity Vector Radar Canvas Fallback */
            <View style={s.vectorCanvas}>
              <Svg width="100%" height="100%" viewBox="0 0 400 600">
                {/* Soft Map Ground */}
                <Rect x="0" y="0" width="400" height="600" fill="#EBF3EE" />

                {/* City Blocks & Parks */}
                <Rect x="20" y="80" width="100" height="120" rx="14" fill="#D8EDE0" />
                <Rect x="260" y="100" width="120" height="150" rx="14" fill="#D8EDE0" />
                <Rect x="30" y="320" width="140" height="180" rx="16" fill="#D8EDE0" />
                <Rect x="240" y="350" width="130" height="160" rx="16" fill="#D8EDE0" />

                {/* Major Roads Grid */}
                <Line x1="0" y1="240" x2="400" y2="240" stroke="#FFFFFF" strokeWidth="12" />
                <Line x1="0" y1="420" x2="400" y2="420" stroke="#FFFFFF" strokeWidth="10" />
                <Line x1="180" y1="0" x2="180" y2="600" stroke="#FFFFFF" strokeWidth="14" />
                <Line x1="310" y1="0" x2="310" y2="600" stroke="#FFFFFF" strokeWidth="10" />

                {/* Route Path from Partner (bottom-left) to Devotee (top-right) */}
                <Path
                  d="M 120 480 L 180 480 L 180 240 L 300 240 L 300 160"
                  stroke="#2563EB"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Partner Marker (Pandit) at (120, 480) */}
                <Circle cx="120" cy="480" r="24" fill="rgba(103, 16, 31, 0.2)" />
                <Circle cx="120" cy="480" r="16" fill="#67101F" />
                <Circle cx="120" cy="480" r="7" fill="#FFFFFF" />
                <Rect x="75" y="512" width="90" height="24" rx="12" fill="#67101F" />
                <SvgText x="120" y="528" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                  आप (पंडित जी)
                </SvgText>

                {/* Devotee Marker (Yajman) at (300, 160) */}
                <Circle cx="300" cy="160" r="28" fill="rgba(220, 38, 38, 0.2)" />
                <Circle cx="300" cy="160" r="18" fill="#DC2626" />
                <Circle cx="300" cy="160" r="8" fill="#FFFFFF" />
                <Rect x="235" y="105" width="130" height="28" rx="8" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.5" />
                <SvgText x="300" y="123" textAnchor="middle" fill="#1C1917" fontSize="11" fontWeight="bold">
                  यजमान: {devoteeName}
                </SvgText>
              </Svg>
            </View>
          )}

          {/* Floating Live Navigation HUD Strip */}
          <View style={[s.hudStrip, { top: insets.top + 68 }]}>
            <View style={s.hudLeft}>
              <View style={s.hudStatItem}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color="#2563EB" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={s.hudStatVal}>{distanceKm} km</Text>
                  <Text style={s.hudStatLabel}>दूरी (Distance)</Text>
                </View>
              </View>

              <View style={s.hudDivider} />

              <View style={s.hudStatItem}>
                <MaterialCommunityIcons name="clock-fast" size={20} color="#16A34A" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[s.hudStatVal, { color: '#16A34A' }]}>{etaMin} मिनट</Text>
                  <Text style={s.hudStatLabel}>पहुँचने का समय</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenTurnByTurnNavigation}
              style={s.navigateBtn}
            >
              <MaterialCommunityIcons name="navigation" size={18} color="#FFFFFF" />
              <Text style={s.navigateBtnText}>Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTTOM DEVOTEE DETAILS & ACTION CARD */}
        <View style={[s.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          {/* Header Row: Devotee & Call */}
          <View style={s.sheetHeaderRow}>
            <View style={s.devoteeAvatar}>
              <MaterialCommunityIcons name="account" size={26} color="#67101F" />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.devoteeName}>{devoteeName}</Text>
              <Text style={s.devoteeSub}>
                गोत्र: {gotra} • {sankalp}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCall}
              style={s.roundCallBtn}
            >
              <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Address Box */}
          <View style={s.addressBox}>
            <MaterialCommunityIcons
              name="map-marker"
              size={18}
              color="#DC2626"
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.addressTitle}>{fullAddress}</Text>
              <Text style={s.addressLandmark}>लैंडमार्क: {landmark}</Text>
              {booking?.specialNote ? (
                <Text style={s.specialNote}>नोट: {booking.specialNote}</Text>
              ) : null}
            </View>
          </View>

          {/* Life-cycle Action Buttons */}
          <View style={s.actionRow}>
            {status === 'ACCEPTED' ? (
              <TouchableOpacity
                style={s.primaryActionBtn}
                activeOpacity={0.88}
                onPress={handleStartJourney}
              >
                <MaterialCommunityIcons name="bike-fast" size={20} color="#FFFFFF" />
                <Text style={s.primaryActionText}>पूजा स्थल के लिए निकलें (Start Journey)</Text>
              </TouchableOpacity>
            ) : status === 'ON_THE_WAY' ? (
              <TouchableOpacity
                style={[s.primaryActionBtn, { backgroundColor: '#15803D' }]}
                activeOpacity={0.88}
                onPress={handleMarkArrived}
              >
                <MaterialCommunityIcons name="map-marker-check" size={20} color="#FFFFFF" />
                <Text style={s.primaryActionText}>पहुँच गया दर्ज करें (Mark Arrived)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.primaryActionBtn, { backgroundColor: '#B45309' }]}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('ActiveJob', { job: booking })}
              >
                <MaterialCommunityIcons name="fire" size={20} color="#FFFFFF" />
                <Text style={s.primaryActionText}>पूजा शुरू करें (Verify Start OTP)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FBF8F2',
  },
  headerOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EAE1D5',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  gpsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E1418',
    marginTop: 2,
  },
  recenterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMapContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  vectorCanvas: {
    width: '100%',
    height: '100%',
  },
  hudStrip: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#EDE4DA',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  hudStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78716C',
  },
  hudDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E7E5E4',
    marginHorizontal: 12,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  partnerMarkerWrap: {
    alignItems: 'center',
  },
  partnerMarkerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#67101F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 6,
  },
  markerLabel: {
    backgroundColor: '#67101F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  markerLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  devoteeMarkerWrap: {
    alignItems: 'center',
  },
  devoteeMarkerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 6,
  },
  devoteePinTail: {
    width: 4,
    height: 6,
    backgroundColor: '#DC2626',
  },
  markerLabelDevotee: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DC2626',
    marginTop: 2,
  },
  markerLabelDevoteeText: {
    color: '#1C1917',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#EDE4DA',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  devoteeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FBF0E4',
    borderWidth: 1.5,
    borderColor: '#F1D9C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devoteeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E1418',
  },
  devoteeSub: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 2,
  },
  roundCallBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDE3D5',
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E1418',
    lineHeight: 18,
  },
  addressLandmark: {
    fontSize: 11.5,
    color: '#8A7577',
    marginTop: 2,
  },
  specialNote: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67101F',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
