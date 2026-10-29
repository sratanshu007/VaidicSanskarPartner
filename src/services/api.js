import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const expoHost =
  Constants?.expoConfig?.hostUri?.split(':')[0] ||
  Constants?.manifest2?.extra?.expoGo?.debuggerHost?.split(':')[0] ||
  Constants?.manifest?.debuggerHost?.split(':')[0];

// Your computer's Wi-Fi LAN IP fallback
const LAN_IP = '192.168.1.36';
const host = expoHost || (Platform.OS === 'android' ? (expoHost || '10.0.2.2') : (Platform.OS === 'ios' ? (expoHost || LAN_IP) : 'localhost'));

const rawEnvUrl = process.env.EXPO_PUBLIC_API_URL || 'https://vaidic-sanskar-admin-suite.onrender.com/api/partner/';

const resolveBaseUrl = () => {
  let url = rawEnvUrl.trim();
  if (!url.endsWith('/')) url += '/';
  return url;
};

export const BASE_URL = resolveBaseUrl();

const api = axios.create({ baseURL: BASE_URL, timeout: 60000, headers: { 'Content-Type': 'application/json' } });

let token = null;
export const setAuthToken = (t) => {
  token = t;
  if (t) {
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
export const getAuthToken = () => token;

api.interceptors.response.use(
  (r) => r.data,
  (e) => {
    let msg = e?.response?.data?.message || e.message || 'Something went wrong';
    if (e.message === 'Network Error' || !e?.response) {
      msg = 'Network Error: Cannot connect to server. If server was sleeping, please wait a moment and try again.';
    }
    return Promise.reject({ message: msg, status: e?.response?.status });
  }
);

export const endpoints = {
  sendOtp: 'auth/send-otp', verifyOtp: 'auth/verify-otp',
  sendEmailOtp: 'auth/send-email-otp', verifyEmailOtp: 'auth/verify-email-otp',
  registerAccount: 'auth/register-account', login: 'auth/login',
  register: 'vendor/register', completeProfile: 'vendor/complete-profile',
  uploadKyc: 'vendor/kyc/upload', profile: 'vendor/profile',
  // bookings
  bookings: 'bookings',
  // pandit
  jobAccept: 'job/accept', jobDecline: 'job/decline', jobComplete: 'job/complete',
  activeJob: 'job/active', slots: 'pandit/slots', slotBlock: 'pandit/slots/block',
  // merchant
  products: 'merchant/products', orderAdvance: 'merchant/order/advance',
  // mandali
  inquiries: 'mandali/inquiries', inquiryRespond: 'mandali/inquiry/respond', portfolio: 'mandali/portfolio',
  // astro
  statusToggle: 'astro/status', rates: 'astro/rates', sessionStart: 'astro/session/start', sessionEnd: 'astro/session/end',
  // earnings
  earnings: 'earnings', payout: 'earnings/payout', ledger: 'earnings/ledger',
};

export const BookingService = {
  list: () => api.get(endpoints.bookings),
  active: () => api.get(endpoints.activeJob),
  getById: (id) => api.get(`bookings/${id}`),
};

export const VendorService = {
  sendEmailOtp: (email, name) => api.post(endpoints.sendEmailOtp, { email, name }),
  verifyEmailOtp: (email, otp) => api.post(endpoints.verifyEmailOtp, { email, otp }),
  registerAccount: (payload) => api.post(endpoints.registerAccount, payload),
  login: (email, password) => api.post(endpoints.login, { email, password }),
  sendOtp: (phone) => api.post(endpoints.sendOtp, { phone }),
  verifyOtp: (phone, otp) => api.post(endpoints.verifyOtp, { phone, otp }),
  register: (payload) => api.post(endpoints.register, payload),
  completeProfile: (payload) => api.post(endpoints.completeProfile, payload),
  updateProfile: (payload) => api.put('vendor/profile', payload),
  checkStatus: (query) => api.get('vendor/status', { params: { query, email: query, phone: query } }),
  getProfile: (query) => api.get('vendor/profile', { params: { query, email: query, phone: query } }),
  uploadPhoto: (formData) =>
    api.post('upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadKyc: (form) =>
    api.post(endpoints.uploadKyc, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
export const JobService = {
  accept: (jobId) => api.post(endpoints.jobAccept, { job_id: jobId }),
  decline: (jobId) => api.post(endpoints.jobDecline, { job_id: jobId }),
  complete: (jobId, otp) => api.post(endpoints.jobComplete, { job_id: jobId, otp }),
};
export const SlotService = {
  list: () => api.get(endpoints.slots),
  block: (slotId, blocked) => api.post(endpoints.slotBlock, { slot_id: slotId, blocked }),
};
export const MerchantService = {
  products: () => api.get(endpoints.products),
  saveProduct: (p) => api.post(endpoints.products, p),
  advanceOrder: (id) => api.post(endpoints.orderAdvance, { order_id: id }),
};
export const MandaliService = {
  inquiries: () => api.get(endpoints.inquiries),
  respond: (id, action, extra) => api.post(endpoints.inquiryRespond, { inquiry_id: id, action, extra }),
};
export const AstroService = {
  setStatus: (online) => api.post(endpoints.statusToggle, { online }),
  setRates: (rates) => api.post(endpoints.rates, rates),
};
export const EarningsService = {
  summary: () => api.get(endpoints.earnings),
  payout: (amount) => api.post(endpoints.payout, { amount }),
};

export default api;
