import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  VendorService,
  JobService,
  BookingService,
  SlotService,
  MandaliService,
  AstroService,
  EarningsService,
  setAuthToken,
} from '../services/api';
import partnerDb from '../services/partnerDb';
import socket from '../services/socket';

/**
 * Partner-side global state (Provider pattern).
 * Clean, live data store tailored specifically to:
 * 1. Pandit (Pooja & Rituals)
 * 2. Astrologer (Kundali & Astrology)
 * 3. Mandali (Pooja Group / Bhajan Mandali)
 * Merchant and Temple Admin roles are completely removed.
 */
const PartnerContext = createContext(null);

export const ROLES = {
  PANDIT: 'pandit',
  ASTRO: 'astro',
  MANDALI: 'mandali',
};

const DEFAULT_MANDALIS = [];

const DEFAULT_BOOKINGS = [];

const DEFAULT_POOJA_SERVICES = [
  {
    id: 'ps1',
    title: 'Satyanarayan Pooja',
    price: 2500,
    duration: '1.5 - 2 hrs',
    category: 'Pooja',
    imageType: 'satyanarayan',
  },
  {
    id: 'ps2',
    title: 'Mahamrityunjay Pooja',
    price: 3100,
    duration: '2 - 3 hrs',
    category: 'Havan',
    imageType: 'shiva',
  },
  {
    id: 'ps3',
    title: 'Ganesh Pooja',
    price: 1800,
    duration: '1 - 1.5 hrs',
    category: 'Pooja',
    imageType: 'ganesh',
  },
  {
    id: 'ps4',
    title: 'Lakshmi Pooja',
    price: 2200,
    duration: '1.5 - 2 hrs',
    category: 'Special',
    imageType: 'lakshmi',
  },
];

const DEFAULT_ASTRO_SERVICES = [
  {
    id: 'as1',
    title: 'Kundali Matching',
    price: 1100,
    subtitle: 'Marriage compatibility',
    category: 'Kundali',
  },
  {
    id: 'as2',
    title: 'Birth Chart Analysis',
    price: 901,
    subtitle: 'Life predictions & guidance',
    category: 'Kundali',
  },
  {
    id: 'as3',
    title: 'Career Guidance',
    price: 701,
    subtitle: 'Job, business & growth',
    category: 'Consultation',
  },
  {
    id: 'as4',
    title: 'Health & Wellness',
    price: 501,
    subtitle: 'Health predictions',
    category: 'Horoscope',
  },
];

const DEFAULT_NOTIFICATIONS = [];

const DEFAULT_TRANSACTIONS = [];

const DEFAULT_SLOTS = [];

