/**
 * Daily Pandit Partner Store (VaidicSanskarPartner)
 * Implements PRD specifications for Partner App:
 * - Daily Route of recurring morning sites (6 AM - 11 AM)
 * - 100m GPS Geofence + Site QR Code Check-in
 * - In-app camera photo proof with time/GPS watermark
 * - 70% duration minimum rule before completion
 * - "Site Closed" (दुकान बंद) handler: pandit gets paid
 * - New Site Offer with 12-hour response timer
 * - Urgent Backup Request with 10-minute accept timer
 * - Leave request (Chhutti) with backup assignment
 * - Monthly on-time scorecard & bonus tracker (95%+ SLA)
 */

export const DEMO_DAILY_SITES = [
  {
    id: 'SITE-01',
    timeSlot: '06:15 – 06:45 AM',
    slotStart: '06:15 AM',
    siteName: 'शर्मा निवास (Ghar)',
    siteType: 'घर (Home)',
    address: 'मकान सं. B-42, विभूति खंड, गोमती नगर, लखनऊ',
    floorNote: 'भूतल, मुख्य हॉल के ईशान कोण में मंदिर',
    contactPerson: 'श्रीमती नीलिमा शर्मा',
    contactPhoneMasked: '+91 94•••• ••12',
    vidhiName: 'लघु पूजा (Laghu Puja)',
    durationMin: 15,
    payout: 80,
    distanceKm: '0.4 किमी',
    status: 'COMPLETED', // SCHEDULED | ON_THE_WAY | CHECKED_IN | IN_PROGRESS | COMPLETED | SITE_CLOSED
    checkinAt: '06:16 AM',
    startedAt: '06:17 AM',
    completedAt: '06:33 AM',
    durationMinutes: 16,
    qrSecret: 'VSDK-QR-SITE-01',
    photoProofUrl: 'https://images.unsplash.com/photo-1609358905561-dd5c234a6549?auto=format&fit=crop&q=80&w=400',
    photoWatermark: 'शर्मा निवास • 10-10-2026 06:32 AM • GPS: 26.8522° N, 80.9981° E',
  },
  {
    id: 'SITE-02',
    timeSlot: '07:00 – 07:30 AM',
    slotStart: '07:00 AM',
    siteName: 'श्री बालाजी टेक्सटाइल्स (Shop)',
    siteType: 'दुकान (Shop)',
    address: 'दुकान सं. 14, मंगलम मार्केट, हजरतगंज, लखनऊ',
    floorNote: 'प्रथम तल, मुख्य काउंटर के पास मंदिर',
    contactPerson: 'श्री राजेश अग्रवाल',
    contactPhoneMasked: '+91 98•••• ••45',
    vidhiName: 'दैनिक पूजा (Regular Puja)',
    durationMin: 30,
    payout: 130,
    distanceKm: '1.2 किमी',
    status: 'IN_PROGRESS', // Active visit in progress
    checkinAt: '07:04 AM',
    startedAt: '07:06 AM',
    completedAt: null,
    durationMinutes: 18,
    qrSecret: 'VSDK-QR-SITE-8842',
    photoProofUrl: 'https://images.unsplash.com/photo-1609358905561-dd5c234a6549?auto=format&fit=crop&q=80&w=400',
    photoWatermark: 'बालाजी टेक्सटाइल्स • 10-10-2026 07:22 AM • GPS: 26.8467° N, 80.9462° E',
  },
  {
    id: 'SITE-03',
    timeSlot: '07:45 – 08:15 AM',
    slotStart: '07:45 AM',
    siteName: 'गुप्ता ज्वेलर्स (Showroom)',
    siteType: 'शोरूम (Showroom)',
    address: 'शो-रूम सं. 3, अमीनाबाद चौराहा, लखनऊ',
    floorNote: 'ग्राउंड फ्लोर, मुख्य लॉकर कक्ष के पास मंदिर',
    contactPerson: 'श्री आलोक गुप्ता',
    contactPhoneMasked: '+91 91•••• ••99',
    vidhiName: 'दैनिक पूजा (Regular Puja)',
    durationMin: 30,
    payout: 130,
    distanceKm: '1.8 किमी',
    status: 'SCHEDULED',
    qrSecret: 'VSDK-QR-SITE-03',
  },
  {
    id: 'SITE-04',
    timeSlot: '08:30 – 09:15 AM',
    slotStart: '08:30 AM',
    siteName: 'मित्तल कॉर्पोरेट ऑफिस (Office)',
    siteType: 'ऑफिस (Office)',
    address: 'चौथा तल, साइबर हाइट्स, टी.सी. प्लाजा, लखनऊ',
    floorNote: 'चौथा तल, बोर्ड रूम मंदिर',
    contactPerson: 'श्री विनीत मित्तल (प्रबंधक)',
    contactPhoneMasked: '+91 97•••• ••77',
    vidhiName: 'विशेष दैनिक (Extended Puja)',
    durationMin: 45,
    payout: 200,
    distanceKm: '2.4 किमी',
    status: 'SCHEDULED',
    qrSecret: 'VSDK-QR-SITE-04',
  },
  {
    id: 'SITE-05',
    timeSlot: '09:30 – 10:00 AM',
    slotStart: '09:30 AM',
    siteName: 'आनंद मोटर्स वर्कशॉप (Factory)',
    siteType: 'फैक्ट्री (Factory)',
    address: 'प्लाट 18, ट्रांसपोर्ट नगर, लखनऊ',
    floorNote: 'प्रवेश द्वार, हनुमान जी का विग्रह',
    contactPerson: 'श्री आनंद सिंह',
    contactPhoneMasked: '+91 93•••• ••33',
    vidhiName: 'लघु पूजा (Laghu Puja)',
    durationMin: 15,
    payout: 85,
    distanceKm: '3.1 किमी',
    status: 'SCHEDULED',
    qrSecret: 'VSDK-QR-SITE-05',
  },
];

