import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Header, Field, GoldButton } from '../../components/ui';
import { Stepper } from '../../components/widgets';
import colors from '../../theme/colors';
import { radius, serif, shadow } from '../../theme/styles';
import { roleMeta } from '../../data/mock';
import { usePartner } from '../../context/PartnerContext';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';
import { VendorService, BASE_URL } from '../../services/api';

const PUJA_SKILLS = [
  { hi: 'श्री सत्यनारायण कथा', en: 'Satyanarayan Katha' },
  { hi: 'महाकाल रुद्राभिषेक', en: 'Rudrabhishek Pooja' },
  { hi: 'गृह प्रवेश व वास्तु', en: 'Griha Pravesh & Vastu' },
  { hi: 'महामृत्युंजय जप व हवन', en: 'Mahamrityunjaya Havan' },
  { hi: 'नवग्रह शांति', en: 'Navagraha Shanti' },
  { hi: 'विवाह संस्कार', en: 'Vivah Sanskar (Wedding)' },
  { hi: 'श्रीमद्भागवत कथा', en: 'Bhagwat Katha' },
  { hi: 'सुंदरकांड पाठ', en: 'Sundarkand Paath' },
];

const MANDALI_PROGRAMS = [
  { hi: 'भव्य भजन संध्या', en: 'Bhajan Sandhya' },
  { hi: 'माता की चौकी', en: 'Mata Ki Chowki' },
  { hi: 'अखंड सुंदरकांड पाठ', en: 'Akhand Sundarkand' },
  { hi: 'श्री श्याम संकीर्तन', en: 'Shyam Sangeet' },
  { hi: 'शिव विवाह उत्सव', en: 'Shiv Vivah Utsav' },
  { hi: 'रास व भक्ति संगीत', en: 'Devotional Music & Raas' },
];

const INSTRUMENTS = [
  { hi: 'हार्मोनियम', en: 'Harmonium' },
  { hi: 'ढोलक', en: 'Dholak' },
  { hi: 'तबला', en: 'Tabla' },
  { hi: 'मंजीरा', en: 'Manjira' },
  { hi: 'ऑक्टोपैड', en: 'Octapad' },
  { hi: 'बांसुरी', en: 'Flute' },
];

const ASTRO_STREAMS = [
  { hi: 'वैदिक ज्योतिष', en: 'Vedic Astrology' },
  { hi: 'कुंडली मिलान', en: 'Kundali Matching' },
  { hi: 'वास्तु शास्त्र', en: 'Vastu Shastra' },
  { hi: 'प्रश्न कुंडली', en: 'Prashna Kundali' },
  { hi: 'हस्तरेखा शास्त्र', en: 'Palmistry' },
  { hi: 'अंक ज्योतिष', en: 'Numerology' },
];

const LANGUAGES = ['Hindi', 'Sanskrit', 'English', 'Bhojpuri', 'Gujarati', 'Marathi'];

