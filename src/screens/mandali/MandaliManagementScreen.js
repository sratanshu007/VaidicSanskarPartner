import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import { VendorService } from '../../services/api';

const CAPACITY_OPTIONS = ['2-5 Members', '5-20 Members', '10-25 Members', '20-50 Members'];

export default function MandaliManagementScreen({ navigation }) {
  const {
    vendor,
    updateVendor,
    mandalis,
    currentMandali,
    selectMandali,
    addMandali,
  } = usePartner();

  const [mandaliName, setMandaliName] = useState(
    currentMandali?.name || vendor?.mandaliName || 'Shree Vedic Mandali'
  );
  const [description, setDescription] = useState(
    currentMandali?.description || 'Traditional Pooja Mandali for all rituals, Bhajan & Sundarkand.'
  );
  const [capacity, setCapacity] = useState(currentMandali?.capacity || '5-20 Members');
  const [serviceActive, setServiceActive] = useState(currentMandali?.active !== false);
  const [capModalVisible, setCapModalVisible] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCapacity, setNewCapacity] = useState('5-20 Members');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentMandali) {
      setMandaliName(currentMandali.name || 'Shree Vedic Mandali');
      setDescription(
        currentMandali.description ||
          'Traditional Pooja Mandali for all rituals, Bhajan & Sundarkand.'
      );
      setCapacity(currentMandali.capacity || '5-20 Members');
      setServiceActive(currentMandali.active !== false);
    }
  }, [currentMandali?.id]);

  const handleUpdateMandali = async () => {
    if (!mandaliName.trim()) {
      Alert.alert('Required', 'Please enter a Mandali Name.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        email: vendor?.email,
        phone: vendor?.phone,
        mandaliName: mandaliName.trim(),
        mandaliDescription: description.trim(),
        mandaliCapacity: capacity,
        mandaliActive: serviceActive,
        offersMandali: true,
      };
      try {
        await VendorService.updateProfile(payload);
      } catch (err) {
        console.log('Mandali update API notice:', err?.message);
      }
      await updateVendor(payload);
      Alert.alert('Mandali Updated', `${mandaliName.trim()} profile has been saved.`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMandali = async () => {
    if (!newName.trim()) {
      Alert.alert('Mandali Name', 'Please enter your Mandali group name.');
      return;
    }
    if (addMandali) {
      await addMandali({
        name: newName.trim(),
        city: newCity.trim() || vendor?.city || 'New Delhi',
        capacity: newCapacity,
        description: 'Traditional Pooja Mandali for all rituals',
        active: true,
      });
    }
    setNewName('');
    setNewCity('');
    setAddModalVisible(false);
    Alert.alert('Mandali Added', 'New Mandali has been created and selected.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4A0813" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mandali Management</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#67101F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sacred Mandali Hero Card */}
        <View style={[styles.heroCard, shadow]}>
          <Image
            source={require('../../../assets/images/mandali_banner.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(74, 8, 19, 0.15)', 'rgba(56, 5, 13, 0.85)']}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroText}>Manage{'\n'}Your{'\n'}Mandali</Text>
          </LinearGradient>
        </View>

        {/* Mandali Name */}
        <Text style={styles.fieldLabel}>Mandali Name</Text>
        <TextInput
          style={styles.inputBox}
          value={mandaliName}
          onChangeText={setMandaliName}
          placeholder="Shree Vedic Mandali"
          placeholderTextColor="#9A8879"
        />

        {/* Description */}
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.inputBox, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Traditional Pooja Mandali for all rituals"
          placeholderTextColor="#9A8879"
          multiline
          textAlignVertical="top"
        />

        {/* Capacity Picker */}
        <Text style={styles.fieldLabel}>Capacity</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.dropdownBox}
          onPress={() => setCapModalVisible(true)}
        >
          <Text style={styles.dropdownValue}>{capacity}</Text>
          <Ionicons name="chevron-down" size={18} color="#5D4037" />
        </TouchableOpacity>

        {/* Service Status Row */}
        <View style={styles.statusRow}>
          <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Service Status</Text>
          <Switch
            value={serviceActive}
            onValueChange={setServiceActive}
            trackColor={{ false: '#DFD2C3', true: '#1E8E4A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Maroon Update Profile CTA */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={saving}
          onPress={handleUpdateMandali}
          style={{ marginTop: 10 }}
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

        {/* Registered Mandali Groups Switcher */}
        {Array.isArray(mandalis) && mandalis.length > 0 && (
          <View style={styles.groupsSection}>
            <View style={styles.groupsHeader}>
              <Text style={styles.sectionTitle}>Your Mandali Groups</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                <Text style={styles.addLink}>+ New Mandali</Text>
              </TouchableOpacity>
            </View>
            {mandalis.map((m, idx) => {
              const selected = currentMandali?.id === m.id;
              return (
                <TouchableOpacity
                  key={m.id || idx}
                  activeOpacity={0.85}
                  style={[styles.groupCard, selected && styles.groupCardActive, shadow]}
                  onPress={() => selectMandali?.(m.id)}
                >
                  <Image
                    source={require('../../../assets/images/mandali_banner.jpg')}
                    style={styles.groupThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{m.name}</Text>
                    <Text style={styles.groupMeta}>
                      {m.capacity || '5-20 Members'} • {m.city || 'Vedic Group'}
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color={selected ? '#1E8E4A' : '#8C7A6B'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Capacity Picker Modal */}
      <Modal
        visible={capModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCapModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCapModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Group Capacity</Text>
            {CAPACITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalItem}
                onPress={() => {
                  setCapacity(opt);
                  setCapModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    capacity === opt && { color: '#67101F', fontWeight: '700' },
                  ]}
                >
                  {opt}
                </Text>
                {capacity === opt && (
                  <Ionicons name="checkmark-circle" size={18} color="#1E8E4A" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add New Mandali Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>Create Mandali Group</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4A0813" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Group Name</Text>
            <TextInput
              style={styles.inputBox}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Shree Hanuman Sundarkand Mandali"
              placeholderTextColor="#9A8879"
            />
            <Text style={styles.fieldLabel}>Primary City</Text>
            <TextInput
              style={styles.inputBox}
              value={newCity}
              onChangeText={setNewCity}
              placeholder="e.g. Varanasi / New Delhi"
              placeholderTextColor="#9A8879"
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleCreateMandali}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={['#7E1627', '#530A17']}
                style={styles.updateBtn}
              >
                <Text style={styles.updateBtnText}>Create Mandali</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  addHeaderBtn: {
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
    paddingRight: 22,
  },
  heroText: {
    fontFamily: serif,
    fontSize: 19,
    fontWeight: '700',
    color: '#FBE8C6',
    textAlign: 'center',
    lineHeight: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A1E19',
    marginBottom: 7,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D8C8',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#2F1510',
    marginBottom: 14,
  },
  textArea: {
    minHeight: 74,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  groupsSection: {
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#EFE4D6',
  },
  groupsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '700',
    color: '#4A0813',
  },
  addLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#67101F',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 10,
  },
  groupCardActive: {
    borderColor: '#1E8E4A',
    backgroundColor: '#F4FBF6',
  },
  groupThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  groupName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2F1510',
  },
  groupMeta: {
    fontSize: 12,
    color: '#7A6859',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,10,8,0.45)',
    justifyContent: 'center',
    padding: 22,
  },
  modalSheet: {
    backgroundColor: '#FBF6EE',
    borderRadius: 18,
    padding: 18,
  },
  modalHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '700',
    color: '#4A0813',
    marginBottom: 10,
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