export const PartnerProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null);
  const [role, setRole] = useState(ROLES.PANDIT);
  const [loadingSession, setLoadingSession] = useState(true);

  // App domain collections
  const [mandalis, setMandalis] = useState(DEFAULT_MANDALIS);
  const [currentMandali, setCurrentMandali] = useState(null);
  const [bookings, setBookings] = useState(DEFAULT_BOOKINGS);
  const [poojaServices, setPoojaServices] = useState(DEFAULT_POOJA_SERVICES);
  const [astroServices, setAstroServices] = useState(DEFAULT_ASTRO_SERVICES);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [transactions, setTransactions] = useState(DEFAULT_TRANSACTIONS);
  const [walletBalance, setWalletBalance] = useState(0);
  const [expectedEarnings, setExpectedEarnings] = useState(0);
  const [slots, setSlots] = useState(DEFAULT_SLOTS);

  const refreshBookings = useCallback(async () => {
    try {
      const res = await BookingService.list();
      if (res?.success && Array.isArray(res.bookings)) {
        setBookings(res.bookings);
      }
    } catch (e) {
      console.log('Bookings refresh note:', e?.message);
    }
  }, []);

  const refreshEarnings = useCallback(async () => {
    try {
      const res = await EarningsService.summary();
      if (res?.success && res.earnings) {
        setWalletBalance(res.earnings.pending || res.earnings.available || 0);
        setExpectedEarnings(res.earnings.expected || res.earnings.total || 0);
        if (Array.isArray(res.earnings.transactions)) {
          setTransactions(res.earnings.transactions);
        }
      }
    } catch (e) {
      console.log('Earnings refresh note:', e?.message);
    }
  }, []);

  const refreshSlots = useCallback(async () => {
    try {
      const res = await SlotService.list();
      if (res?.success && Array.isArray(res.slots)) {
        setSlots(res.slots);
      }
    } catch (e) {
      console.log('Slots refresh note:', e?.message);
    }
  }, []);

  const toggleSlot = useCallback((id) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextBlocked = !s.blocked;
          SlotService.block(id, nextBlocked).catch(() => {});
          return { ...s, blocked: nextBlocked };
        }
        return s;
      })
    );
  }, []);

  // Restore persistent partner session from device database on launch
  useEffect(() => {
    (async () => {
      try {
        const session = await partnerDb.getSession();
        if (session?.vendor) {
          setVendor(session.vendor);
          if (session.vendor.role || session.role) {
            setRole(session.vendor.role || session.role);
          }
          if (session.vendor.mandali) {
            setCurrentMandali(session.vendor.mandali);
          }
          if (session.token) {
            setAuthToken(session.token);
          }
        }
      } catch (e) {
        console.warn('Failed restoring partner session from DB:', e.message);
      } finally {
        setLoadingSession(false);
      }
    })();
  }, []);

  // Sync fresh server records when vendor is active
  useEffect(() => {
    if (vendor) {
      refreshBookings();
      refreshEarnings();
      refreshSlots();
    }
  }, [vendor, refreshBookings, refreshEarnings, refreshSlots]);

  const register = useCallback((data, token) => {
    setVendor(data);
    if (data?.role) setRole(data.role);
    if (data?.mandali) setCurrentMandali(data.mandali);
    if (token) setAuthToken(token);
    partnerDb.saveSession(data, token);
  }, []);

  const updateVendor = useCallback((patch) => {
    setVendor((prev) => {
      const next = { ...(prev || {}), ...patch };
      partnerDb.updateProfile(next);
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    if (vendor?.id) {
      socket.emit('astro:presence', { id: vendor.id, isOnline: false });
    }
    socket.disconnect();
    setVendor(null);
    setRole(null);
    setAuthToken(null);
    setBookings([]);
    setWalletBalance(0);
    setExpectedEarnings(0);
    setTransactions([]);
    await partnerDb.clearSession();
  }, [vendor]);

  const selectMandali = useCallback((mandaliName) => {
    setCurrentMandali(mandaliName);
    setMandalis((list) =>
      list.map((m) => ({
        ...m,
        isCurrent: m.name === mandaliName,
      }))
    );
    updateVendor({ mandali: mandaliName });
  }, [updateVendor]);

  const addMandali = useCallback((newMandali) => {
    const item = {
      id: 'm_' + Date.now(),
      name: newMandali.name,
      pujaris: Number(newMandali.pujaris) || 1,
      members: Number(newMandali.members) || 1,
      isCurrent: false,
    };
    setMandalis((list) => [...list, item]);
  }, []);

  const withdrawFunds = useCallback((amount) => {
    const amt = Number(amount) || 1000;
    EarningsService.payout(amt).catch(() => {});
    setWalletBalance((prev) => Math.max(0, prev - amt));
    setTransactions((prev) => [
      {
        id: 'tx_' + Date.now(),
        title: 'Withdrawn',
        sub: `${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • UPI`,
        amount: -amt,
        type: 'debit',
        icon: 'bank-transfer-out',
      },
      ...prev,
    ]);
  }, []);

  const requestPayout = useCallback(async (amount) => {
    const amt = Number(amount) || 0;
    try {
      await EarningsService.payout(amt);
    } catch (e) {
      console.warn('Payout API warning:', e?.message);
    }
    setWalletBalance((prev) => Math.max(0, prev - amt));
    setTransactions((prev) => [
      {
        id: 'tx_' + Date.now(),
        title: 'Payout Initiated',
        sub: `${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Bank/UPI`,
        amount: -amt,
        type: 'debit',
        icon: 'bank-transfer-out',
      },
      ...prev,
    ]);
  }, []);

  const value = {
    vendor,
    role,
    setRole,
    register,
    updateVendor,
    logout,
    loadingSession,

    // Mandali
    mandalis,
    currentMandali,
    selectMandali,
    addMandali,

    // Bookings
    bookings,
    setBookings,
    refreshBookings,

    // Services
    poojaServices,
    setPoojaServices,
    astroServices,
    setAstroServices,

    // Notifications
    notifications,
    setNotifications,

    // Wallet & Earnings
    walletBalance,
    expectedEarnings,
    earnings: {
      total: walletBalance + expectedEarnings,
      pending: walletBalance,
      expected: expectedEarnings,
      paid: 0,
    },
    transactions,
    withdrawFunds,
    requestPayout,
    refreshEarnings,

    // Slots & Calendar
    slots,
    setSlots,
    toggleSlot,
    refreshSlots,
  };

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
};

export const usePartner = () => {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error('usePartner must be used inside PartnerProvider');
  return ctx;
};

export default PartnerContext;
