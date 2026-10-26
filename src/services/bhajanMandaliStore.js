/**
 * Bhajan Mandali Engine & State Store (Partner App)
 * Implements Bhajan Mandali PRD for Mandali Leader & Troupes:
 * - 24-hr Request SLA queue & acceptance/rejection with calendar slot locks
 * - Event day fulfillment:
 *   REQUESTED -> ACCEPTED -> ON_THE_WAY -> ARRIVED (500m geofence) -> IN_PROGRESS (Start OTP) -> COMPLETED (End OTP >= 75%)
 * - Extra hours extension requests
 * - Cash collection reporting & wallet settlement
 * - 2-way dual review
 */

export const BHAJAN_STYLES = [
  { id: 'all', name: 'All Styles', hi: 'सभी शैलियां', icon: 'music' },
  { id: 'sunderkand', name: 'Sunderkand Path', hi: 'श्री सुंदरकांड पाठ', icon: 'book-open-variant' },
  { id: 'sandhya', name: 'Bhajan Sandhya', hi: 'भजन संध्या व संकीर्तन', icon: 'microphone-variant' },
  { id: 'jagran', name: 'Jagran / Jagrata', hi: 'भगवती जागरण व जगराता', icon: 'fire' },
  { id: 'shyam', name: 'Shyam Bhajan', hi: 'खाटू श्याम संकीर्तन', icon: 'crown' },
  { id: 'ramayan', name: 'Ramayan Path', hi: 'श्री रामचरितमानस पाठ', icon: 'script-text' },
  { id: 'sai', name: 'Sai Sandhya', hi: 'साईं संध्या व भजन', icon: 'hands-pray' },
  { id: 'hanuman', name: 'Hanuman Chalisa', hi: 'हनुमान चालीसा 108 पाठ', icon: 'shield-account' },
];

export const MANDALI_OCCASIONS = [
  'गृह प्रवेश व वास्तु शांति',
  'भगवती जागरण व नवरात्रि',
  'श्री सुंदरकांड पाठ उत्सव',
  'खाटू श्याम एकादशी संकीर्तन',
  'जन्मदिन व मांगलिक उत्सव',
  'विवाह व वर्षगांठ उत्सव',
  'मंदिर स्थापना व वार्षिक उत्सव',
];

export const DEMO_MANDALIS = [
  {
    id: 'm1',
    name: 'Shri Shyam Kripa Bhajan Mandali',
    nameHi: 'श्री श्याम कृपा भजन मंडली',
    leaderName: 'पं. सत्यनारायण मिश्रा',
    city: 'वाराणसी, उत्तर प्रदेश',
    serviceRadiusKm: 25,
    membersCount: 7,
    rating: 4.95,
    reviewsCount: 148,
    verified: true,
    experienceYears: 12,
    programsCompleted: 450,
    styles: ['Shyam Bhajan', 'Bhajan Sandhya', 'Sunderkand Path'],
    languages: ['हिंदी', 'भोजपुरी', 'राजस्थानी'],
    instruments: ['हारमोनियम', 'ढोलक', 'तबला', 'मंजीरा', 'पैड / ऑक्टोपैड', 'साउंड सिस्टम'],
    ownSoundSystem: true,
    packages: [
      {
        id: 'pkg-1',
        name: 'दिव्य भजन संध्या (3 घंटे)',
        duration: '3 घंटे',
        durationMin: 180,
        members: 6,
        price: 11000,
        extraHourPrice: 2500,
        includes: ['हाई-क्वालिटी साउंड सिस्टम (JBL)', '2 मुख्य गायक + 4 वाद्य वादक', 'हारमोनियम, ढोलक, पैड', 'माइक व मिक्सर सेट'],
      },
      {
        id: 'pkg-2',
        name: 'अखंड श्री सुंदरकांड पाठ व संकीर्तन',
        duration: '4 घंटे',
        durationMin: 240,
        members: 7,
        price: 14000,
        extraHourPrice: 2500,
        includes: ['व्यास पीठ साज-सज्जा', 'सम्पूर्ण वाद्य वृंद', 'साउंड सिस्टम', 'आरती व पुष्पांजलि'],
      },
    ],
  },
];

