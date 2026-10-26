import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePartner } from '../../context/PartnerContext';
import { VendorService } from '../../services/api';
import colors from '../../theme/colors';

export default function ProfileSetupScreen({ navigation }) {
  const { vendor, updateVendor } = usePartner();

  // Basic Profile States
  const [fullName, setFullName] = useState(vendor?.name || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [email, setEmail] = useState(vendor?.email || '');
  const [city, setCity] = useState(vendor?.city || '');
  const [experienceYears, setExperienceYears] = useState(String(vendor?.experienceYears || vendor?.experience || ''));
  const [gurukul, setGurukul] = useState(vendor?.gurukul || vendor?.degree || '');
  const [photoUri, setPhotoUri] = useState(vendor?.photo || null);

  // KYC States
  const [preferredId, setPreferredId] = useState(vendor?.preferredIdType || 'aadhaar'); // 'aadhaar' | 'pan' | 'both'
  const [aadhaarNumber, setAadhaarNumber] = useState(vendor?.aadhaarNumber ? formatAadhaar(vendor.aadhaarNumber) : '');
  const [panNumber, setPanNumber] = useState(vendor?.panNumber || '');
  const [aadhaarFrontUri, setAadhaarFrontUri] = useState(vendor?.aadhaarFront || vendor?.idCardFront || null);
  const [aadhaarBackUri, setAadhaarBackUri] = useState(vendor?.aadhaarBack || vendor?.idCardBack || null);
  const [panFrontUri, setPanFrontUri] = useState(vendor?.panFront || vendor?.panCardPhoto || null);

  // Format Aadhaar: 12 digits into "XXXX XXXX XXXX"
  function formatAadhaar(val) {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  }

  const handleAadhaarChange = (text) => {
    setAadhaarNumber(formatAadhaar(text));
  };

  const handlePanChange = (text) => {
    const clean = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    setPanNumber(clean);
  };

  // Auto-upload chosen image to backend so Admin dashboard gets reachable image URL
  const uploadAndSet = async (uri, setter) => {
    setter(uri);
    try {
      const filename = uri.split('/').pop() || 'kyc_doc.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('photo', { uri, name: filename, type });
      formData.append('folder', 'vaidic_sanskar_kyc');
      const res = await VendorService.uploadPhoto(formData);
      if (res?.success && (res.url || res.secure_url)) {
        setter(res.url || res.secure_url);
      }
    } catch (err) {
      console.warn('KYC auto-upload error:', err?.message || err);
    }
  };

  // Generic Image Picker for Avatar and KYC Documents
  const pickImage = async (setter, title = 'Select Photo', aspect = [4, 3]) => {
    Alert.alert(
      title,
      'Choose upload source / फ़ोटो का माध्यम चुनें:',
      [
        {
          text: 'Camera (कैमरा)',
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) {
                Alert.alert('Permission needed', 'Camera permission is required to take photo.');
                return;
              }
              const res = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect,
                quality: 0.8,
              });
              if (!res.canceled && res.assets?.[0]?.uri) {
                await uploadAndSet(res.assets[0].uri, setter);
              }
            } catch (e) {
              console.warn('Camera error:', e);
            }
          },
        },
        {
          text: 'Gallery (गैलरी)',
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) {
                Alert.alert('Permission needed', 'Gallery permission is required to select photo.');
                return;
              }
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect,
                quality: 0.8,
              });
              if (!res.canceled && res.assets?.[0]?.uri) {
                await uploadAndSet(res.assets[0].uri, setter);
              }
            } catch (e) {
              console.warn('Gallery picker error:', e);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNext = () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert('Required Field', 'Please enter your full name / अपना पूरा नाम दर्ज करें');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required Field', 'Please enter your city / location (e.g. Varanasi, Noida)');
      return;
    }

    // KYC Validations based on chosen preferred ID
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
    const cleanPan = panNumber.trim().toUpperCase();

    if (preferredId === 'aadhaar' || preferredId === 'both') {
      if (cleanAadhaar.length < 12) {
        Alert.alert('Aadhaar Required', 'Please enter a valid 12-digit Aadhaar Card number / 12-अंकों का आधार कार्ड नंबर दर्ज करें।');
        return;
      }
      if (!aadhaarFrontUri) {
        Alert.alert('Aadhaar Photo Required', 'Please upload your Aadhaar Card front photo for verification / आधार कार्ड की फ़ोटो अपलोड करें।');
        return;
      }
    }

    if (preferredId === 'pan' || preferredId === 'both') {
      if (cleanPan.length < 10) {
        Alert.alert('PAN Card Required', 'Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).');
        return;
      }
      if (!panFrontUri) {
        Alert.alert('PAN Photo Required', 'Please upload your PAN Card photo for verification / पैन कार्ड की फ़ोटो अपलोड करें।');
        return;
      }
    }

    // Bundle all details into Partner Context
    updateVendor({
      name: trimmedName,
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      experienceYears: experienceYears.trim() ? Number(experienceYears.trim()) || experienceYears.trim() : 5,
      gurukul: gurukul.trim(),
      degree: gurukul.trim(),
      photo: photoUri,
      // KYC Information
      preferredIdType: preferredId,
      aadhaarNumber: cleanAadhaar,
      panNumber: cleanPan,
      idCardFront: preferredId === 'pan' ? panFrontUri : aadhaarFrontUri,
      idCardBack: preferredId === 'pan' ? null : aadhaarBackUri,
      aadhaarFront: aadhaarFrontUri,
      aadhaarBack: aadhaarBackUri,
      panFront: panFrontUri,
      kycDocs: true,
      kyc: 'Pending',
      status: 'Review',
    });

    navigation.navigate('SelectServices');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.container}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Navigation */}
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={s.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
            </TouchableOpacity>
            <View style={s.headerTextWrap}>
              <Text style={s.headerTitle}>Complete Your Profile</Text>
              <Text style={s.headerSubtitle}>
                Step 1: Personal Details & KYC Document Verification
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Add Profile Photo Avatar Section */}
          <View style={s.avatarContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => pickImage(setPhotoUri, 'Upload Profile Photo', [1, 1])}
              style={s.avatarCircle}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={s.avatarImage} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <View style={s.cameraIconBadge}>
                    <MaterialCommunityIcons
                      name="camera-plus-outline"
                      size={26}
                      color="#67101F"
                    />
                  </View>
                  <Text style={s.addPhotoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {photoUri && (
              <TouchableOpacity
                onPress={() => pickImage(setPhotoUri, 'Change Profile Photo', [1, 1])}
                style={{ marginTop: 6 }}
              >
                <Text style={s.changePhotoText}>Change Photo ↻</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* FORM: BASIC & PROFESSIONAL DETAILS */}
          <View style={s.form}>
            <View style={s.sectionHeader}>
              <MaterialCommunityIcons name="account-details" size={20} color="#67101F" />
              <Text style={s.sectionHeading}>Personal & Vedic Credentials</Text>
            </View>

            {/* Full Name */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Full Name / पूरा नाम *</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Pt. Ramesh Sharma"
                  placeholderTextColor="#A08E90"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Mobile Number / मोबाइल नंबर</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 Mobile Number"
                  placeholderTextColor="#A08E90"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Email Address / ईमेल</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="partner@vaidicsanskar.in"
                  placeholderTextColor="#A08E90"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* City */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>City / Location / नगर *</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Varanasi, Noida, New Delhi"
                  placeholderTextColor="#A08E90"
                />
              </View>
            </View>

            {/* Experience */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Years of Experience / अनुभव (वर्ष)</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  placeholder="e.g. 5 or 10"
                  placeholderTextColor="#A08E90"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Gurukul / Degree */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Gurukul / Shastri Qualification</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={gurukul}
                  onChangeText={setGurukul}
                  placeholder="e.g. Sampurnanand Sanskrit Vishwavidyalaya, Shastri"
                  placeholderTextColor="#A08E90"
                />
              </View>
            </View>

            {/* KYC & IDENTITY VERIFICATION SECTION */}
            <View style={s.kycDivider} />

            <View style={s.sectionHeader}>
              <Ionicons name="shield-checkmark" size={22} color="#1E8E4A" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={s.sectionHeading}>KYC & Identity Document (दस्तावेज़ सत्यापन)</Text>
                <Text style={s.sectionSub}>Choose your preferred government ID to submit for Admin approval</Text>
              </View>
            </View>

            {/* Preferred ID Selector Tabs */}
            <View style={s.idTabContainer}>
              <TouchableOpacity
                style={[s.idTabBtn, preferredId === 'aadhaar' && s.idTabBtnActive]}
                onPress={() => setPreferredId('aadhaar')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={18}
                  color={preferredId === 'aadhaar' ? '#FFFFFF' : '#67101F'}
                />
                <Text style={[s.idTabBtnText, preferredId === 'aadhaar' && s.idTabBtnTextActive]}>
                  Aadhaar Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.idTabBtn, preferredId === 'pan' && s.idTabBtnActive]}
                onPress={() => setPreferredId('pan')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={preferredId === 'pan' ? '#FFFFFF' : '#67101F'}
                />
                <Text style={[s.idTabBtnText, preferredId === 'pan' && s.idTabBtnTextActive]}>
                  PAN Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.idTabBtn, preferredId === 'both' && s.idTabBtnActive]}
                onPress={() => setPreferredId('both')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={18}
                  color={preferredId === 'both' ? '#FFFFFF' : '#67101F'}
                />
                <Text style={[s.idTabBtnText, preferredId === 'both' && s.idTabBtnTextActive]}>
                  Both (दोनों)
                </Text>
              </TouchableOpacity>
            </View>

            {/* AADHAAR CARD FIELDS */}
            {(preferredId === 'aadhaar' || preferredId === 'both') && (
              <View style={s.docCard}>
                <View style={s.docHeader}>
                  <MaterialCommunityIcons name="card-account-details" size={22} color="#67101F" />
                  <Text style={s.docTitle}>Aadhaar Card Details (आधार विवरण)</Text>
                </View>

                {/* Aadhaar Number */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>12-Digit Aadhaar Number *</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={[s.input, { letterSpacing: 2, fontWeight: '700' }]}
                      value={aadhaarNumber}
                      onChangeText={handleAadhaarChange}
                      placeholder="XXXX XXXX XXXX"
                      placeholderTextColor="#A08E90"
                      keyboardType="numeric"
                      maxLength={14}
                    />
                  </View>
                </View>

                {/* Aadhaar Front & Back Upload Cards */}
                <Text style={[s.fieldLabel, { marginTop: 12 }]}>Aadhaar Card Photo (आईडी फ़ोटो अपलोड) *</Text>

                <View style={s.uploadRow}>
                  {/* Front Side */}
                  <View style={s.uploadCol}>
                    <Text style={s.uploadSlotLabel}>Front Side (आगे की फ़ोटो) *</Text>
                    {aadhaarFrontUri ? (
                      <View style={s.previewCard}>
                        <Image source={{ uri: aadhaarFrontUri }} style={s.previewImage} resizeMode="cover" />
                        <View style={s.uploadedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#1E8E4A" />
                          <Text style={s.uploadedText}>Attached</Text>
                        </View>
                        <TouchableOpacity
                          style={s.replaceBtn}
                          onPress={() => pickImage(setAadhaarFrontUri, 'Aadhaar Front Side Photo')}
                        >
                          <Text style={s.replaceBtnText}>Change ↻</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={s.uploadBox}
                        activeOpacity={0.8}
                        onPress={() => pickImage(setAadhaarFrontUri, 'Aadhaar Front Side Photo')}
                      >
                        <MaterialCommunityIcons name="camera-plus" size={28} color="#67101F" />
                        <Text style={s.uploadBoxTitle}>Front Side</Text>
                        <Text style={s.uploadBoxSub}>Tap to snap / upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Back Side */}
                  <View style={s.uploadCol}>
                    <Text style={s.uploadSlotLabel}>Back Side (Address)</Text>
                    {aadhaarBackUri ? (
                      <View style={s.previewCard}>
                        <Image source={{ uri: aadhaarBackUri }} style={s.previewImage} resizeMode="cover" />
                        <View style={s.uploadedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#1E8E4A" />
                          <Text style={s.uploadedText}>Attached</Text>
                        </View>
                        <TouchableOpacity
                          style={s.replaceBtn}
                          onPress={() => pickImage(setAadhaarBackUri, 'Aadhaar Back Side Photo')}
                        >
                          <Text style={s.replaceBtnText}>Change ↻</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={s.uploadBox}
                        activeOpacity={0.8}
                        onPress={() => pickImage(setAadhaarBackUri, 'Aadhaar Back Side Photo')}
                      >
                        <MaterialCommunityIcons name="camera-plus" size={28} color="#67101F" />
                        <Text style={s.uploadBoxTitle}>Back Side</Text>
                        <Text style={s.uploadBoxSub}>Optional address proof</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* PAN CARD FIELDS */}
            {(preferredId === 'pan' || preferredId === 'both') && (
              <View style={s.docCard}>
                <View style={s.docHeader}>
                  <MaterialCommunityIcons name="file-document" size={22} color="#67101F" />
                  <Text style={s.docTitle}>PAN Card Details (पैन कार्ड विवरण)</Text>
                </View>

                {/* PAN Number */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>10-Character PAN Number *</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={[s.input, { letterSpacing: 2, fontWeight: '700' }]}
                      value={panNumber}
                      onChangeText={handlePanChange}
                      placeholder="ABCDE1234F"
                      placeholderTextColor="#A08E90"
                      autoCapitalize="characters"
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* PAN Photo Upload */}
                <Text style={[s.fieldLabel, { marginTop: 12 }]}>PAN Card Photo (पैन फ़ोटो) *</Text>
                {panFrontUri ? (
                  <View style={[s.previewCard, { height: 140 }]}>
                    <Image source={{ uri: panFrontUri }} style={s.previewImage} resizeMode="cover" />
                    <View style={s.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#1E8E4A" />
                      <Text style={s.uploadedText}>PAN Attached</Text>
                    </View>
                    <TouchableOpacity
                      style={s.replaceBtn}
                      onPress={() => pickImage(setPanFrontUri, 'PAN Card Photo')}
                    >
                      <Text style={s.replaceBtnText}>Change ↻</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[s.uploadBox, { height: 110 }]}
                    activeOpacity={0.8}
                    onPress={() => pickImage(setPanFrontUri, 'PAN Card Photo')}
                  >
                    <MaterialCommunityIcons name="camera-plus" size={32} color="#67101F" />
                    <Text style={s.uploadBoxTitle}>Upload PAN Card Photo</Text>
                    <Text style={s.uploadBoxSub}>Clear photo showing Name & PAN number</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Security & Admin Assurance Note */}
            <View style={s.securityBanner}>
              <Ionicons name="lock-closed" size={18} color="#D48B28" />
              <Text style={s.securityText}>
                दस्तावेज़ एन्क्रिप्टेड रूप में सीधे एडमिन सत्यापन टीम को भेजे जाते हैं। अनुमोदन के पश्चात ही आप पूजा बुकिंग स्वीकार कर सकेंगे।
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Fixed Action Button */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleNext}
            style={s.nextBtn}
          >
            <Text style={s.nextBtnText}>Continue to Services ›</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1418',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7D686B',
    textAlign: 'center',
    marginTop: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F7EFE6',
    borderWidth: 2,
    borderColor: '#D48B28',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#67101F',
  },
  changePhotoText: {
    fontSize: 12,
    color: '#67101F',
    fontWeight: '700',
  },
  form: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E1418',
    marginLeft: 6,
    fontFamily: 'serif',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#7D686B',
    marginTop: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E1418',
  },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    fontSize: 15,
    color: '#2E1418',
  },
  kycDivider: {
    height: 1,
    backgroundColor: '#EDE3D5',
    marginVertical: 14,
  },
  idTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFE6D9',
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  idTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  idTabBtnActive: {
    backgroundColor: '#67101F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  idTabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#67101F',
  },
  idTabBtnTextActive: {
    color: '#FFFFFF',
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DCCF',
    padding: 16,
    gap: 12,
    elevation: 1,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EEE6',
    paddingBottom: 8,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: 'serif',
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadCol: {
    flex: 1,
  },
  uploadSlotLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7D686B',
    marginBottom: 6,
  },
  uploadBox: {
    height: 110,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D48B28',
    borderStyle: 'dashed',
    backgroundColor: '#FDFBF7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  uploadBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#67101F',
    marginTop: 4,
  },
  uploadBoxSub: {
    fontSize: 10,
    color: '#9C8E8F',
    textAlign: 'center',
    marginTop: 2,
  },
  previewCard: {
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1E8E4A',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 2,
  },
  uploadedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E8E4A',
  },
  replaceBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(46, 20, 24, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  replaceBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EE',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F2DFB8',
    gap: 10,
    marginTop: 6,
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    color: '#7D5A25',
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FBF8F2',
  },
  nextBtn: {
    height: 52,
    backgroundColor: '#67101F',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
