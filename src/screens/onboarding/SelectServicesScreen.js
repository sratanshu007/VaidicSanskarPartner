import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { radius, serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import { VendorService } from '../../services/api';

const PANDIT_OPTIONS = [
  'Satyanarayan Puja',
  'Griha Pravesh',
  'Rudrabhishek',
  'Mahamrityunjay Jaap',
  'Ganesh Puja',
  'Navgraha Shanti',
  'Havan & Yagya',
  'Vivah Sanskar',
];

const ASTRO_OPTIONS = [
  'Kundali Matching',
  'Horoscope Reading',
  'Numerology',
  'Vastu Consultation',
  'Prashna Kundali',
  'Muhurat Selection',
];

const MANDALI_OPTIONS = [
  'Sundarkand Path',
  'Bhajan Sandhya',
  'Mata Ki Chowki',
  'Akhand Ramayan',
  'Kirtan Samagam',
];

export default function SelectServicesScreen({ navigation, route }) {
  const {
    vendor,
    role,
    updateVendor,
    mandalis,
    currentMandali,
    selectMandali,
  } = usePartner();

  const manageMode = Boolean(route?.params?.manageMode);
  const isApproved = vendor?.status === 'approved' || vendor?.kycStatus === 'approved';

  const [expanded, setExpanded] = useState({
    pandit: role !== 'astro',
    astro: role === 'astro',
    mandali: role === 'mandali',
  });

  const [enabledCategories, setEnabledCategories] = useState({
    pandit:
      vendor?.offersPandit !== undefined
        ? Boolean(vendor.offersPandit)
        : (vendor?.roles?.includes?.('pandit') || role === 'pandit'),
    astro: vendor?.roles?.includes?.('astro') || role === 'astro' || Boolean(vendor?.offersAstrology),
    mandali: vendor?.roles?.includes?.('mandali') || role === 'mandali' || Boolean(vendor?.offersMandali),
  });

  const [selectedPanditServices, setSelectedPanditServices] = useState(
    Array.isArray(vendor?.services) && vendor.services.length > 0
      ? vendor.services
      : ['Satyanarayan Puja', 'Griha Pravesh', 'Ganesh Puja']
  );
  const [selectedAstroServices, setSelectedAstroServices] = useState(
    Array.isArray(vendor?.astroServices) && vendor.astroServices.length > 0
      ? vendor.astroServices
      : ['Kundali Matching', 'Horoscope Reading', 'Numerology', 'Vastu Consultation']
  );
  const [selectedMandaliServices, setSelectedMandaliServices] = useState(
    Array.isArray(vendor?.mandaliServices) && vendor.mandaliServices.length > 0
      ? vendor.mandaliServices
      : ['Sundarkand Path', 'Bhajan Sandhya']
  );

  const [mandaliModalVisible, setMandaliModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (route?.params?.focusCategory) {
      setExpanded((prev) => ({ ...prev, [route.params.focusCategory]: true }));
    }
  }, [route?.params?.focusCategory]);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategorySwitch = (key, value) => {
    setEnabledCategories((prev) => ({ ...prev, [key]: value }));
    if (value && !expanded[key]) {
      setExpanded((prev) => ({ ...prev, [key]: true }));
    }
  };

  const toggleChip = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSaveOrSubmit = async () => {
    if (!enabledCategories.pandit && !enabledCategories.astro && !enabledCategories.mandali) {
      Alert.alert('Select a Service', 'Please keep at least one service category active.');
      return;
    }

    setSaving(true);
    try {
      const rolesList = [];
      if (enabledCategories.pandit) rolesList.push('pandit');
      if (enabledCategories.astro) rolesList.push('astro');
      if (enabledCategories.mandali) rolesList.push('mandali');

      const combinedServices = [
        ...(enabledCategories.pandit ? selectedPanditServices : []),
        ...(enabledCategories.astro ? selectedAstroServices : []),
        ...(enabledCategories.mandali ? selectedMandaliServices : []),
      ];

      const payload = {
        email: vendor?.email,
        phone: vendor?.phone,
        roles: rolesList,
        services: selectedPanditServices,
        astroServices: selectedAstroServices,
        mandaliServices: selectedMandaliServices,
        allServices: combinedServices,
        offersPandit: enabledCategories.pandit,
        offersAstrology: enabledCategories.astro,
        offersMandali: enabledCategories.mandali,
        mandaliId: currentMandali?.id || null,
        mandaliName: currentMandali?.name || vendor?.mandaliName || null,
      };

      if (manageMode || isApproved) {
        try {
          await VendorService.updateProfile(payload);
        } catch (err) {
          console.log('Service update sync notice:', err?.message);
        }
        await updateVendor(payload);
        Alert.alert('Services Updated', 'Your VaidicSanskar service preferences have been saved.');
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } else {
        const submitPayload = {
          ...vendor,
          ...payload,
          profileCompleted: true,
          status: vendor?.status || 'Review',
        };
        try {
          await VendorService.completeProfile(submitPayload);
        } catch (err) {
          console.log('Complete profile notice:', err?.message);
        }
        await updateVendor(submitPayload);
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Pending',
              params: {
                email: vendor?.email,
                phone: vendor?.phone,
                name: vendor?.name,
                role,
              },
            },
          ],
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderServiceCard = ({
    keyName,
    title,
    subtitle,
    imageSource,
    options,
    selectedList,
    setSelectedList,
    manageRoute,
    extraSlot,
  }) => {
    const isExpanded = expanded[keyName];
    const isEnabled = enabledCategories[keyName];

    return (
      <View key={keyName} style={[styles.serviceCard, shadow]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardHeader}
          onPress={() => toggleExpand(keyName)}
        >
          <Image source={imageSource} style={styles.thumbImage} resizeMode="cover" />
          <View style={styles.headerTextWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{title}</Text>
              {isEnabled && (
                <View style={styles.activeDotPill}>
                  <View style={styles.greenDot} />
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#5D4037"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.dropdownBody}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Offer {title}</Text>
              <Switch
                value={isEnabled}
                onValueChange={(val) => toggleCategorySwitch(keyName, val)}
                trackColor={{ false: '#DFD2C3', true: '#1E8E4A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {extraSlot}

            <Text style={styles.subLabel}>Select Specializations</Text>
            <View style={styles.chipGrid}>
              {options.map((opt) => {
                const active = selectedList.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    activeOpacity={0.8}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleChip(selectedList, setSelectedList, opt)}
                  >
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={active ? '#67101F' : '#8C7A6B'}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {(manageMode || isApproved) && manageRoute && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.manageLinkBtn}
                onPress={() => navigation.navigate(manageRoute)}
              >
                <Text style={styles.manageLinkText}>Configure {title} Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#67101F" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Cream Sacred Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
        >
          <Ionicons name="chevron-back" size={24} color="#4A0813" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Services</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.leadText}>
          Select and manage the sacred services you offer to devotees across VaidicSanskar.
        </Text>

        {renderServiceCard({
          keyName: 'pandit',
          title: 'Pandit Services',
          subtitle: 'Manage Pooja & Ritual Services',
          imageSource: require('../../../assets/images/pandit_banner.jpg'),
          options: PANDIT_OPTIONS,
          selectedList: selectedPanditServices,
          setSelectedList: setSelectedPanditServices,
          manageRoute: 'PoojaServices',
        })}

        {renderServiceCard({
          keyName: 'astro',
          title: 'Astrology Services',
          subtitle: 'Kundali, Horoscope & Consultation',
          imageSource: require('../../../assets/images/astro_banner.jpg'),
          options: ASTRO_OPTIONS,
          selectedList: selectedAstroServices,
          setSelectedList: setSelectedAstroServices,
          manageRoute: 'AstrologyServices',
        })}

        {renderServiceCard({
          keyName: 'mandali',
          title: 'Mandali Services',
          subtitle: 'Manage Your Mandali',
          imageSource: require('../../../assets/images/mandali_banner.jpg'),
          options: MANDALI_OPTIONS,
          selectedList: selectedMandaliServices,
          setSelectedList: setSelectedMandaliServices,
          manageRoute: 'MandaliManagement',
          extraSlot: (
            <TouchableOpacity
              style={styles.mandaliPickerBtn}
              onPress={() => setMandaliModalVisible(true)}
            >
              <View>
                <Text style={styles.mandaliPickerLabel}>Associated Mandali Group</Text>
                <Text style={styles.mandaliPickerValue}>
                  {currentMandali?.name || vendor?.mandaliName || 'Select or link Mandali'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#67101F" />
            </TouchableOpacity>
          ),
        })}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Sacred Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={saving}
          onPress={handleSaveOrSubmit}
        >
          <LinearGradient
            colors={['#7E1627', '#530A17']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {manageMode || isApproved ? 'Update Services' : 'Submit for Verification'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Mandali Picker Modal */}
      <Modal
        visible={mandaliModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMandaliModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Mandali</Text>
              <TouchableOpacity onPress={() => setMandaliModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4A0813" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={mandalis || []}
              keyExtractor={(item, idx) => String(item.id || idx)}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  No Mandalis found yet. You can create one in Mandali Management.
                </Text>
              }
              renderItem={({ item }) => {
                const selected = currentMandali?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalRow, selected && styles.modalRowActive]}
                    onPress={() => {
                      selectMandali?.(item.id);
                      setMandaliModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.modalRowTitle}>{item.name}</Text>
                      <Text style={styles.modalRowSub}>
                        {item.capacity || '5-20 Members'} • {item.city || 'Vedic Group'}
                      </Text>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color="#1E8E4A" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '700',
    color: '#4A0813',
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  leadText: {
    fontSize: 13.5,
    color: '#6E5A4B',
    marginBottom: 14,
    lineHeight: 19,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  thumbImage: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#EFE4D6',
  },
  headerTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '700',
    color: '#2F1510',
  },
  activeDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F6EC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E8E4A',
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#1E8E4A',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#7B6759',
    marginTop: 3,
  },
  dropdownBody: {
    borderTopWidth: 1,
    borderTopColor: '#F2E8DC',
    padding: 14,
    backgroundColor: '#FFFDF9',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A1E19',
  },
  subLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7A5B47',
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D4C3',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: '#67101F',
    backgroundColor: '#FBF0EC',
  },
  chipText: {
    fontSize: 12.5,
    color: '#5C4B3E',
  },
  chipTextActive: {
    color: '#67101F',
    fontWeight: '600',
  },
  mandaliPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D7C6',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  mandaliPickerLabel: {
    fontSize: 11,
    color: '#8B7361',
  },
  mandaliPickerValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3A1E19',
    marginTop: 2,
  },
  manageLinkBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F7EDE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#67101F',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE4D6',
    backgroundColor: '#FBF6EE',
  },
  primaryBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,10,8,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FBF6EE',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '700',
    color: '#4A0813',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 8,
  },
  modalRowActive: {
    borderColor: '#1E8E4A',
    backgroundColor: '#F2FBF5',
  },
  modalRowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2F1510',
  },
  modalRowSub: {
    fontSize: 12,
    color: '#7A6859',
    marginTop: 2,
  },
  emptyModalText: {
    textAlign: 'center',
    color: '#7A6859',
    paddingVertical: 20,
    fontSize: 13.5,
  },
});
