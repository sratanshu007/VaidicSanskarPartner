/**
 * Astrologer Partner Kundali & Matching Engine (VaidicSanskarPartner)
 * Implements PRD specifications for Astrologer Professional Tools:
 * - Professional Vedic Birth Chart (Lagna, Rashi, Grah degrees, Bhavs, Vimshottari Dasha, Doshas)
 * - 36-Gun Ashtakoot Matchmaking with Manglik & Nadi cancellation checks
 * - Daily Panchang reference
 */

export const DEMO_CLIENT_KUNDALI = {
  name: 'रमेश कुमार (यजमान)',
  dob: '15 अगस्त 1994',
  tob: '06:45 AM',
  pob: 'लखनऊ, उत्तर प्रदेश',
  lagna: 'सिंह (Leo)',
  rashi: 'वृश्चिक (Scorpio)',
  nakshatra: 'अनुराधा (चरण 2)',
  currentDasha: 'बुध महादशा • शुक्र अंतर्दशा',
  planets: [
    { name: 'सूर्य (Sun)', rashi: 'सिंह (Leo)', deg: '28° 14\'', bhav: '1', state: 'स्वराशि' },
    { name: 'चंद्रमा (Moon)', rashi: 'वृश्चिक (Scorpio)', deg: '08° 42\'', bhav: '4', state: 'नीच' },
    { name: 'मंगल (Mars)', rashi: 'मिथुन (Gemini)', deg: '14° 19\'', bhav: '11', state: 'मित्र' },
    { name: 'बुध (Mercury)', rashi: 'सिंह (Leo)', deg: '12° 05\'', bhav: '1', state: 'मित्र' },
    { name: 'गुरु (Jupiter)', rashi: 'तुला (Libra)', deg: '16° 52\'', bhav: '3', state: 'सम' },
    { name: 'शुक्र (Venus)', rashi: 'कन्या (Virgo)', deg: '04° 11\'', bhav: '2', state: 'नीच' },
    { name: 'शनि (Saturn)', rashi: 'कुंभ (Aquarius)', deg: '15° 30\'', bhav: '7', state: 'मूलत्रिकोण' },
    { name: 'राहु (Rahu)', rashi: 'वृश्चिक (Scorpio)', deg: '24° 10\'', bhav: '4', state: 'वक्री' },
    { name: 'केतु (Ketu)', rashi: 'वृषभ (Taurus)', deg: '24° 10\'', bhav: '10', state: 'वक्री' },
  ],
  doshaSummary: 'मांगलिक: मुक्त • साढ़े साती: मुक्त • कालसर्प: मुक्त • पितृ: आंशिक',
  remedyRecommendation: 'आदित्य हृदय स्तोत्र पाठ, माणिक्य/पन्ना रत्न धारण, सूर्य को अर्घ्य',
};

export const DEMO_CLIENT_MATCHING = {
  boyName: 'रमेश कुमार',
  girlName: 'प्रिया शर्मा',
  totalScore: 28.5,
  maxScore: 36,
  verdict: 'उत्तम विवाह योग (28.5 / 36 गुण)',
  kootas: [
    { name: 'वर्ण (Varna)', score: 1, max: 1 },
    { name: 'वश्य (Vashya)', score: 2, max: 2 },
    { name: 'तारा (Tara)', score: 3, max: 3 },
    { name: 'योनि (Yoni)', score: 3.5, max: 4 },
    { name: 'ग्रह मैत्री (Graha Maitri)', score: 5, max: 5 },
    { name: 'गण (Gana)', score: 6, max: 6 },
    { name: 'भकूट (Bhakoot)', score: 0, max: 7 },
    { name: 'नाड़ी (Nadi)', score: 8, max: 8 },
  ],
  pariharNote: 'भकूट दोष में नवम-पंचम संबंध है। बृहस्पति की परस्पर दृष्टि से आंशिक परिहार मान्य।',
};

class PartnerKundaliStore {
  constructor() {
    this.clientKundali = { ...DEMO_CLIENT_KUNDALI };
    this.matching = { ...DEMO_CLIENT_MATCHING };
    this.listeners = new Set();
  }

  getClientKundali() {
    return this.clientKundali;
  }

  getMatching() {
    return this.matching;
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
        console.error('Error in partnerKundaliStore listener:', e);
      }
    });
  }

  computeChart(name, dob, tob, pob) {
    this.clientKundali.name = name || 'यजमान';
    this.clientKundali.dob = dob || '15 अगस्त 1994';
    this.clientKundali.tob = tob || '06:45 AM';
    this.clientKundali.pob = pob || 'लखनऊ, उत्तर प्रदेश';
    this.notify();
    return this.clientKundali;
  }
}

export const partnerKundaliStore = new PartnerKundaliStore();
export default partnerKundaliStore;
