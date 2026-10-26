/**
 * Pandit Booking Engine & State Store (Partner App)
 * Implements the Rapido-style Pandit Booking PRD:
 * State Machine:
 * SEARCHING -> ACCEPTED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED
 * Alternate: CANCELLED_BY_YAJMAN, CANCELLED_BY_PANDIT, NO_PANDIT_FOUND, DISPUTED
 */

export const POOJA_TYPES = [
  {
    id: 'p1',
    name: 'Satyanarayan Katha',
    hi: 'श्री सत्यनारायण व्रत कथा',
    duration: '2.5 hrs',
    durationMin: 150,
    price: 2100,
    samagriFee: 600,
    samagriBy: 'pandit',
    advancePercent: 25,
    tag: 'गृह शांति व मनोकामना पूर्ति',
    category: 'Katha',
    icon: 'book-open-page-variant',
    bg: '#FFEBD6',
  },
  {
    id: 'p2',
    name: 'Rudrabhishek Pooja',
    hi: 'महाकाल रुद्राभिषेक पूजा',
    duration: '2 hrs',
    durationMin: 120,
    price: 3100,
    samagriFee: 800,
    samagriBy: 'pandit',
    advancePercent: 25,
    tag: 'शिव कृपा, आरोग्य व कष्ट निवारण',
    category: 'Abhishek',
    icon: 'om',
    bg: '#E3EEFD',
  },
  {
    id: 'p3',
    name: 'Griha Pravesh Pooja',
    hi: 'गृह प्रवेश व वास्तु पूजन',
    duration: '3.5 hrs',
    durationMin: 210,
    price: 5100,
    samagriFee: 1200,
    samagriBy: 'pandit',
    advancePercent: 30,
    tag: 'नए गृह में सुख-समृद्धि व मांगलिक प्रवेश',
    category: 'Sanskar',
    icon: 'home-heart',
    bg: '#FFF6D6',
  },
  {
    id: 'p4',
    name: 'Maha Mrityunjaya Jaap',
    hi: 'महामृत्युंजय शांति जप व हवन',
    duration: '3 hrs',
    durationMin: 180,
    price: 4500,
    samagriFee: 900,
    samagriBy: 'pandit',
    advancePercent: 25,
    tag: 'दीर्घायु, भय मुक्ति व रक्षा कवच',
    category: 'Havan',
    icon: 'fire',
    bg: '#FDECF0',
  },
  {
    id: 'p5',
    name: 'Navgrah Shanti Pooja',
    hi: 'नवग्रह शांति व दोष निवारण',
    duration: '2 hrs',
    durationMin: 120,
    price: 2700,
    samagriFee: 700,
    samagriBy: 'pandit',
    advancePercent: 25,
    tag: 'ग्रह दोष शांति व अनुकूलता',
    category: 'Shanti',
    icon: 'orbit',
    bg: '#EDE5FA',
  },
  {
    id: 'p6',
    name: 'Ganesh Pooja & Havan',
    hi: 'श्री गणेश पूजन व विघ्नहर्ता हवन',
    duration: '1.5 hrs',
    durationMin: 90,
    price: 1800,
    samagriFee: 500,
    samagriBy: 'pandit',
    advancePercent: 25,
    tag: 'शुभ कार्य आरंभ व विघ्न निवारण',
    category: 'Havan',
    icon: 'elephant',
    bg: '#EAF7E8',
  },
];

export const DEMO_PANDIT = {
  id: 'PND-VERIFIED',
  name: 'Verified Pandit',
  photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
  rating: 4.9,
  ratingCount: 142,
  expYears: 14,
  languages: ['Hindi', 'Sanskrit', 'Bhojpuri'],
  verified: true,
  gurukul: 'Sampurnanand Sanskrit Vishwavidyalaya, Varanasi',
  phoneMasked: '+91 •••••• ••84',
  distanceKm: 2.3,
  etaMin: 18,
};

