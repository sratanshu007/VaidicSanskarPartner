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
import partnerAstroStore from '../services/talkToAstroStore';

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

  const vendorId = vendor?.id || vendor?._id || null;

  const refreshBookings = useCallback(async (overrideVendorId) => {
    const targetId = overrideVendorId || vendorId;
    if (!targetId) {
      setBookings([]);
      return;
    }
    try {
      const res = await BookingService.list(targetId);
      if (res?.success && Array.isArray(res.bookings)) {
        setBookings(res.bookings);
      }
    } catch (e) {
      console.log('Bookings refresh note:', e?.message);
    }
  }, [vendorId]);

  const refreshEarnings = useCallback(async (overrideVendorId) => {
    const targetId = overrideVendorId || vendorId;
    if (!targetId) {
      setWalletBalance(0);
      setExpectedEarnings(0);
      setTransactions([]);
      return;
    }
    try {
      const res = await EarningsService.summary(targetId);
      if (res?.success) {
        const earnObj = res.earnings || {};
        const bal = res.walletBalance ?? earnObj.available ?? earnObj.pending ?? 0;
        const exp = res.expectedEarnings ?? earnObj.expected ?? 0;
        const txs = Array.isArray(res.transactions)
          ? res.transactions
          : Array.isArray(earnObj.transactions)
          ? earnObj.transactions
          : [];
        setWalletBalance(Number(bal) || 0);
        setExpectedEarnings(Number(exp) || 0);
        setTransactions(txs);
      }
    } catch (e) {
      console.log('Earnings refresh note:', e?.message);
    }
  }, [vendorId]);

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

  // Sync fresh server records and live earning updates when vendor is active
  useEffect(() => {
    if (!vendor) return;
    const id = vendor.id || vendor._id;
    refreshBookings(id);
    refreshEarnings(id);
    refreshSlots();

    if (id) {
      socket.emit('vendor:join', { vendorId: id });
      socket.emit('pandit:join', { vendorId: id });
    }

    const onEarningsUpdated = (payload) => {
      if (!payload) return;
      if (payload.vendorId && id && String(payload.vendorId) !== String(id)) return;
      if (payload.walletBalance != null) setWalletBalance(Number(payload.walletBalance) || 0);
      if (Array.isArray(payload.transactions)) {
        setTransactions(payload.transactions);
      } else if (payload.transaction) {
        setTransactions((prev) => [payload.transaction, ...prev.filter((t) => t.id !== payload.transaction.id)]);
      } else {
        refreshEarnings(id);
      }
    };

    const onBookingDone = () => {
      refreshBookings(id);
      refreshEarnings(id);
    };

    socket.on('earnings:updated', onEarningsUpdated);
    socket.on('booking:completed', onBookingDone);
    return () => {
      socket.off('earnings:updated', onEarningsUpdated);
      socket.off('booking:completed', onBookingDone);
    };
  }, [vendor, refreshBookings, refreshEarnings, refreshSlots]);

  const register = useCallback((data, token) => {
    setBookings([]);
    setWalletBalance(Number(data?.walletBalance || 0));
    setExpectedEarnings(Number(data?.expectedEarnings || 0));
    setTransactions([]);
    setNotifications([]);
    setSlots([]);
    partnerAstroStore.reset();
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
    partnerAstroStore.reset();
    setVendor(null);
    setRole(null);
    setAuthToken(null);
    setBookings([]);
    setNotifications([]);
    setSlots([]);
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

  const withdrawFunds = useCallback(async (amount, upiId) => {
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    await EarningsService.payout(amt, { vendorId: vendor?.id, upiId });
    await refreshEarnings(vendor?.id);
  }, [vendor?.id, refreshEarnings]);

  const addEarning = useCallback((amount, reason = 'Astro Consultation') => {
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    setWalletBalance((prev) => prev + amt);
    setExpectedEarnings((prev) => prev + amt);
    setTransactions((prev) => [
      {
        id: 'tx_' + Date.now(),
        title: reason,
        sub: `${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Credited`,
        amount: amt,
        type: 'credit',
        icon: 'cash-plus',
      },
      ...prev,
    ]);
    if (vendor?.id) {
      EarningsService.credit({ vendorId: vendor.id, amount: amt, title: reason })
        .then(() => refreshEarnings(vendor.id))
        .catch(() => {});
    }
  }, [vendor?.id, refreshEarnings]);

  const requestPayout = useCallback(async (amount, upiId) => {
    const amt = Number(amount) || 0;
    try {
      await EarningsService.payout(amt, { vendorId: vendor?.id, upiId });
      await refreshEarnings(vendor?.id);
    } catch (e) {
      console.warn('Payout API warning:', e?.message);
    }
  }, [vendor?.id, refreshEarnings]);

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
    addEarning,
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
