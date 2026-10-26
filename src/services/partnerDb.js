import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PARTNER_SESSION: '@vs_partner_session',
  PARTNER_TOKEN: '@vs_partner_token',
  PARTNER_ROLE: '@vs_partner_role',
  PARTNER_PROFILE: '@vs_partner_profile',
  APP_LANGUAGE: '@vs_app_language',
  OFFLINE_CACHE_PREFIX: '@vs_cache_',
};

/**
 * Partner App Persistent Database & Storage Manager
 * Handles local session persistence, offline caching, and settings.
 */
export const partnerDb = {
  // ---- Partner Auth & Session ----
  async saveSession(vendor, token) {
    try {
      const tasks = [];
      if (vendor) {
        tasks.push(AsyncStorage.setItem(KEYS.PARTNER_SESSION, JSON.stringify(vendor)));
        if (vendor.role) {
          tasks.push(AsyncStorage.setItem(KEYS.PARTNER_ROLE, vendor.role));
        }
      }
      if (token) {
        tasks.push(AsyncStorage.setItem(KEYS.PARTNER_TOKEN, token));
      }
      await Promise.all(tasks);
      return true;
    } catch (e) {
      console.warn('partnerDb.saveSession error:', e.message);
      return false;
    }
  },

  async getSession() {
    try {
      const [vendorRaw, token, role] = await Promise.all([
        AsyncStorage.getItem(KEYS.PARTNER_SESSION),
        AsyncStorage.getItem(KEYS.PARTNER_TOKEN),
        AsyncStorage.getItem(KEYS.PARTNER_ROLE),
      ]);
      const vendor = vendorRaw ? JSON.parse(vendorRaw) : null;
      return { vendor, token, role };
    } catch (e) {
      console.warn('partnerDb.getSession error:', e.message);
      return { vendor: null, token: null, role: null };
    }
  },

  async clearSession() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(KEYS.PARTNER_SESSION),
        AsyncStorage.removeItem(KEYS.PARTNER_TOKEN),
        AsyncStorage.removeItem(KEYS.PARTNER_ROLE),
        AsyncStorage.removeItem(KEYS.PARTNER_PROFILE),
      ]);
      return true;
    } catch (e) {
      console.warn('partnerDb.clearSession error:', e.message);
      return false;
    }
  },

  // ---- Profile Details ----
  async updateProfile(patch) {
    try {
      const { vendor } = await this.getSession();
      const updated = { ...(vendor || {}), ...patch };
      await AsyncStorage.setItem(KEYS.PARTNER_SESSION, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('partnerDb.updateProfile error:', e.message);
      return null;
    }
  },

  // ---- Language Preference ----
  async saveLanguage(lang) {
    try {
      await AsyncStorage.setItem(KEYS.APP_LANGUAGE, lang);
      return true;
    } catch (e) {
      console.warn('partnerDb.saveLanguage error:', e.message);
      return false;
    }
  },

  async getLanguage() {
    try {
      const lang = await AsyncStorage.getItem(KEYS.APP_LANGUAGE);
      return lang || 'en'; // default english
    } catch (e) {
      return 'en';
    }
  },

  // ---- Offline Data Cache (Slots, Earnings, Jobs) ----
  async setCache(key, data) {
    try {
      await AsyncStorage.setItem(KEYS.OFFLINE_CACHE_PREFIX + key, JSON.stringify({
        data,
        cachedAt: Date.now(),
      }));
      return true;
    } catch (e) {
      return false;
    }
  },

  async getCache(key, maxAgeMs = 3600000) {
    try {
      const raw = await AsyncStorage.getItem(KEYS.OFFLINE_CACHE_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.cachedAt > maxAgeMs) {
        return null; // expired
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  },
};

export default partnerDb;