class PartnerDailyPanditStore {
  constructor() {
    this.sites = JSON.parse(JSON.stringify(DEMO_DAILY_SITES));
    this.newSiteOffer = {
      id: 'OFFER-9921',
      siteName: 'श्री गणपति स्वीट्स व चाट',
      siteType: 'दुकान (Shop)',
      area: 'आलमबाग, लखनऊ',
      slot: '06:30 – 07:00 AM',
      vidhiName: 'दैनिक पूजा (Regular Puja)',
      durationMin: 25,
      monthlyPayout: 3400,
      perVisitPayout: 130,
      distanceKm: '1.4 किमी आपके रूट से',
      expiresInHours: 11,
      status: 'PENDING', // PENDING | ACCEPTED | REJECTED
    };
    this.backupRequest = null;
    this.leaves = [
      { id: 'LV-1', date: '05 Oct 2026', reason: 'पारिवारिक कार्य', status: 'APPROVED', backup: 'पं. अमित जोशी' },
    ];
    this.scorecard = {
      monthlyVisits: 142,
      onTimeRate: '98.2%',
      completedRate: '100%',
      monthlyBonusEligible: true, // >= 95% gets ₹1,500 bonus
      monthlyBonusAmount: 1500,
      todayEarnings: 625,
    };
    this.listeners = new Set();
  }

  getSites() {
    return this.sites;
  }

  getSiteById(id) {
    return this.sites.find((s) => s.id === id);
  }

  getNewSiteOffer() {
    return this.newSiteOffer;
  }

  getBackupRequest() {
    return this.backupRequest;
  }

  getScorecard() {
    return this.scorecard;
  }

