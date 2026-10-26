/**
 * Temple Admin Store (Partner App)
 * Implements Temple Management features from Temple Locator PRD:
 * - Managed Temple Details (Profile, Deity, History, Facilities, Dress Code)
 * - Live Gates Status & Live Darshan URL management
 * - Daily Darshan & Aarti timings management (Mangla, Shringar, Bhog, Sandhya, Shayan)
 * - Special Festival timings & live announcements (e.g. Mahashivratri)
 * - Darshan Slots management (Quota per slot, VIP passes)
 * - Temple Pooja list & Hundi/Donation setup
 * - Devotee suggestions & review queue
 */

export const DEFAULT_MANAGED_TEMPLE = {
  id: 't1',
  name: 'श्री काशी विश्वनाथ ज्योतिर्लिंग मंदिर',
  name_en: 'Shree Kashi Vishwanath Temple',
  city: 'वाराणसी (Varanasi)',
  state: 'उत्तर प्रदेश',
  address: 'विश्वनाथ गली, चौक, वाराणसी, उ.प्र. 221001',
  deity: 'भगवान शिव (Shiva)',
  sampraday: 'शैव (Shaiva)',
  isVerified: true,
  isOpen: true,
  statusMessage: 'अभी खुला • दोपहर 11:30 बजे तक',
  isLiveStreamActive: true,
  liveStreamUrl: 'https://youtube.com/live/kashi_vishwanath_official',
  timings: '03:00 AM - 11:00 PM',
  darshanSessions: [
    { session: 'प्रातः सत्र (Morning)', time: '04:00 AM - 11:30 AM' },
    { session: 'मध्याह्न विश्राम (Break)', time: '11:30 AM - 12:30 PM (कपाट बंद)' },
    { session: 'संध्या सत्र (Evening)', time: '12:30 PM - 11:00 PM' },
  ],
  aartis: [
    { id: 'a1', name: 'मंगला आरती (Mangla)', time: '03:30 AM - 04:00 AM', desc: 'ब्रह्म मुहूर्त प्रथम अभिषेक' },
    { id: 'a2', name: 'भोग आरती (Bhog)', time: '11:30 AM - 12:00 PM', desc: 'मध्याह्न राजभोग' },
    { id: 'a3', name: 'संध्या आरती (Sandhya)', time: '07:00 PM - 08:15 PM', desc: 'सप्तर्षि आरती' },
    { id: 'a4', name: 'रात्रिकालीन शृंगार', time: '09:00 PM - 10:15 PM', desc: 'पुष्प व भस्म शृंगार' },
    { id: 'a5', name: 'शयन आरती (Shayan)', time: '10:30 PM - 11:00 PM', desc: 'रात्रि विश्राम' },
  ],
  announcement: 'सावन मास विशेष: प्रत्येक सोमवार को दर्शन कपाट प्रातः 2:30 बजे खुलेंगे। सुगम दर्शन टोकन आवश्यक।',
  dressCode: 'पारंपरिक वस्त्र अनिवार्य (धोती-कुर्ता / साड़ी)',
  facilities: [
    { key: 'parking', label: 'सुलभ पार्किंग', available: true, icon: 'car' },
    { key: 'jutaGhar', label: 'निःशुल्क जूता घर', available: true, icon: 'shoe-formal' },
    { key: 'prasad', label: 'महाप्रसाद काउंटर', available: true, icon: 'food-apple' },
    { key: 'wheelchair', label: 'व्हीलचेयर व रैंप', available: true, icon: 'wheelchair-accessibility' },
    { key: 'shauchalay', label: 'स्वच्छ शौचालय', available: true, icon: 'water' },
    { key: 'locker', label: 'सुरक्षित लॉकर रूम', available: true, icon: 'lock' },
  ],
  // Darshan Slots
  slots: [
    { id: 'sl1', time: '06:00 AM', capacity: 300, booked: 285, vipPrice: 351, vipQuota: 50, vipBooked: 42 },
    { id: 'sl2', time: '09:00 AM', capacity: 350, booked: 350, vipPrice: 351, vipQuota: 60, vipBooked: 60 },
    { id: 'sl3', time: '12:00 PM', capacity: 250, booked: 190, vipPrice: 351, vipQuota: 40, vipBooked: 28 },
    { id: 'sl4', time: '04:00 PM', capacity: 400, booked: 320, vipPrice: 351, vipQuota: 70, vipBooked: 55 },
    { id: 'sl5', time: '07:00 PM', capacity: 450, booked: 410, vipPrice: 351, vipQuota: 80, vipBooked: 76 },
  ],
  stats: {
    todayDevotees: 1555,
    todayVipPasses: 261,
    todayDonation: 48250,
    pendingSuggestions: 2,
  },
  donationAccount: {
    trustName: 'श्री काशी विश्वनाथ मंदिर न्यास परिषद',
    bank: 'भारतीय स्टेट बैंक (SBI)',
    accountNumber: '••••••••4819',
    upiId: 'kashivishwanath@sbi',
    isVerified: true,
  },
  poojas: [
    { id: 'p1', title: 'श्री रुद्राभिषेक (Rudrabhishek)', dakshina: 1100, active: true },
    { id: 'p2', title: 'महामृत्युंजय संपुट पाठ', dakshina: 2100, active: true },
    { id: 'p3', title: 'सुगम दर्शन व विशेष अर्चन', dakshina: 501, active: true },
  ],
  suggestionsQueue: [
    {
      id: 'sug_1',
      user: 'आलोक कुमार',
      type: 'समय में संशोधन',
      details: 'दोपहर में कपाट 11:30 से 12:30 बंद रहते हैं, कृपया समय सारिणी में स्पष्ट लिखें।',
      date: 'आज, 10:15 AM',
      status: 'pending',
    },
    {
      id: 'sug_2',
      user: 'सुनीता त्रिपाठी',
      type: 'सुविधा अद्यतन',
      details: 'गेट नंबर 4 पर नया व्हीलचेयर रैंप चालू हो गया है।',
      date: 'कल, 04:30 PM',
      status: 'pending',
    },
  ],
};

