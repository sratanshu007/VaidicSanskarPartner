/**
 * Astrologer Partner Store (VaidicSanskarPartner)
 * Implements PRD specifications for Astrologer Partner App:
 * - 3 Presence Toggles: Chat Online, Audio Online, Video Online
 * - Rate configuration within admin limits
 * - Incoming consultation request with 60-second countdown timer
 * - Waitlist (Queue) management
 * - Active Session with Auto-Kundali panel and Private Notes
 * - Per-minute earnings ledger (after platform commission)
 */

export const ADMIN_RATE_LIMITS = {
  chat: { min: 1, max: 200, default: 5 },
  audio: { min: 1, max: 250, default: 5 },
  video: { min: 1, max: 300, default: 5 },
};

export const PLATFORM_COMMISSION = 0.15; // 15% platform share, 85% astrologer share

class PartnerAstroStore {
  constructor() {
    this.presence = {
      chatOnline: true,
      audioOnline: true,
      videoOnline: true,
    };

    this.rates = {
      chat: 5,
      audio: 5,
      video: 5,
    };

    this.offerRate = {
      active: true,
      chat: 9,
      hoursRemaining: 3,
    };

    // Real-time incoming call request (populated only from live WebSocket events)
    this.incomingRequest = null;

    // Waitlist queue (populated only from live socket requests)
    this.waitlist = [];

    // Consultation history (populated only from real completed sessions)
    this.history = [];

    // Active session
    this.activeSession = null;

    // Live Earnings & Stats (zero-initialized for new partners)
    this.stats = {
      todayEarnings: 0,
      todayMinutes: 0,
      completedOrders: 0,
      averageRating: 0,
      reviewsCount: 0,
      repeatCustomerRate: '0%',
    };

    this.sessionNotes = {};
    this.listeners = new Set();
  }

  getPresence() {
    return this.presence;
  }

  getRates() {
    return this.rates;
  }

  getOfferRate() {
    return this.offerRate;
  }

  getIncomingRequest() {
    return this.incomingRequest;
  }

  getWaitlist() {
    return this.waitlist;
  }

  getActiveSession() {
    return this.activeSession;
  }

  getStats() {
    return this.stats;
  }

  getHistory() {
    return this.history;
  }

  reset() {
    this.incomingRequest = null;
    this.activeSession = null;
    this.waitlist = [];
    this.history = [];
    this.stats = {
      todayEarnings: 0,
      todayMinutes: 0,
      completedOrders: 0,
      averageRating: 0,
      reviewsCount: 0,
      repeatCustomerRate: '0%',
    };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (e) {
        console.error('Error in partnerAstroStore listener:', e);
      }
    });
  }

  // Toggle Presence Modes
  togglePresence(modeKey) {
    this.presence[modeKey] = !this.presence[modeKey];
    this.notify();
  }

  // Update Rate within Admin Limits
  updateRate(mode, newRate) {
    const limits = ADMIN_RATE_LIMITS[mode];
    if (newRate >= limits.min && newRate <= limits.max) {
      this.rates[mode] = newRate;
      this.notify();
    }
  }

  // Accept Incoming Request
  acceptRequest() {
    if (!this.incomingRequest) return;
    const req = this.incomingRequest;
    this.activeSession = {
      id: req.id,
      userName: req.userName,
      mode: req.mode,
      rate: req.rate,
      topic: req.topic,
      birthDetails: req.birthDetails,
      elapsedSeconds: 0,
      netRatePerMinute: req.rate || 5,
      chatMessages: [
        {
          id: 'M-1',
          sender: 'client',
          text: `प्रणाम गुरुजी! मेरी कुंडली देखकर बताएं कि मेरी नई नौकरी का योग कब बन रहा है?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      privateNotes: '',
    };
    this.incomingRequest = null;
    this.notify();
    return this.activeSession;
  }

  // Reject Incoming Request
  rejectRequest() {
    this.incomingRequest = null;
    this.notify();
  }

  // Trigger Demo Incoming Request
  triggerDemoIncomingRequest(mode = 'audio', customData = {}) {
    const callerName = customData.name || (mode === 'video' ? 'राहुल शर्मा (यजमान)' : 'विकास अग्निहोत्री');
    const topic = customData.topic || (mode === 'video' ? 'विवाह व मांगलिक विचार (Kundali Match)' : 'करियर व नौकरी परामर्श (Career)');
    this.incomingRequest = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      userName: callerName,
      mode,
      rate: customData.rate || this.rates[mode] || 5,
      topic,
      channelName: `vartalap_${mode}_${Date.now().toString().slice(-6)}`,
      birthDetails: customData.birthDetails || {
        dob: '14-08-1995',
        tob: '07:30 AM',
        pob: 'वाराणसी, उत्तर प्रदेश',
        gender: 'पुरुष (Male)',
        kundali: {
          lagna: 'सिंह (Leo)',
          rashi: 'वृश्चिक (Scorpio)',
          nakshatra: 'अनुराधा (चरण 2)',
          dasha: 'बुध महादशा • शुक्र अंतर्दशा',
          favorablePlanets: 'सूर्य, मंगल, गुरु',
          remedyRecommended: 'आदित्य हृदय स्तोत्र पाठ, सूर्य अर्घ्य',
        },
      },
      expiresInSeconds: 60,
    };
    this.notify();
    return this.incomingRequest;
  }

  // Send message in active session
  sendMessage(text) {
    if (!this.activeSession) return;
    this.activeSession.chatMessages.push({
      id: `M-${Date.now()}`,
      sender: 'astrologer',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
  }

  // Receive message from client via Socket
  receiveClientMessage(text) {
    if (!this.activeSession) return;
    this.activeSession.chatMessages.push({
      id: `M-${Date.now()}`,
      sender: 'client',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
  }

  // Save private notes
  savePrivateNotes(notesText) {
    if (!this.activeSession) return;
    this.activeSession.privateNotes = notesText;
    this.sessionNotes[this.activeSession.userName] = notesText;
    this.notify();
  }

  // End Active Session
  endSession() {
    if (!this.activeSession) return;
    const billedMins = Math.max(1, Math.ceil(this.activeSession.elapsedSeconds / 60));
    const netEarned = billedMins * this.activeSession.netRatePerMinute;

    this.stats.todayEarnings += netEarned;
    this.stats.todayMinutes += billedMins;
    this.stats.completedOrders += 1;

    const finished = {
      ...this.activeSession,
      billedMins,
      netEarned,
      completedAt: new Date().toISOString(),
    };
    this.history.unshift(finished);
    this.activeSession = null;
    this.notify();
    return finished;
  }
}

export const partnerAstroStore = new PartnerAstroStore();
export default partnerAstroStore;