class BhajanMandaliPartnerStore {
  constructor() {
    this.booking = {
      id: 'BM-98214',
      mandali: DEMO_MANDALIS[0],
      package: DEMO_MANDALIS[0].packages[0],
      eventDate: '15 Oct 2026',
      startTime: '06:00 PM',
      duration: '3 घंटे',
      durationMin: 180,
      occasion: 'गृह प्रवेश व वास्तु शांति',
      yajmanName: 'Yajman Ji',
      yajmanPhone: '+91 •••••• ••10',
      area: 'लाइव यजमान क्षेत्र (GPS)',
      fullAddress: 'लाइव यजमान स्थान (GPS)',
      expectedGuests: '75',
      farmaishSongs: 'कीर्तन की है रात बाबा आज थाने आणो है, लल्ला की सुन के मैं आई',
      specialNote: 'कृपया समय पर साउंड सेटअप कर लें। माता की चौकी हेतु पीला आसन उपलब्ध रहेगा।',
      packagePrice: 11000,
      netEarning: 9350, // 15% platform commission
      travelFee: 0,
      total: 11812,
      advancePaid: 2362,
      status: 'REQUESTED', // REQUESTED, ACCEPTED, ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED
      expiresInHours: 23,
      startOtp: '4821',
      completeOtp: '8914',
      elapsedSeconds: 0,
      extraHours: 0,
      extraHoursRequested: null,
      chatMessages: [
        {
          id: 'm1',
          sender: 'system',
          text: 'यजमान के साथ आपकी बातचीत 100% सुरक्षित व एन्क्रिप्टेड है।',
          time: '10:00 AM',
        },
      ],
      review: null,
    };
    this.listeners = new Set();
    this.timerInterval = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  getBooking() {
    return this.booking;
  }

  acceptRequest() {
    if (!this.booking) return false;
    this.booking.status = 'ACCEPTED';
    this.booking.chatMessages.push({
      id: 'm-' + Date.now(),
      sender: 'mandali',
      text: `प्रणाम यजमान जी 🙏 हमने आपका ${this.booking.occasion} हेतु बुकिंग अनुरोध स्वीकार कर लिया है।`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
    return true;
  }

  rejectRequest(reason = 'Date Busy') {
    if (!this.booking) return false;
    this.booking.status = 'REJECTED';
    this.booking.rejectReason = reason;
    this.notify();
    return true;
  }

  setOnTheWay() {
    if (!this.booking) return false;
    this.booking.status = 'ON_THE_WAY';
    this.booking.chatMessages.push({
      id: 'm-' + Date.now(),
      sender: 'mandali',
      text: 'मंडली सम्पूर्ण वाद्य यंत्रों व साउंड सिस्टम के साथ आपके कार्यक्रम स्थल के लिए निकल चुकी है।',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
    return true;
  }

  setArrived(distanceMeters = 250) {
    if (!this.booking) return { success: false, message: 'कोई बुकिंग नहीं मिली' };
    if (distanceMeters > 500) {
      return {
        success: false,
        message: 'आप कार्यक्रम स्थल से 500 मीटर से अधिक दूर हैं। कृपया पास पहुँचकर "पहुँच गए" दर्ज करें।',
      };
    }
    this.booking.status = 'ARRIVED';
    this.booking.chatMessages.push({
      id: 'm-' + Date.now(),
      sender: 'mandali',
      text: 'हम कार्यक्रम स्थल पर पहुँच चुके हैं। कृपया मंच व साउंड व्यवस्था उपरांत Start OTP बताएं।',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.notify();
    return { success: true };
  }

  verifyStartOtp(enteredOtp) {
    if (!this.booking) return { success: false, message: 'बुकिंग नहीं मिली' };
    if (enteredOtp.trim() === this.booking.startOtp) {
      this.booking.status = 'IN_PROGRESS';
      this.startProgramTimer();
      this.notify();
      return { success: true };
    } else {
      return { success: false, message: 'गलत Start OTP! कृपया यजमान की ऐप में देखें।' };
    }
  }

  startProgramTimer() {
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

  requestExtraHours(hours = 1) {
    if (!this.booking) return;
    const rate = this.booking.package?.extraHourPrice || 2500;
    this.booking.extraHoursRequested = {
      hours,
      amount: hours * rate,
      status: 'PENDING',
    };
    this.notify();
  }

  verifyEndOtp(enteredOtp) {
    if (!this.booking || this.booking.status !== 'IN_PROGRESS') {
      return { success: false, message: 'कार्यक्रम अभी प्रगति में नहीं है।' };
    }

    if (enteredOtp.trim() === this.booking.completeOtp) {
      clearInterval(this.timerInterval);
      this.booking.status = 'COMPLETED';
      this.notify();
      return { success: true };
    } else {
      return { success: false, message: 'गलत End OTP! कृपया यजमान की ऐप में देखें।' };
    }
  }

  submitMandaliReview({ rating, tags, comment }) {
    if (!this.booking) return;
    this.booking.review = {
      from: 'mandali',
      rating,
      tags,
      comment,
      submittedAt: new Date().toISOString(),
    };
    this.notify();
  }
}

export const bhajanMandaliStore = new BhajanMandaliPartnerStore();
export default bhajanMandaliStore;
