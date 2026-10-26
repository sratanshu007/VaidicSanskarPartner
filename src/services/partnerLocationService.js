import * as Location from 'expo-location';
import axios from 'axios';
import api from './api';

const MAPPLS_REST_KEY =
  process.env.EXPO_PUBLIC_MAPPLS_REST_KEY || '9a2b6c7bdda0afa47a7fbebfa3608e90';

/**
 * Reverse Geocode coordinates using official Mappls REST API
 */
export async function reverseGeocodePandit(lat, lng) {
  if (MAPPLS_REST_KEY) {
    try {
      const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_REST_KEY}/rev_geocode?lat=${lat}&lng=${lng}`;
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data?.responseCode === 200 && res.data?.results?.[0]) {
        const item = res.data.results[0];
        return {
          formattedAddress:
            item.formatted_address ||
            `${item.subLocality || item.locality || ''}, ${item.city || item.district || ''}`,
          city: item.city || item.district || '',
          state: item.state || '',
          locality: item.locality || item.subLocality || '',
          pincode: item.pincode || '',
        };
      }
    } catch (e) {
      console.log('Mappls Pandit reverse geocode notice:', e?.message);
    }
  }

  // Fallback to Expo Native Reverse Geocoding
  try {
    const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (geo && geo.length > 0) {
      const g = geo[0];
      const parts = [g.name, g.street, g.subregion || g.district, g.city, g.region].filter(Boolean);
      return {
        formattedAddress: parts.join(', ') || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
        city: g.city || g.district || 'Live Location',
        state: g.region || '',
        locality: g.subregion || g.city || '',
        pincode: g.postalCode || '',
      };
    }
  } catch (err) {
    console.log('Expo reverse geocode notice:', err?.message);
  }

  return {
    formattedAddress: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
    city: 'Live Location',
    state: '',
    locality: '',
  };
}

/**
 * Strictly fetch Pandit's device live GPS coordinates (NO default coordinates)
 */
export async function getPanditLiveLocation() {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      console.log('Location services disabled on device');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        coords: null,
        message: 'कृपया लोकेशन अनुमति दें ताकि यजमान आपके समीप की बुकिंग भेज सकें। (GPS permission required)',
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const latitude = loc.coords.latitude;
    const longitude = loc.coords.longitude;
    const geo = await reverseGeocodePandit(latitude, longitude);

    return {
      success: true,
      coords: {
        latitude,
        longitude,
        city: geo.city || 'Live Location',
        state: geo.state || '',
        locality: geo.locality || '',
        formattedAddress: geo.formattedAddress || 'Live GPS Location',
      },
    };
  } catch (error) {
    console.log('Error getting Pandit live GPS location:', error?.message);
    // If high accuracy times out, try last known
    try {
      const fallbackLoc = await Location.getLastKnownPositionAsync();
      if (fallbackLoc?.coords) {
        const geo = await reverseGeocodePandit(
          fallbackLoc.coords.latitude,
          fallbackLoc.coords.longitude
        );
        return {
          success: true,
          coords: {
            latitude: fallbackLoc.coords.latitude,
            longitude: fallbackLoc.coords.longitude,
            city: geo.city || 'Live Location',
            state: geo.state || '',
            locality: geo.locality || '',
            formattedAddress: geo.formattedAddress || 'Live GPS Location',
          },
        };
      }
    } catch {}

    return {
      success: false,
      coords: null,
      message: error?.message || 'डिवाइस से लाइव जीपीएस लोकेशन प्राप्त नहीं हो सकी।',
    };
  }
}

/**
 * Sync Pandit's live coordinates to backend MongoDB
 */
export async function syncPanditLocationToBackend(coords) {
  if (!coords?.latitude || !coords?.longitude) return;

  try {
    // 1. Update vendor profile with live GeoJSON Point
    await api.put('vendor/profile', {
      location: {
        type: 'Point',
        coordinates: [coords.longitude, coords.latitude], // GeoJSON order: [lng, lat]
      },
      currentAddress: coords.formattedAddress,
      city: coords.city,
      isOnline: true,
      lastLocationUpdate: new Date().toISOString(),
    }).catch(() => {});

    // 2. Also try specialized location ping endpoint if present
    await api.post('vendor/location', {
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: coords.formattedAddress,
      city: coords.city,
    }).catch(() => {});
  } catch (err) {
    console.log('Sync pandit location notice:', err?.message);
  }
}