class PanditBookingStore {
  constructor() {
    this.booking = null;
    this.listeners = new Set();
    this.timerInterval = null;
    this.dispatchTimeout = null;
    this.waveInterval = null;
  }

  getBooking() {
    return this.booking;
  }

  setBooking(b) {
    if (b && !Array.isArray(b.chatMessages)) {
      b.chatMessages = [];
    }
    this.booking = b;
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.booking);
      } catch (e) {
        console.error('Listener err', e);
      }
    });
  }

  createBooking(params) {
    this.clearTimers();

    const startOtp = String(Math.floor(1000 + Math.random() * 9000));
    const completeOtp = String(Math.floor(1000 + Math.random() * 9000));
    const bookingId = 'BK' + Math.floor(10000 + Math.random() * 90000);

    const pooja = params.pooja || POOJA_TYPES[0];
    const withSamagri = params.withSamagri !== false;
    const dakshina = pooja.price;
    const samagriFee = withSamagri ? pooja.samagriFee : 0;
    const platformFee = 50;
    const gst = Math.round((dakshina + samagriFee + platformFee) * 0.05);
    const total = dakshina + samagriFee + platformFee + gst;
    const advancePaid = params.payFull ? total : Math.round(total * (pooja.advancePercent / 100));

    this.booking = {
      id: bookingId,
      pooja,
      type: params.type || 'instant',
      scheduledAt: params.scheduledAt || 'Today, 05:00 PM',
      address: params.address || 'Live Location (GPS)',
      area: params.area || 'Current Location',
      landmark: params.landmark || '',
      language: params.language || 'Hindi & Sanskrit',
      yajmanName: params.yajmanName || 'Yajman',
      gotra: params.gotra || 'Kashyap',
      sankalpName: params.sankalpName || (params.yajmanName ? `${params.yajmanName} & Parivar` : 'Yajman & Parivar'),
      specialNote: params.specialNote || 'कृपया शुद्ध गाय का घी व हवन सामग्री साथ लाएं।',
      withSamagri,
      dakshina,
      samagriFee,
      platformFee,
      gst,
      total,
      advancePaid,
      status: 'SEARCHING',
      startOtp,
      completeOtp,
      otpAttempts: 0,
      pandit: null,
      wave: 1,
      waveRadiusKm: 5,
      waveTimeoutSec: 30,
      waveRemainingSec: 30,
      elapsedSeconds: 0,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      arrivedAt: null,
      startedAt: null,
      completedAt: null,
      chatMessages: [
        {
          id: 'sys-1',
          sender: 'system',
          text: 'पंडित जी से आपकी बातचीत सुरक्षित व एन्क्रिप्टेड है।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      dispute: null,
      review: null,
      cancellation: null,
    };

    this.notify();
    return this.booking;
  }

  acceptBooking(pandit = DEMO_PANDIT) {
    if (!this.booking) {
      // Create a default pending booking if none exists
      this.createBooking({});
    }

    clearInterval(this.waveInterval);
    clearTimeout(this.dispatchTimeout);

    this.booking.status = 'ACCEPTED';
    this.booking.pandit = { ...pandit };
    this.booking.acceptedAt = new Date().toISOString();

    this.booking.chatMessages.push({
      id: 'm-' + Date.now(),
      sender: 'pandit',
      text: `प्रणाम यजमान जी 🙏 मैंने आपकी ${this.booking.pooja.name} की सेवा स्वीकार कर ली है।`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    this.notify();
    return true;
  }

  setOnTheWay() {
    if (!this.booking) return false;
    this.booking.status = 'ON_THE_WAY';
    this.booking.chatMessages = Array.isArray(this.booking.chatMessages) ? this.booking.chatMessages : [];
    this.booking.chatMessages.push({
      id: 'm-' + Date.now(),
      sender: 'pandit',
      text: 'मैं पूजा सामग्री के साथ आपके स्थान के लिए निकल चुका हूँ। ETA: 15-20 मिनट।',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
    return true;
  }

  setArrived(distanceMeters = 120) {
    if (!this.booking) return { success: false, message: 'कोई बुकिंग नहीं मिली' };

    if (distanceMeters > 200) {
      return {
        success: false,
        message: 'आप अभी यजमान के स्थान से 200m से अधिक दूर हैं। कृपया पास पहुँचकर बटन दबाएं।',
      };
    }

    this.booking.status = 'ARRIVED';
    this.booking.arrivedAt = new Date().toISOString();
    this.booking.chatMessages = Array.isArray(this.booking.chatMessages) ? this.booking.chatMessages : [];
    this.booking.chatMessages.push({
      id: 'm-' + Date.now(),
      sender: 'pandit',
      text: 'मैं आपके द्वार पर पहुँच गया हूँ। कृपया Start OTP बताएं।',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
    return { success: true };
  }

  verifyStartOtp(enteredOtp) {
    if (!this.booking || this.booking.status !== 'ARRIVED') {
      return { success: false, message: 'कृपया पहले "पहुँच गया" स्थिति दर्ज करें।' };
    }

    if (this.booking.otpAttempts >= 5) {
      this.booking.status = 'DISPUTED';
      this.notify();
      return { success: false, message: 'अधिक गलत OTP प्रयासों के कारण बुकिंग लॉक कर दी गई है।' };
    }

    if (enteredOtp.trim() === this.booking.startOtp) {
      this.booking.status = 'IN_PROGRESS';
      this.booking.startedAt = new Date().toISOString();
      this.booking.otpAttempts = 0;
      this.startPoojaTimer();
      this.notify();
      return { success: true };
    } else {
      this.booking.otpAttempts += 1;
      this.notify();
      return {
        success: false,
        message: `गलत Start OTP! शेष प्रयास: ${5 - this.booking.otpAttempts}`,
      };
    }
  }

  startPoojaTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.booking && this.booking.status === 'IN_PROGRESS') {
        this.booking.elapsedSeconds += 1;
        this.notify();
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  verifyCompleteOtp(enteredOtp) {
    if (!this.booking || this.booking.status !== 'IN_PROGRESS') {
      return { success: false, message: 'पूजा अभी प्रगति में नहीं है।' };
    }

    if (enteredOtp.trim() === this.booking.completeOtp) {
      clearInterval(this.timerInterval);
      this.booking.status = 'COMPLETED';
      this.booking.completedAt = new Date().toISOString();
      this.notify();
      return { success: true };
    } else {
      return { success: false, message: 'गलत Complete OTP! कृपया यजमान की ऐप में देखें।' };
    }
  }

  cancelBooking(actor = 'pandit', reason = 'Emergency') {
    if (!this.booking) return null;

    const currentStatus = this.booking.status;
    let penaltyFee = 50; // Penalty on Pandit for cancellation after accept as per PRD
    let explanation = 'स्वीकृति के बाद पंडित जी द्वारा रद्द करने पर ₹50 पेनल्टी लागू होती है।';

    this.clearTimers();

    this.booking.cancellation = {
      actor,
      reason,
      penaltyFee,
      explanation,
      cancelledAt: new Date().toISOString(),
    };

    this.booking.status = 'CANCELLED_BY_PANDIT';
    this.notify();
    return { success: true, policy: this.booking.cancellation };
  }

  submitReview({ rating, tags, comment, from = 'pandit' }) {
    if (!this.booking) return false;
    this.booking.review = {
      from,
      rating,
      tags: tags || [],
      comment,
      submittedAt: new Date().toISOString(),
    };
    this.notify();
    return true;
  }

  sendChatMessage(sender, text) {
    if (!this.booking || !text.trim()) return;
    this.booking.chatMessages.push({
      id: 'm-' + Date.now(),
      sender,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
  }

  clearTimers() {
    clearInterval(this.timerInterval);
    clearInterval(this.waveInterval);
    clearTimeout(this.dispatchTimeout);
  }

  reset() {
    this.clearTimers();
    this.booking = null;
    this.notify();
  }
}

export const panditBookingStore = new PanditBookingStore();
export default panditBookingStore;
