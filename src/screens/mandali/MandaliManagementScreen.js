import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner } from '../../context/PartnerContext';
import colors from '../../theme/colors';

export default function MandaliManagementScreen({ navigation }) {
  const { mandalis, currentMandali, selectMandali, addMandali } = usePartner();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newMandaliName, setNewMandaliName] = useState('');
  const [newPujaris, setNewPujaris] = useState('4');
  const [newMembers, setNewMembers] = useState('10');

  const activeMandali = mandalis.find((m) => m.name === currentMandali) || mandalis[0];
  const otherMandalis = mandalis.filter((m) => m.name !== activeMandali.name);

  const handleCreateMandali = () => {
    if (!newMandaliName.trim()) {
      Alert.alert('Required', 'Please enter mandali name');
      return;
    }
    addMandali({
      name: newMandaliName.trim(),
      pujaris: newPujaris,
      members: newMembers,
    });
    setNewMandaliName('');
    setAddModalVisible(false);
    Alert.alert('Success', 'New Mandali has been registered!');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF8F2" />
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#2E1418" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Mandali</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Mandali Card */}
          <View style={s.activeCard}>
            <View style={s.mandaliIconCircle}>
              <MaterialCommunityIcons name="account-group" size={26} color="#D48B28" />
            </View>

            <View style={s.mandaliInfo}>
              <Text style={s.mandaliTitle}>{activeMandali?.name}</Text>
              <Text style={s.mandaliSub}>
                {activeMandali?.pujaris} Pujaris • {activeMandali?.members} Members
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert('Edit Mandali', `Editing settings for ${activeMandali?.name}`)}
              style={s.editBtn}
            >
              <MaterialCommunityIcons name="pencil-outline" size={14} color="#67101F" style={{ marginRight: 4 }} />
              <Text style={s.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* + Add New Mandali Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setAddModalVisible(true)}
            style={s.addMandaliBtn}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={s.addMandaliBtnText}>Add New Mandali</Text>
          </TouchableOpacity>

          {/* Other Mandalis Section */}
          <Text style={s.sectionTitle}>Other Mandalis</Text>

          <View style={s.otherList}>
            {otherMandalis.map((item) => (
              <View key={item.id} style={s.otherCard}>
                <View style={s.mandaliIconCircle}>
                  <MaterialCommunityIcons name="account-group-outline" size={24} color="#D48B28" />
                </View>

                <View style={s.mandaliInfo}>
                  <Text style={s.otherTitle}>{item.name}</Text>
                  <Text style={s.otherSub}>
                    {item.pujaris} Pujaris • {item.members} Members
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    selectMandali(item.name);
                    Alert.alert('Mandali Selected', `${item.name} is now your active pooja group.`);
                  }}
                  style={s.selectBtn}
                >
                  <Text style={s.selectBtnText}>Select</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add Mandali Modal */}
        <Modal
          visible={addModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Add New Mandali</Text>

              <View style={s.modalForm}>
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Mandali Name</Text>
                  <TextInput
                    style={s.modalInput}
                    value={newMandaliName}
                    onChangeText={setNewMandaliName}
                    placeholder="e.g. Gayatri Mandali"
                    placeholderTextColor="#A08E90"
                  />
                </View>

                <View style={s.fieldRow}>
                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Pujaris Count</Text>
                    <TextInput
                      style={s.modalInput}
                      value={newPujaris}
                      onChangeText={setNewPujaris}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={s.fieldLabel}>Members Count</Text>
                    <TextInput
                      style={s.modalInput}
                      value={newMembers}
                      onChangeText={setNewMembers}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleCreateMandali}
                  style={s.modalSubmitBtn}
                >
                  <Text style={s.modalSubmitBtnText}>Create Mandali</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAddModalVisible(false)}
                  style={s.modalCancelBtn}
                >
                  <Text style={s.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1418',
    fontFamily: 'serif',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  mandaliIconCircle: {
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
  mandaliInfo: {
    flex: 1,
  },
  mandaliTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 4,
  },
  mandaliSub: {
    fontSize: 12.5,
    color: '#7D686B',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8D4C8',
    backgroundColor: '#FFFDFB',
  },
  editBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#67101F',
  },
  addMandaliBtn: {
    height: 50,
    backgroundColor: '#67101F',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67101F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  addMandaliBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#7D686B',
    marginBottom: 14,
  },
  otherList: {
    gap: 12,
  },
  otherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  otherTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 3,
  },
  otherSub: {
    fontSize: 12,
    color: '#7D686B',
  },
  selectBtn: {
    backgroundColor: '#67101F',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
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
  modalForm: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E1418',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14.5,
    color: '#2E1418',
  },
  modalSubmitBtn: {
    height: 48,
    backgroundColor: '#67101F',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    color: '#7D686B',
    fontSize: 14,
  },
});