class TempleAdminStore {
  constructor() {
    this.temple = JSON.parse(JSON.stringify(DEFAULT_MANAGED_TEMPLE));
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in TempleAdminStore listener:', e);
      }
    });
  }

  getTemple() {
    return this.temple;
  }

  toggleOpenStatus() {
    this.temple.isOpen = !this.temple.isOpen;
    this.temple.statusMessage = this.temple.isOpen
      ? 'अभी खुला • दोपहर 11:30 बजे तक'
      : 'वर्तमान में कपाट बंद हैं';
    this.notify();
  }

  toggleLiveStream() {
    this.temple.isLiveStreamActive = !this.temple.isLiveStreamActive;
    this.notify();
  }

  updateLiveStreamUrl(url) {
    this.temple.liveStreamUrl = url;
    this.notify();
  }

  updateAnnouncement(text) {
    this.temple.announcement = text;
    this.notify();
  }

  updateAartiTime(aartiId, newTime) {
    const a = this.temple.aartis.find((x) => x.id === aartiId);
    if (a) {
      a.time = newTime;
      this.notify();
    }
  }

  updateSlotCapacity(slotId, newCapacity) {
    const s = this.temple.slots.find((x) => x.id === slotId);
    if (s) {
      s.capacity = parseInt(newCapacity, 10) || s.capacity;
      this.notify();
    }
  }

  addSlot(time, capacity = 250, vipPrice = 351) {
    const newSlot = {
      id: 'sl_' + Date.now(),
      time,
      capacity: parseInt(capacity, 10),
      booked: 0,
      vipPrice: parseInt(vipPrice, 10),
      vipQuota: 50,
      vipBooked: 0,
    };
    this.temple.slots.push(newSlot);
    this.notify();
  }

  approveSuggestion(sugId) {
    const s = this.temple.suggestionsQueue.find((x) => x.id === sugId);
    if (s) {
      s.status = 'approved';
      this.temple.stats.pendingSuggestions = Math.max(
        0,
        this.temple.stats.pendingSuggestions - 1
      );
      this.notify();
    }
  }

  rejectSuggestion(sugId) {
    const s = this.temple.suggestionsQueue.find((x) => x.id === sugId);
    if (s) {
      s.status = 'rejected';
      this.temple.stats.pendingSuggestions = Math.max(
        0,
        this.temple.stats.pendingSuggestions - 1
      );
      this.notify();
    }
  }

  toggleFacility(key) {
    const f = this.temple.facilities.find((x) => x.key === key);
    if (f) {
      f.available = !f.available;
      this.notify();
    }
  }
}

export const templeAdminStore = new TempleAdminStore();
export default templeAdminStore;
