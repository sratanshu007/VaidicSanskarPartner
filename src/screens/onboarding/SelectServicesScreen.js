import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner, ROLES } from '../../context/PartnerContext';
import { VendorService } from '../../services/api';
import colors from '../../theme/colors';

export default function SelectServicesScreen({ navigation }) {
  const { vendor, updateVendor, mandalis, currentMandali, selectMandali } = usePartner();

  const [panditSelected, setPanditSelected] = useState(true);
  const [astroSelected, setAstroSelected] = useState(true);
  const [selectedMandaliName, setSelectedMandaliName] = useState(currentMandali || (mandalis?.[0]?.name || ''));
  const [mandaliModalVisible, setMandaliModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    const services = [];
    if (panditSelected) services.push('pandit');
    if (astroSelected) services.push('astro');

    setSubmitting(true);
    const payload = {
      ...(vendor || {}),
      services: services.length > 0 ? services : ['pandit'],
      mandali: selectedMandaliName,
      role: vendor?.role || ROLES.PANDIT,
      profileCompleted: true,
      kyc: 'Pending',
      status: 'Review',
    };

    try {
      // 1. Submit complete profile to backend so Admin receives every detail
      const res = await VendorService.completeProfile(payload);
      const savedVendor = res?.vendor || payload;
      updateVendor(savedVendor);
      if (selectedMandaliName) selectMandali(selectedMandaliName);

      Alert.alert(
        'Profile Submitted for Admin Approval 🙏',
        'Your profile has been submitted to the admin team for review and verification.',
        [
          {
            text: 'Check Status',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Pending',
                    params: {
                      email: savedVendor.email,
                      phone: savedVendor.phone,
                      name: savedVendor.name,
                      role: savedVendor.role,
                    },
                  },
                ],
              });
            },
          },
        ]
      );
    } catch (e) {
      console.warn('Profile submission notice:', e?.message);
      updateVendor(payload);
      if (selectedMandaliName) selectMandali(selectedMandaliName);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Pending',
            params: {
              email: payload.email,
              phone: payload.phone,
              name: payload.name,
              role: payload.role,
            },
          },
        ],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <View style={s.container}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={s.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
            </TouchableOpacity>
            <View style={s.headerTextWrap}>
              <Text style={s.headerTitle}>Select Your Services</Text>
              <Text style={s.headerSubtitle}>
                Choose the services you provide
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Service Cards */}
          <View style={s.cardsList}>
            {/* 1. Pandit Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPanditSelected(!panditSelected)}
              style={[
                s.serviceCard,
                panditSelected && s.serviceCardActive,
              ]}
            >
              <View style={s.serviceIconCircle}>
                <MaterialCommunityIcons name="fire" size={24} color="#D48B28" />
              </View>

              <View style={s.serviceInfo}>
                <Text style={s.serviceTitle}>Pandit (Pooja & Rituals)</Text>
                <Text style={s.serviceSubtitle}>
                  Perform pujas, havan, rituals and more
                </Text>
              </View>

              <View style={[s.checkbox, panditSelected && s.checkboxChecked]}>
                {panditSelected && (
                  <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* 2. Astrologer Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setAstroSelected(!astroSelected)}
              style={[
                s.serviceCard,
                astroSelected && s.serviceCardActive,
              ]}
            >
              <View style={s.serviceIconCircle}>
                <MaterialCommunityIcons name="creation" size={24} color="#D48B28" />
              </View>

              <View style={s.serviceInfo}>
                <Text style={s.serviceTitle}>Astrologer (Kundali & Astrology)</Text>
                <Text style={s.serviceSubtitle}>
                  Kundali, horoscope, consultation and more
                </Text>
              </View>

              <View style={[s.checkbox, astroSelected && s.checkboxChecked]}>
                {astroSelected && (
                  <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Mandali Dropdown Section */}
          <View style={s.mandaliSection}>
            <Text style={s.mandaliLabel}>Your Mandali (for Pooja Services)</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setMandaliModalVisible(true)}
              style={s.dropdownWrap}
            >
              <Text style={s.dropdownValue}>{selectedMandaliName}</Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#7D686B" />
            </TouchableOpacity>
            <Text style={s.mandaliHint}>
              You can add or manage your mandali later.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Fixed Action Button */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleNext}
            disabled={submitting}
            style={[s.nextBtn, submitting && { opacity: 0.7 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.nextBtnText}>Submit for Verification</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Mandali Selection Modal */}
        <Modal
          visible={mandaliModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setMandaliModalVisible(false)}
        >
          <TouchableOpacity
            style={s.modalOverlay}
            activeOpacity={1}
            onPress={() => setMandaliModalVisible(false)}
          >
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Select Your Mandali</Text>
              <FlatList
                data={mandalis}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = item.name === selectedMandaliName;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[s.modalItem, isSelected && s.modalItemSelected]}
                      onPress={() => {
                        setSelectedMandaliName(item.name);
                        setMandaliModalVisible(false);
                      }}
                    >
                      <View>
                        <Text style={[s.modalItemText, isSelected && s.modalItemTextSelected]}>
                          {item.name}
                        </Text>
                        <Text style={s.modalItemSub}>
                          {item.pujaris} Pujaris • {item.members} Members
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={22} color="#67101F" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
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
    fontSize: 12.5,
    color: '#7D686B',
    textAlign: 'center',
    marginTop: 4,
  },
  cardsList: {
    gap: 16,
    marginBottom: 28,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EDE4DA',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceCardActive: {
    borderColor: '#67101F',
    backgroundColor: '#FFFCFA',
  },
  serviceIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDF5EA',
    borderWidth: 1,
    borderColor: '#F6E4CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#7D686B',
    lineHeight: 16,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4B5A8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#67101F',
    borderColor: '#67101F',
  },
  mandaliSection: {
    marginTop: 8,
  },
  mandaliLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 8,
  },
  dropdownWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownValue: {
    fontSize: 15,
    color: '#2E1418',
    fontWeight: '500',
  },
  mandaliHint: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 8,
    paddingHorizontal: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D4C8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 16,
    fontFamily: 'serif',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  modalItemSelected: {
    backgroundColor: '#FAF5EE',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E1418',
  },
  modalItemTextSelected: {
    color: '#67101F',
  },
  modalItemSub: {
    fontSize: 12,
    color: '#7D686B',
    marginTop: 2,
  },
});