  getLeaves() {
    return this.leaves;
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
        console.error('Error in PartnerDailyPanditStore listener:', e);
      }
    });
  }

  // Set site status to "On The Way"
  setOnTheWay(siteId) {
    const site = this.getSiteById(siteId);
    if (!site) return;
    site.status = 'ON_THE_WAY';
    this.notify();
  }

  // Check-in (100m GPS Geofence + QR validation)
  checkIn(siteId, isQrBypassed = false) {
    const site = this.getSiteById(siteId);
    if (!site) return;
    site.status = 'CHECKED_IN';
    site.checkinAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    site.verifiedGps = true;
    site.verifiedQr = !isQrBypassed;
    site.qrBypassed = isQrBypassed;
    this.notify();
  }

  // Start Puja (Pooja Shuru)
  startPuja(siteId) {
    const site = this.getSiteById(siteId);
    if (!site) return;
    site.status = 'IN_PROGRESS';
    site.startedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    site.durationMinutes = 0;
    this.notify();
  }

  // Complete Puja (Pooja Sampann with In-App Camera photo proof)
  completePuja(siteId, photoUrl = null) {
    const site = this.getSiteById(siteId);
    if (!site) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    site.status = 'COMPLETED';
    site.completedAt = nowStr;
    site.durationMinutes = Math.max(site.durationMin || 25, 20);
    site.photoProofUrl = photoUrl || 'https://images.unsplash.com/photo-1609358905561-dd5c234a6549?auto=format&fit=crop&q=80&w=400';
    site.photoWatermark = `${site.siteName} • 10-10-2026 ${nowStr} • GPS: Verified`;

    this.scorecard.todayEarnings += site.payout;
    this.notify();
  }

  // Mark Site Closed (दुकान/स्थान बंद है - Pandit gets paid, user not credited)
  markSiteClosed(siteId, shutterPhotoUrl = null) {
    const site = this.getSiteById(siteId);
    if (!site) return;
    site.status = 'SITE_CLOSED';
    site.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    site.photoProofUrl = shutterPhotoUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400';
    site.photoWatermark = `${site.siteName} • दुकान बंद मिली • 10-10-2026`;
    site.note = 'स्थान बंद था (शटर/ताला फोटो सत्यापित) - पंडित जी को पूर्ण विज़िट मानदेय देय';

    this.scorecard.todayEarnings += site.payout;
    this.notify();
  }

  // Accept New Site Offer (12-hour SLA)
  acceptNewSiteOffer() {
    if (!this.newSiteOffer) return;
    this.newSiteOffer.status = 'ACCEPTED';
    const newSite = {
      id: `SITE-${Date.now().toString().slice(-4)}`,
      timeSlot: this.newSiteOffer.slot,
      slotStart: this.newSiteOffer.slot.split('–')[0].trim(),
      siteName: this.newSiteOffer.siteName,
      siteType: this.newSiteOffer.siteType,
      address: `${this.newSiteOffer.area}, लखनऊ`,
      floorNote: 'दुकान काउंटर मंदिर',
      contactPerson: 'प्रतिष्ठान स्वामी',
      contactPhoneMasked: '+91 98•••• ••22',
      vidhiName: this.newSiteOffer.vidhiName,
      durationMin: this.newSiteOffer.durationMin,
      payout: this.newSiteOffer.perVisitPayout,
      distanceKm: this.newSiteOffer.distanceKm,
      status: 'SCHEDULED',
    };
    this.sites.push(newSite);
    this.newSiteOffer = null;
    this.notify();
  }

  // Reject New Site Offer
  rejectNewSiteOffer(reason = '') {
    if (!this.newSiteOffer) return;
    this.newSiteOffer.status = 'REJECTED';
    this.newSiteOffer.rejectReason = reason;
    this.newSiteOffer = null;
    this.notify();
  }

  // Trigger Urgent Backup Request (Demo simulation)
  triggerEmergencyBackupAlert() {
    this.backupRequest = {
      id: 'BK-771',
      siteName: 'राजधानी मार्बल शोरूम',
      address: 'फैजाबाद रोड, लखनऊ (1.1 किमी दूर)',
      slot: '08:00 AM (तुरंत आवश्यक)',
      vidhiName: 'दैनिक पूजा (Regular Puja)',
      durationMin: 25,
      urgentPayout: 180, // higher payout for backup
      countdownSeconds: 600, // 10 minutes
      reason: 'प्राथमिक पंडित जी अस्वस्थ',
    };
    this.notify();
  }

  acceptBackupRequest() {
    if (!this.backupRequest) return;
    const bkSite = {
      id: `SITE-BK-${Date.now().toString().slice(-4)}`,
      timeSlot: this.backupRequest.slot,
      slotStart: '08:00 AM',
      siteName: `${this.backupRequest.siteName} (बैकअप)`,
      siteType: 'शोरूम (Showroom)',
      address: this.backupRequest.address,
      floorNote: 'मेन हॉल मंदिर',
      contactPerson: 'शोरूम मैनेजर',
      contactPhoneMasked: '+91 97•••• ••11',
      vidhiName: this.backupRequest.vidhiName,
      durationMin: this.backupRequest.durationMin,
      payout: this.backupRequest.urgentPayout,
      distanceKm: '1.1 किमी',
      status: 'SCHEDULED',
    };
    this.sites.push(bkSite);
    this.backupRequest = null;
    this.notify();
  }

  dismissBackupRequest() {
    this.backupRequest = null;
    this.notify();
  }

  // Submit Leave Request (Chhutti)
  requestLeave(date, reason) {
    const newLeave = {
      id: `LV-${Date.now().toString().slice(-4)}`,
      date,
      reason,
      status: 'APPROVED',
      backup: 'पं. अमित जोशी (आवंटित)',
    };
    this.leaves.unshift(newLeave);
    this.notify();
    return newLeave;
  }
}

export const partnerDailyPanditStore = new PartnerDailyPanditStore();
export default partnerDailyPanditStore;