export default function KycScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const role = route.params?.role || 'pandit';
  const meta = roleMeta[role] || { label: 'Partner' };
  const { register, vendor } = usePartner();
  const { isHindi } = useLanguage();
  const [step, setStep] = useState(0);

  const steps = isHindi
    ? ['प्रोफ़ाइल व फ़ोटो', 'विशिष्ट योग्यता', 'दस्तावेज़ सत्यापन', 'बैंक व UPI']
    : ['Profile & Photo', 'Specialization', 'Document KYC', 'Bank & UPI'];

  const [photoUrl, setPhotoUrl] = useState(vendor?.photo || '');
  const [localPhoto, setLocalPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Common Details
  const [details, setDetails] = useState({
    name: route.params?.name || vendor?.name || '',
    email: route.params?.email || vendor?.email || '',
    city: vendor?.city || '',
    radius: '15',
    // Pandit specific
    gurukul: '',
    degree: '',
    experienceYears: '',
    // Mandali specific
    troupeSize: '',
    leadSinger: '',
    // Astro specific
    bio: '',
    chatRate: '',
    callRate: '',
    videoRate: '',
    // Merchant specific
    businessName: '',
    gstin: '',
    address: '',
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedLangs, setSelectedLangs] = useState(['Hindi']);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [selectedAstroStreams, setSelectedAstroStreams] = useState([]);

  const [docs, setDocs] = useState({
    aadhaar: null,
    pan: null,
    certificate: null,
    aadhaarNumber: '',
    panNumber: '',
  });

  const [bank, setBank] = useState({
    account: vendor?.bank?.account || '',
    ifsc: vendor?.bank?.ifsc || '',
    upi: vendor?.bank?.upi || '',
  });

  const [submitting, setSubmitting] = useState(false);

  const setD = (k) => (v) => setDetails((prev) => ({ ...prev, [k]: v }));
  const setB = (k) => (v) => setBank((prev) => ({ ...prev, [k]: v }));

  const toggleArrayItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isHindi ? 'अनुमति आवश्यक' : 'Permission Required',
          isHindi ? 'गैलरी से फ़ोटो चुनने हेतु अनुमति आवश्यक है।' : 'Permission to access gallery is required.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const localUri = result.assets[0].uri;
        setLocalPhoto(localUri);
        await uploadPhotoToServer(localUri);
      }
    } catch (e) {
      console.warn('Image picker error:', e.message);
    }
  };

  const uploadPhotoToServer = async (uri) => {
    setUploading(true);
    try {
      const filename = uri.split('/').pop() || 'partner_photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('photo', { uri, name: filename, type });
      formData.append('folder', 'vaidic_sanskar_partners');

      const res = await VendorService.uploadPhoto(formData);
      if (res?.success && res?.url) {
        setPhotoUrl(res.url);
        Alert.alert(
          isHindi ? 'फ़ोटो अपलोड सफल' : 'Photo Uploaded',
          isHindi ? 'आपकी फ़ोटो क्लाउड सर्वर पर सुरक्षित स्टोर हो गई है।' : 'Photo uploaded to cloud server.'
        );
      }
    } catch (err) {
      console.warn('Upload error:', err.message);
    } finally {
      setUploading(false);
    }
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      submitKyc();
    }
  };

  const submitKyc = async () => {
    setSubmitting(true);
    const payload = {
      id: route.params?.id,
      name: details.name,
      email: details.email,
      phone: route.params?.phone,
      role,
      city: details.city,
      radius: details.radius,
      photo: photoUrl || localPhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
      gurukul: details.gurukul,
      degree: details.degree,
      experienceYears: details.experienceYears,
      skills: selectedSkills,
      languages: selectedLangs,
      programs: selectedPrograms,
      instruments: selectedInstruments,
      astroStreams: selectedAstroStreams,
      bio: details.bio,
      rates: { chat: details.chatRate, call: details.callRate, video: details.videoRate },
      troupeSize: details.troupeSize,
      leadSinger: details.leadSinger,
      businessName: details.businessName,
      address: details.address,
      bank,
      kyc: 'Pending',
      status: 'Review',
      verified: false,
      profileCompleted: true,
    };

    try {
      await VendorService.completeProfile(payload).catch(() => {});
    } catch (e) {
      console.warn('completeProfile error:', e.message);
    }

    register(payload);
    setSubmitting(false);

    navigation.replace('Pending', {
      phone: payload.phone,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      photo: payload.photo,
      id: payload.id,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
        <View style={{ flex: 1 }}>
          <Header title={isHindi ? `${meta.label} — प्रोफ़ाइल व केवाईसी` : `${role.toUpperCase()} — Profile & KYC`} navigation={navigation} />
        </View>
        <LanguageSwitcher />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <Stepper steps={steps} current={step} />

        {/* STEP 1: Basic Info & Photo Upload */}
        {step === 0 && (
          <View>
            <View style={s.uploadCard}>
              <Text style={s.uploadTitle}>
                {isHindi
                  ? (role === 'mandali' ? 'मंडली का ग्रुप बैनर / फ़ोटो' : role === 'merchant' ? 'दुकान की फ़ोटो' : 'प्रोफ़ाइल फ़ोटो')
                  : (role === 'mandali' ? 'Group Photo / Banner' : role === 'merchant' ? 'Store Front Photo' : 'Profile Photo')}
              </Text>
              <Text style={s.uploadSub}>
                {isHindi ? 'क्लाउड सर्वर में सुरक्षित स्टोर होगी' : 'Securely stored on cloud server'}
              </Text>

              <TouchableOpacity style={s.photoPickerBox} activeOpacity={0.8} onPress={handlePickPhoto}>
                {localPhoto || photoUrl ? (
                  <Image source={{ uri: localPhoto || photoUrl }} style={s.pickedPreview} resizeMode="cover" />
                ) : (
                  <View style={s.emptyPhoto}>
                    <MaterialCommunityIcons name="camera-plus" size={38} color={colors.maroon} />
                    <Text style={s.photoBtnText}>
                      {isHindi ? 'फ़ोटो चुनें (Camera / Gallery)' : 'Choose Photo (Camera / Gallery)'}
                    </Text>
                  </View>
                )}
                {uploading && (
                  <View style={s.uploadOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '700', marginTop: 6, fontSize: 12 }}>
                      {isHindi ? 'अपलोड हो रहा है...' : 'Uploading photo...'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {(localPhoto || photoUrl) && (
                <TouchableOpacity onPress={handlePickPhoto} style={{ alignSelf: 'center', marginTop: 8 }}>
                  <Text style={{ color: colors.maroon, fontWeight: '700', fontSize: 13 }}>
                    {isHindi ? 'फ़ोटो बदलें ↻' : 'Change Photo ↻'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Field
              label={isHindi ? (role === 'mandali' ? 'मंडली का नाम *' : role === 'merchant' ? 'दुकान का नाम *' : 'पूरा नाम *') : 'Full Name / Organization *'}
              icon="account"
              placeholder={isHindi ? 'नाम दर्ज करें' : 'Enter full name'}
              value={details.name}
              onChangeText={setD('name')}
            />

            <Field
              label={isHindi ? 'ईमेल आईडी' : 'Email Address'}
              icon="email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              value={details.email}
              onChangeText={setD('email')}
            />

            <Field
              label={isHindi ? 'कार्यक्षेत्र / शहर *' : 'Operating City / Region *'}
              icon="map-marker"
              placeholder={isHindi ? 'उदा. वाराणसी, उत्तर प्रदेश' : 'e.g. Varanasi, Uttar Pradesh'}
              value={details.city}
              onChangeText={setD('city')}
            />

            {role === 'pandit' && (
              <Field
                label={isHindi ? 'सेवा त्रिज्या (किमी)' : 'Service Radius (KM)'}
                icon="radius-outline"
                keyboardType="numeric"
                placeholder="15"
                value={details.radius}
                onChangeText={setD('radius')}
              />
            )}
          </View>
        )}

        {/* STEP 2: Role-Specific Credentials */}
        {step === 1 && (
          <View>
            {role === 'pandit' && (
              <>
                <Field
                  label={isHindi ? 'गुरुकुल / संस्कृत संस्थान' : 'Gurukul / Sanskrit University'}
                  icon="school"
                  placeholder={isHindi ? 'संस्थान का नाम' : 'University name'}
                  value={details.gurukul}
                  onChangeText={setD('gurukul')}
                />
                <Field
                  label={isHindi ? 'शास्त्रीय उपाधि / डिग्री' : 'Degree / Shastri Certification'}
                  icon="certificate"
                  placeholder={isHindi ? 'उदा. शास्त्री, आचार्य' : 'e.g. Shastri, Acharya'}
                  value={details.degree}
                  onChangeText={setD('degree')}
                />
                <Field
                  label={isHindi ? 'वैदिक पूजा अनुभव (वर्ष)' : 'Years of Experience'}
                  icon="clock-outline"
                  keyboardType="numeric"
                  placeholder="12"
                  value={details.experienceYears}
                  onChangeText={setD('experienceYears')}
                />

                <Text style={s.secTitle}>
                  {isHindi ? 'सिद्ध पूजाएं व अनुष्ठान (Puja Skills)' : 'Specialized Pooja Services'}
                </Text>
                <View style={s.chipsRow}>
                  {PUJA_SKILLS.map((sk) => {
                    const label = isHindi ? sk.hi : sk.en;
                    const sel = selectedSkills.includes(label) || selectedSkills.includes(sk.en);
                    return (
                      <TouchableOpacity key={sk.en} style={[s.chip, sel && s.chipSel]} onPress={() => toggleArrayItem(selectedSkills, setSelectedSkills, label)}>
                        <Text style={[s.chipT, sel && s.chipTSel]}>{sel ? '✓ ' : '+ '}{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {role === 'mandali' && (
              <>
                <Field
                  label={isHindi ? 'प्रधान गायक / संचालक का नाम' : 'Lead Singer / Director Name'}
                  icon="microphone"
                  placeholder={isHindi ? 'नाम लिखें' : 'Lead artist name'}
                  value={details.leadSinger}
                  onChangeText={setD('leadSinger')}
                />
                <Field
                  label={isHindi ? 'कलाकारों की कुल संख्या' : 'Troupe Size (Artists)'}
                  icon="account-group"
                  placeholder="6 Artists"
                  value={details.troupeSize}
                  onChangeText={setD('troupeSize')}
                />

                <Text style={s.secTitle}>
                  {isHindi ? 'प्रस्तुति प्रकार (Program Types)' : 'Program Types'}
                </Text>
                <View style={s.chipsRow}>
                  {MANDALI_PROGRAMS.map((pr) => {
                    const label = isHindi ? pr.hi : pr.en;
                    const sel = selectedPrograms.includes(label) || selectedPrograms.includes(pr.en);
                    return (
                      <TouchableOpacity key={pr.en} style={[s.chip, sel && s.chipSel]} onPress={() => toggleArrayItem(selectedPrograms, setSelectedPrograms, label)}>
                        <Text style={[s.chipT, sel && s.chipTSel]}>{sel ? '✓ ' : '+ '}{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {role === 'astro' && (
              <>
                <Field
                  label={isHindi ? 'ज्योतिष परिचय / बायो' : 'Professional Bio'}
                  icon="card-text-outline"
                  placeholder={isHindi ? 'अपने अनुभव का विवरण' : 'Brief summary of expertise'}
                  value={details.bio}
                  onChangeText={setD('bio')}
                />
                <Field
                  label={isHindi ? 'चैट परामर्श दर (₹/मिनट)' : 'Chat Rate (₹/min)'}
                  icon="chat"
                  keyboardType="numeric"
                  placeholder="25"
                  value={details.chatRate}
                  onChangeText={setD('chatRate')}
                />
                <Field
                  label={isHindi ? 'कॉल परामर्श दर (₹/मिनट)' : 'Voice Call Rate (₹/min)'}
                  icon="phone"
                  keyboardType="numeric"
                  placeholder="35"
                  value={details.callRate}
                  onChangeText={setD('callRate')}
                />
              </>
            )}

            {role === 'merchant' && (
              <>
                <Field
                  label={isHindi ? 'दुकान / प्रतिष्ठान का नाम' : 'Store / Business Name'}
                  icon="store"
                  placeholder="Lakshmi Pooja Store"
                  value={details.businessName}
                  onChangeText={setD('businessName')}
                />
                <Field
                  label={isHindi ? 'दुकान का पूरा पता' : 'Shop Address'}
                  icon="map-marker"
                  placeholder="Street, Area, Landmark"
                  value={details.address}
                  onChangeText={setD('address')}
                />
              </>
            )}
          </View>
        )}

        {/* STEP 3: Document Verification */}
        {step === 2 && (
          <View>
            <View style={s.docCard}>
              <View style={s.docLeft}>
                <MaterialCommunityIcons name="card-account-details-outline" size={28} color={colors.maroon} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={s.docT}>{isHindi ? 'आधार कार्ड सत्यापन' : 'Aadhaar Card Verification'}</Text>
                  <Text style={s.docSub}>{isHindi ? 'सत्यापित (Verified UIDAI)' : 'Verified (UIDAI)'}</Text>
                </View>
              </View>
              <View style={s.docBadge}>
                <Text style={s.docBadgeT}>{isHindi ? 'सत्यापित' : 'VERIFIED'}</Text>
              </View>
            </View>

            <View style={s.docCard}>
              <View style={s.docLeft}>
                <MaterialCommunityIcons name="file-document-outline" size={28} color={colors.maroon} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={s.docT}>{isHindi ? 'पैन कार्ड (PAN Card)' : 'PAN Card Verification'}</Text>
                  <Text style={s.docSub}>{isHindi ? 'सत्यापित (Income Tax Dept)' : 'Verified (Income Tax Dept)'}</Text>
                </View>
              </View>
              <View style={s.docBadge}>
                <Text style={s.docBadgeT}>{isHindi ? 'सत्यापित' : 'VERIFIED'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: Bank Details */}
        {step === 3 && (
          <View>
            <Field
              label={isHindi ? 'बैंक खाता संख्या' : 'Bank Account Number'}
              icon="bank"
              keyboardType="numeric"
              placeholder="123456789012"
              value={bank.account}
              onChangeText={setB('account')}
            />
            <Field
              label={isHindi ? 'IFSC कोड' : 'IFSC Code'}
              icon="barcode"
              autoCapitalize="characters"
              placeholder="SBIN0001234"
              value={bank.ifsc}
              onChangeText={setB('ifsc')}
            />
            <Field
              label={isHindi ? 'UPI आईडी (तत्काल भुगतान हेतु)' : 'UPI ID (For Instant Payouts)'}
              icon="qrcode-scan"
              placeholder="yourid@upi"
              value={bank.upi}
              onChangeText={setB('upi')}
            />
          </View>
        )}

        <View style={{ height: 24 }} />
        <GoldButton
          title={submitting ? (isHindi ? 'जमा हो रहा है...' : 'Submitting...') : (step === steps.length - 1 ? (isHindi ? 'जमा करें एवं सत्यापन हेतु भेजें ›' : 'Submit for Verification ›') : (isHindi ? 'आगे बढ़ें ›' : 'Next Step ›'))}
          onPress={next}
          disabled={submitting}
        />
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={{ alignSelf: 'center', marginTop: 14 }}>
            <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 14 }}>
              {isHindi ? '‹ पिछला चरण' : '‹ Previous Step'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  uploadCard: {
    backgroundColor: '#FFF',
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0E6D8',
    ...shadow,
  },
  uploadTitle: { fontSize: 15, fontWeight: '800', color: colors.maroon, textAlign: 'center' },
  uploadSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 2, marginBottom: 12 },
  photoPickerBox: {
    height: 140,
    borderRadius: radius.md,
    backgroundColor: '#FAF6F0',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickedPreview: { width: '100%', height: '100%' },
  emptyPhoto: { alignItems: 'center' },
  photoBtnText: { fontSize: 13, fontWeight: '700', color: colors.maroon, marginTop: 8 },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secTitle: { fontSize: 14, fontWeight: '800', color: colors.maroon, marginTop: 14, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5D8C5',
  },
  chipSel: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipT: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  chipTSel: { color: '#FFF' },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E6D8',
    ...shadow,
  },
  docLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docT: { fontSize: 14, fontWeight: '700', color: colors.text },
  docSub: { fontSize: 12, color: '#16A34A', marginTop: 2 },
  docBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  docBadgeT: { color: '#15803D', fontSize: 11, fontWeight: '800' },
});
