import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import { VendorService } from '../../services/api';

const LANGUAGES = ['Hindi', 'English', 'Sanskrit', 'Marathi', 'Gujarati', 'Bengali', 'Tamil'];
const EXPERIENCE_OPTIONS = ['1-3 Years', '3-5 Years', '5+ Years', '10+ Years', '15+ Years'];
const CATEGORIES = ['All', 'Pooja', 'Havan', 'Special'];

export default function PoojaServicesScreen({ navigation }) {
  const { vendor, updateVendor, poojaServices, setPoojaServices } = usePartner();

  const [serviceActive, setServiceActive] = useState(vendor?.panditActive !== false);
  const [selectedLanguages, setSelectedLanguages] = useState(
    Array.isArray(vendor?.languages) && vendor.languages.length > 0
      ? vendor.languages
      : ['Hindi', 'English', 'Sanskrit']
  );
  const [experience, setExperience] = useState(vendor?.experience || '5+ Years');
  const [about, setAbout] = useState(
    vendor?.about || vendor?.bio || 'Experienced Vedic Acharya performing Griha Pravesh, Satyanarayan Puja, Rudrabhishek, and Havan rituals with full Vidhi.'
  );
  const [expModalVisible, setExpModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);

  const toggleLanguage = (lang) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length === 1) return;
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const togglePoojaPackage = (id) => {
    if (!setPoojaServices) return;
    setPoojaServices((prev) =>
      (prev || []).map((svc) =>
        svc.id === id ? { ...svc, enabled: svc.enabled === false } : svc
      )
    );
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        email: vendor?.email,
        phone: vendor?.phone,
        panditActive: serviceActive,
        languages: selectedLanguages,
        experience,
        about: about.trim(),
        bio: about.trim(),
      };
      try {
        await VendorService.updateProfile(payload);
      } catch (err) {
        console.log('Pandit profile API notice:', err?.message);
      }
      await updateVendor(payload);
      Alert.alert('Profile Updated', 'Your Pandit Services profile has been saved.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPackages = (poojaServices || []).filter((svc) =>
    selectedCategory === 'All'
      ? true
      : String(svc.category || 'Pooja').toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4A0813" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pandit Services</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sacred Hero Banner */}
        <View style={[styles.heroCard, shadow]}>
          <Image
            source={require('../../../assets/images/pandit_banner.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(74, 8, 19, 0.1)', 'rgba(56, 5, 13, 0.85)']}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroText}>Offer Your{'\n'}Pandit Services</Text>
          </LinearGradient>
        </View>

        {/* Service Status Row */}
        <View style={styles.statusRow}>
          <Text style={styles.fieldLabel}>Service Status</Text>
          <Switch
            value={serviceActive}
            onValueChange={setServiceActive}
            trackColor={{ false: '#DFD2C3', true: '#1E8E4A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Languages Known */}
        <Text style={styles.fieldLabel}>Languages Known</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => {
            const active = selectedLanguages.includes(lang);
            return (
              <TouchableOpacity
                key={lang}
                activeOpacity={0.8}
                style={[styles.langPill, active && styles.langPillActive]}
                onPress={() => toggleLanguage(lang)}
              >
                <Text style={[styles.langText, active && styles.langTextActive]}>{lang}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Experience Picker */}
        <Text style={styles.fieldLabel}>Experience</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.dropdownBox}
          onPress={() => setExpModalVisible(true)}
        >
          <Text style={styles.dropdownValue}>{experience}</Text>
          <Ionicons name="chevron-down" size={18} color="#5D4037" />
        </TouchableOpacity>

        {/* About You */}
        <Text style={styles.fieldLabel}>About You</Text>
        <TextInput
          style={styles.aboutInput}
          value={about}
          onChangeText={setAbout}
          placeholder="Tell customers about your expertise..."
          placeholderTextColor="#9A8879"
          multiline
          textAlignVertical="top"
        />

        {/* Primary Maroon Update Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={saving}
          onPress={handleUpdateProfile}
          style={{ marginTop: 18 }}
        >
          <LinearGradient
            colors={['#7E1627', '#530A17']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.updateBtn}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.updateBtnText}>Update Profile</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Ritual Packages Section */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Your Ritual Offerings</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {filteredPackages.map((svc, idx) => {
            const enabled = svc.enabled !== false;
            return (
              <View key={svc.id || idx} style={[styles.packageCard, shadow]}>
                <Image
                  source={require('../../../assets/banner_havan_kund.png')}
                  style={styles.packageThumb}
                  resizeMode="cover"
                />
                <View style={styles.packageBody}>
                  <Text style={styles.packageName}>{svc.name || svc.title}</Text>
                  <Text style={styles.packageMeta}>
                    {svc.duration || '2 hrs'} • ₹ {svc.price || svc.dakshina || 2100}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={() => togglePoojaPackage(svc.id)}
                  trackColor={{ false: '#DFD2C3', true: '#1E8E4A' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Experience Selector Modal */}
      <Modal
        visible={expModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExpModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setExpModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Experience</Text>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalItem}
                onPress={() => {
                  setExperience(opt);
                  setExpModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    experience === opt && { color: '#67101F', fontWeight: '700' },
                  ]}
                >
                  {opt}
                </Text>
                {experience === opt && (
                  <Ionicons name="checkmark-circle" size={18} color="#1E8E4A" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D6',
    backgroundColor: '#FBF6EE',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '700',
    color: '#4A0813',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  heroCard: {
    height: 132,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#4A0813',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  heroText: {
    fontFamily: serif,
    fontSize: 19,
    fontWeight: '700',
    color: '#FBE8C6',
    textAlign: 'center',
    lineHeight: 25,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A1E19',
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D8C8',
  },
  langPillActive: {
    borderColor: '#67101F',
    backgroundColor: '#FBF0EC',
  },
  langText: {
    fontSize: 13,
    color: '#5C4B3E',
    fontWeight: '500',
  },
  langTextActive: {
    color: '#67101F',
    fontWeight: '700',
  },
  dropdownBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D8C8',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownValue: {
    fontSize: 14,
    color: '#2F1510',
    fontWeight: '600',
  },
  aboutInput: {
    minHeight: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D8C8',
    padding: 12,
    fontSize: 13.5,
    color: '#2F1510',
    lineHeight: 19,
  },
  updateBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  packagesSection: {
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#EFE4D6',
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '700',
    color: '#4A0813',
    marginBottom: 10,
  },
  catRow: {
    gap: 8,
    paddingBottom: 12,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D8C8',
  },
  catChipActive: {
    backgroundColor: '#67101F',
    borderColor: '#67101F',
  },
  catChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5C4B3E',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 10,
    gap: 12,
  },
  packageThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EFE4D6',
  },
  packageBody: {
    flex: 1,
  },
  packageName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2F1510',
  },
  packageMeta: {
    fontSize: 12.5,
    color: '#7A6859',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,10,8,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: '#FBF6EE',
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '700',
    color: '#4A0813',
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D6',
  },
  modalItemText: {
    fontSize: 14.5,
    color: '#3A1E19',
  },
});
