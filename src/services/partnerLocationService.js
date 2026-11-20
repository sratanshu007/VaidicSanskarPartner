import * as Location from 'expo-location';
import axios from 'axios';
import api from './api';

const MAPPLS_REST_KEY =
  process.env.EXPO_PUBLIC_MAPPLS_REST_KEY || '9a2b6c7bdda0afa47a7fbebfa3608e90';

export const DEFAULT_PANDIT_COORDS = {
  latitude: 28.5355,
  longitude: 77.3910,
  city: 'Noida',
  state: 'Uttar Pradesh',
  formattedAddress: 'Sector 106, Noida, Uttar Pradesh',
};

/**
 * Helper to race a promise against a timeout
 */
function promiseTimeout(promise, timeoutMs, timeoutErrorMsg) {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(timeoutErrorMsg || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}

/**
 * Reverse Geocode coordinates using official Mappls REST API
 */
export async function reverseGeocodePandit(lat, lng) {
  if (lat == null || lng == null) {
    return { formattedAddress: '', city: 'Live Location', state: '', locality: '', pincode: '' };
  }

  if (MAPPLS_REST_KEY) {
    try {
      const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_REST_KEY}/rev_geocode?lat=${lat}&lng=${lng}`;
      const res = await axios.get(url, { timeout: 7000 });
      if (res.data?.responseCode === 200 && Array.isArray(res.data?.results) && res.data.results.length > 0) {
        const item = res.data.results[0];
        const locality = item.subLocality || item.locality || '';
        const city = item.city || item.district || '';
        const state = item.state || '';
        const pincode = item.pincode || '';
        return {
          formattedAddress:
            item.formatted_address || [locality, city, state, pincode].filter(Boolean).join(', '),
          city: city || 'Live Location',
          state,
          locality,
          pincode,
        };
      }
    } catch (e) {
      console.log('Mappls Pandit reverse geocode notice:', e?.message);
    }
  }

  // Fallback to Expo Native Reverse Geocoding
  try {
    const geo = await Location.reverseGeocodeAsync({ latitude: Number(lat), longitude: Number(lng) });
    if (geo && geo.length > 0) {
      const g = geo[0];
      const locality = g.subregion || g.district || g.name || '';
      const city = g.city || g.subregion || 'Live Location';
      const state = g.region || '';
      const pincode = g.postalCode || '';
      const parts = [g.name, g.street, locality, city, state].filter(Boolean);
      return {
        formattedAddress: parts.join(', ') || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
        city,
        state,
        locality,
        pincode,
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
    pincode: '',
  };
}

/**
 * Strictly fetch Pandit's device live GPS coordinates with 8-second timeout & last known fallback.
 */
export async function getPanditLiveLocation({
  highAccuracy = false,
  timeoutMs = 8000,
  maxAgeMs = 15 * 60 * 1000,
} = {}) {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        success: false,
        coords: null,
        servicesDisabled: true,
        message: 'कृपया फ़ोन की लोकेशन सेवा (GPS) चालू करें। (Location services are turned off on your device)',
      };
    }

    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        coords: null,
        permissionDenied: true,
        canAskAgain,
        message: 'कृपया लोकेशन अनुमति दें ताकि यजमान आपके समीप की बुकिंग भेज सकें। (GPS permission required)',
      };
    }

    let loc = null;
    try {
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });
      loc = await promiseTimeout(positionPromise, timeoutMs, 'Pandit GPS retrieval timed out');
    } catch (gpsError) {
      console.log('Pandit live GPS attempt failed or timed out:', gpsError?.message);
    }

    if (!loc?.coords) {
      try {
        const fallbackLoc = await Location.getLastKnownPositionAsync({ maxAge: maxAgeMs });
        if (fallbackLoc?.coords) {
          loc = fallbackLoc;
        }
      } catch (lastKnownErr) {
        console.log('Pandit last known position error:', lastKnownErr?.message);
      }
    }

    if (!loc?.coords || !Number.isFinite(loc.coords.latitude) || !Number.isFinite(loc.coords.longitude)) {
      return {
        success: false,
        coords: null,
        message: 'डिवाइस से लाइव जीपीएस लोकेशन प्राप्त नहीं हो सकी। कृपया पुनः प्रयास करें।',
      };
    }

    const latitude = Number(loc.coords.latitude);
    const longitude = Number(loc.coords.longitude);
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
    return {
      success: false,
      coords: null,
      message: error?.message || 'डिवाइस से लाइव जीपीएस लोकेशन प्राप्त नहीं हो सकी।',
    };
  }
}

/**
 * Start watching Pandit's real GPS position for live navigation / en-route tracking.
 * Returns a subscription handle that must be removed on unmount.
 */
export async function startPanditLocationWatch(onLocationUpdate, {
  accuracy = Location.Accuracy.Balanced,
  timeInterval = 4000,
  distanceInterval = 10,
} = {}) {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return null;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy,
        timeInterval,
        distanceInterval,
      },
      (location) => {
        if (location?.coords?.latitude && location?.coords?.longitude) {
          onLocationUpdate({
            latitude: Number(location.coords.latitude),
            longitude: Number(location.coords.longitude),
            accuracy: location.coords.accuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          });
        }
      }
    );

    return subscription;
  } catch (err) {
    console.log('Error starting Pandit GPS location watch:', err?.message);
    return null;
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

    // 2. Also try specialized location ping endpoint
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
