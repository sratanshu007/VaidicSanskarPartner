import socket from './socket';
import partnerAstroStore from './talkToAstroStore';

/**
 * Resolves the canonical partner ID used across socket rooms and astro listings.
 */
export function resolvePartnerId(vendor, fallback = '') {
  return String(vendor?.id || vendor?._id || vendor?.phone || vendor?.email || fallback || 'partner');
}

/**
 * Checks whether the current partner has direct Astrologer base role.
 */
export function isDirectAstroRole(role, vendor) {
  return role === 'astro' || vendor?.role === 'astro';
}

/**
 * Checks whether Astrologer dashboard and live broadcasting are active.
 */
export function isAstroModeActive(role, vendor) {
  return isDirectAstroRole(role, vendor) || Boolean(vendor?.isAstroEnabled);
}

/**
 * Broadcasts online presence to the backend so devotees can reach the partner.
 */
export function broadcastAstroOnline(vendor, presenceOverride, ratesOverride) {
  const defaultId = vendor?.role === 'pandit' ? (vendor?.id || 'pandit') : (vendor?.id || 'astro');
  const partnerId = resolvePartnerId(vendor, defaultId);
  const presence = presenceOverride || partnerAstroStore.getPresence();
  const rates = ratesOverride || partnerAstroStore.getRates();
  const isAnyOnline = Boolean(presence.chatOnline || presence.audioOnline || presence.videoOnline);

  const payload = {
    id: partnerId,
    vendorId: partnerId,
    name: vendor?.name || 'VaidicSanskar Partner',
    nameHi: vendor?.name || 'वैदिक पार्टनर',
    title:
      vendor?.role === 'pandit'
        ? 'सत्यापित वैदिक पंडित व ज्योतिषाचार्य • पार्टनर लाइव'
        : 'सत्यापित वैदिक ज्योतिषाचार्य • पार्टनर लाइव',
    isOnline: isAnyOnline,
    presence,
    rates: {
      chat: rates?.chat || 5,
      audio: rates?.audio || 5,
      video: rates?.video || 5,
    },
    rating: Number(vendor?.rating || 0),
    reviewsCount: Number(vendor?.reviewsCount || 0),
    skills: vendor?.skills || [
      'Vedic Astrology',
      'Kundli Milan',
      'Prashna Kundali',
      'Muhurat',
    ],
  };

  socket?.emit?.('pandit:join', { vendorId: partnerId });
  socket?.emit?.('vendor:join', { vendorId: partnerId });
  if (isAnyOnline) {
    socket?.emit?.('astro:online', payload);
    socket?.emit?.('astro:presence', payload);
  } else {
    socket?.emit?.('astro:offline', { id: partnerId, vendorId: partnerId });
  }
  return payload;
}

/**
 * Marks the partner offline as an astrologer without dropping Pandit availability.
 */
export function broadcastAstroOffline(vendor) {
  const defaultId = vendor?.role === 'pandit' ? (vendor?.id || 'pandit') : (vendor?.id || 'astro');
  const partnerId = resolvePartnerId(vendor, defaultId);
  socket?.emit?.('astro:offline', { id: partnerId, vendorId: partnerId });
  socket?.emit?.('astro:presence', { id: partnerId, vendorId: partnerId, isOnline: false });
}
