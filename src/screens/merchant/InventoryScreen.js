import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import merchantStore from '../../services/estoreStore';

export default function InventoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [inventory, setInventory] = useState(merchantStore.getInventory());
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('10');
  const [adjustReason, setAdjustReason] = useState('Purchase In'); // Purchase In, Damaged, Audit
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  useEffect(() => {
    const unsub = merchantStore.subscribe(() => {
      setInventory([...merchantStore.getInventory()]);
    });
    return unsub;
  }, []);

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.nameHi.includes(search) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdjust = (prod) => {
    setSelectedProduct(prod);
    setAdjustQty('10');
    setShowAdjustModal(true);
  };

  const handleConfirmAdjust = (isAdd) => {
    if (!selectedProduct) return;
    const delta = Number(adjustQty) || 0;
    const newStock = isAdd
      ? selectedProduct.stock + delta
      : Math.max(0, selectedProduct.stock - delta);

    merchantStore.updateStock(selectedProduct.id, newStock, adjustReason);
    setShowAdjustModal(false);
    Alert.alert('स्टॉक अपडेट', `${selectedProduct.name} का स्टॉक अब ${newStock} है।`);
  };

  return (
    <View style={s.container}>
      <Header
        title="वेयरहाउस इन्वेंटरी (Inventory)"
        subtitle={`${inventory.length} सक्रिय सामग्रियां`}
        navigation={navigation}
        showBack={false}
        right={
          <TouchableOpacity
            style={s.addBtnHeader}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={s.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#8C786E" />
          <TextInput
            style={s.searchInput}
            placeholder="खोजें: SKU, सामग्री नाम या रैक संख्या..."
            placeholderTextColor="#8C786E"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Low Stock Threshold Alert Banner */}
        {inventory.some((i) => i.stock <= i.lowStockThreshold) && (
          <View style={s.lowStockBanner}>
            <MaterialCommunityIcons name="alert-decagram" size={22} color="#DC2626" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.lowStockTitle}>कम स्टॉक चेतावनी (Low Stock Alert)!</Text>
              <Text style={s.lowStockSub}>
                {inventory.filter((i) => i.stock <= i.lowStockThreshold).length} सामग्रियों का स्टॉक थ्रेशोल्ड से नीचे है। कृपया री-ऑर्डर करें।
              </Text>
            </View>
          </View>
        )}

        {/* Inventory Items List */}
        {filtered.map((item) => {
          const isLow = item.stock <= item.lowStockThreshold;

          return (
            <View key={item.id} style={[s.invCard, isLow && s.invCardLow]}>
              <View style={s.invCardTop}>
                <View style={s.skuBadge}>
                  <Text style={s.skuText}>{item.sku}</Text>
                </View>
                <View
                  style={[
                    s.stockBadge,
                    isLow ? s.stockBadgeLow : s.stockBadgeGood,
                  ]}
                >
                  <Text
                    style={[
                      s.stockBadgeText,
                      isLow ? { color: '#DC2626' } : { color: '#15803D' },
                    ]}
                  >
                    स्टॉक: {item.stock} {isLow ? '(कम स्टॉक)' : 'इकाइयां'}
                  </Text>
                </View>
              </View>

              <Text style={s.prodNameHi}>{item.nameHi}</Text>
              <Text style={s.prodNameEn}>{item.name}</Text>

              {/* Warehouse & Rack Location */}
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.primary} />
                  <Text style={s.metaText}>{item.rack}</Text>
                </View>
                <View style={s.metaItem}>
                  <MaterialCommunityIcons name="weight" size={14} color="#8C786E" />
                  <Text style={s.metaText}>{item.weight || '1.0 kg'}</Text>
                </View>
                <View style={s.metaItem}>
                  <MaterialCommunityIcons name="currency-inr" size={14} color="#15803D" />
                  <Text style={s.metaText}>₹{item.price}</Text>
                </View>
              </View>

              <View style={s.divider} />

              {/* Adjust Stock Actions */}
              <View style={s.invActions}>
                <Text style={s.warehouseText}>{item.warehouse}</Text>
                <TouchableOpacity
                  style={s.adjustBtn}
                  onPress={() => handleOpenAdjust(item)}
                >
                  <MaterialCommunityIcons name="tune" size={16} color={colors.primary} />
                  <Text style={s.adjustBtnText}>स्टॉक एडजस्ट करें</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Stock Adjustment Modal */}
      <Modal visible={showAdjustModal} transparent animationType="fade">
        <View style={s.modalOverlayCenter}>
          <View style={s.adjustModalCard}>
            <Text style={s.modalTitle}>स्टॉक एडजस्टमेंट</Text>
            <Text style={s.modalSub}>{selectedProduct?.nameHi}</Text>

            <Text style={s.currStockText}>वर्तमान स्टॉक: {selectedProduct?.stock} इकाइयां</Text>

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>इकाइयों की संख्या (Quantity):</Text>
              <TextInput
                style={s.inputBox}
                keyboardType="number-pad"
                value={adjustQty}
                onChangeText={setAdjustQty}
              />
            </View>

            <View style={s.reasonRow}>
              {['Purchase In (+)', 'Damaged (−)', 'Audit Adjust'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.reasonChip, adjustReason === r && s.reasonChipActive]}
                  onPress={() => setAdjustReason(r)}
                >
                  <Text style={[s.reasonText, adjustReason === r && s.reasonTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActionRow}>
              <TouchableOpacity
                style={[s.actionBtnModal, { backgroundColor: '#15803D' }]}
                onPress={() => handleConfirmAdjust(true)}
              >
                <Text style={s.actionBtnText}>+ स्टॉक जोड़ें</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtnModal, { backgroundColor: '#DC2626' }]}
                onPress={() => handleConfirmAdjust(false)}
              >
                <Text style={s.actionBtnText}>− स्टॉक घटाएं</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.cancelModalBtn}
              onPress={() => setShowAdjustModal(false)}
            >
              <Text style={s.cancelModalBtnText}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    padding: 16,
  },
  addBtnHeader: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#3A1208',
    marginLeft: 8,
  },
  lowStockBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  lowStockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  lowStockSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 15,
  },
  invCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 12,
    ...shadow,
  },
  invCardLow: {
    borderColor: '#FECACA',
  },
  invCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skuBadge: {
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  skuText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7A6458',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockBadgeGood: {
    backgroundColor: '#DCFCE7',
  },
  stockBadgeLow: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  prodNameHi: {
    fontFamily: serif,
    fontSize: 15,
    fontWeight: '800',
    color: '#3A1208',
  },
  prodNameEn: {
    fontSize: 11.5,
    color: '#7A6458',
    marginTop: 2,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: '#5C4436',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EDE4',
    marginVertical: 10,
  },
  invActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warehouseText: {
    fontSize: 11,
    color: '#8C786E',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
    gap: 4,
  },
  adjustBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(26, 10, 5, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adjustModalCard: {
    backgroundColor: '#FAF7F0',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    ...shadow,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '800',
    color: '#3A1208',
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#7A6458',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  currStockText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 14,
  },
  inputWrap: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#7A6458',
    marginBottom: 4,
    fontWeight: '600',
  },
  inputBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  reasonChip: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    alignItems: 'center',
  },
  reasonChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF4E8',
  },
  reasonText: {
    fontSize: 10.5,
    color: '#7A6458',
    fontWeight: '600',
  },
  reasonTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtnModal: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelModalBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelModalBtnText: {
    color: '#8C786E',
    fontSize: 12.5,
  },
});
