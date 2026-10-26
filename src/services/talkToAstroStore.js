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

    // Incoming Request Simulation
    this.incomingRequest = {
      id: 'REQ-8891',
      userName: 'रमेश कुमार',
      mode: 'chat', // chat | audio | video
      rate: 5,
      topic: 'करियर व नौकरी (Career & Job)',
      birthDetails: {
        dob: '15-08-1994',
        tob: '06:45 AM',
        pob: 'लखनऊ, उत्तर प्रदेश',
        gender: 'पुरुष (Male)',
        kundali: {
          lagna: 'सिंह (Leo)',
          rashi: 'वृश्चिक (Scorpio)',
          nakshatra: 'अनुराधा (चरण 2)',
          dasha: 'बुध महादशा • शुक्र अंतर्दशा',
          favorablePlanets: 'सूर्य, मंगल, गुरु',
          remedyRecommended: 'आदित्य हृदय स्तोत्र पाठ, माणिक्य रत्न',
        },
      },
      expiresInSeconds: 58,
    };

    // Waitlist queue
    this.waitlist = [
      { id: 'W-1', userName: 'अमित मिश्रा', mode: 'audio', topic: 'विवाह योग', waitMinutes: 6 },
      { id: 'W-2', userName: 'सुनील वर्मा', mode: 'chat', topic: 'व्यापार वृद्धि', waitMinutes: 14 },
    ];

    // Active session
    this.activeSession = null;

    // Today's Earnings & Stats
    this.stats = {
      todayEarnings: 1840,
      todayMinutes: 98,
      completedOrders: 9,
      averageRating: 4.96,
      repeatCustomerRate: '78%',
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
  triggerDemoIncomingRequest(mode = 'audio') {
    this.incomingRequest = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      userName: 'विकास अग्निहोत्री',
      mode,
      rate: this.rates[mode] || 22,
      topic: 'विवाह व मांगलिक दोष (Marriage)',
      birthDetails: {
        dob: '02-05-1996',
        tob: '04:15 PM',
        pob: 'कानपुर, उत्तर प्रदेश',
        gender: 'पुरुष (Male)',
        kundali: {
          lagna: 'कन्या (Virgo)',
          rashi: 'तुला (Libra)',
          nakshatra: 'स्वाति (चरण 3)',
          dasha: 'गुरु महादशा • शनि अंतर्दशा',
          favorablePlanets: 'शुक्र, बुध, शनि',
          remedyRecommended: 'विष्णु सहस्रनाम, शुक्रवार को खीर दान',
        },
      },
      expiresInSeconds: 60,
    };
    this.notify();
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

    const finished = { ...this.activeSession, billedMins, netEarned };
    this.activeSession = null;
    this.notify();
    return finished;
  }
}

export const partnerAstroStore = new PartnerAstroStore();
export default partnerAstroStore;
