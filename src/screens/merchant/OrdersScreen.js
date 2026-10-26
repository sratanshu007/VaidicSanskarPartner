import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';
import merchantStore from '../../services/estoreStore';

const ORDER_TABS = [
  { id: 'ALL', label: 'सभी ऑर्डर' },
  { id: 'TO_PACK', label: 'पैक करें (Pick List)' },
  { id: 'NEW', label: 'नए ऑर्डर' },
  { id: 'SHIPPED', label: 'डिस्पैच / मार्ग में' },
  { id: 'RETURNS', label: 'वापसी अनुरोध' },
];

export default function OrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { vendor, online, setOnline } = usePartner();
  const [orders, setOrders] = useState(merchantStore.getOrders());
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [weighInput, setWeighInput] = useState('1.45');
  const [showPackingModal, setShowPackingModal] = useState(false);

  useEffect(() => {
    const unsub = merchantStore.subscribe(() => {
      setOrders([...merchantStore.getOrders()]);
    });
    return unsub;
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'TO_PACK') return o.status === 'TO_PACK' || o.status === 'NEW';
    if (activeTab === 'NEW') return o.status === 'NEW';
    if (activeTab === 'SHIPPED') return o.status === 'SHIPPED' || o.status === 'DELIVERED';
    if (activeTab === 'RETURNS') return o.status === 'RETURN_REQUESTED';
    return true;
  });

  const handleOpenPackModal = (order) => {
    setSelectedOrder(order);
    setShowPackingModal(true);
  };

  const handleItemScan = (itemSku) => {
    if (!selectedOrder) return;
    merchantStore.markItemScanned(selectedOrder.id, itemSku);
    const updated = merchantStore.getOrders().find((o) => o.id === selectedOrder.id);
    setSelectedOrder(updated ? { ...updated } : null);
  };

  const handleCompletePacking = () => {
    if (!selectedOrder) return;
    merchantStore.advanceOrderStatus(selectedOrder.id, 'SHIPPED');
    setShowPackingModal(false);
    Alert.alert(
      'शिपिंग संपन्न ✓',
      `ऑर्डर ${selectedOrder.orderNumber} पैक हो गया है। Delhivery AWB: ${selectedOrder.awb} असाइन कर दिया गया है।`
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7F0" />

      {/* Top Header */}
      <View
        style={[
          s.topHeader,
          {
            paddingTop: Math.max(
              insets.top,
              Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
            ) + 6,
          },
        ]}
      >
        <View style={s.brandRow}>
          <View style={s.emblemDisc}>
            <MaterialCommunityIcons name="storefront-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={s.brandTitle}>वेयरहाउस व ई-स्टोर</Text>
            <Text style={s.brandSubtitle}>NOIDA FULFILLMENT HUB</Text>
          </View>
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.navigate('Chat', { name: 'Support' })}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color="#3A1208" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.avatarWrap}
            onPress={() => navigation.navigate('More')}
          >
            <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Merchant Warehouse Greeting Card */}
        <View style={s.greetingCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.namasteText}>नोएडा वेयरहाउस पार्टनर,</Text>
            <Text style={s.vendorName}>{vendor?.name || 'श्री लक्ष्मी पूजा सामग्री स्टोर्स'}</Text>
            <View style={s.hubTag}>
              <MaterialCommunityIcons name="warehouse" size={14} color="#15803D" />
              <Text style={s.hubTagText}>नोएडा सेंट्रल हब · एक्टिव</Text>
            </View>
          </View>
          <View style={s.avatarBox}>
            <MaterialCommunityIcons name="package-variant-closed" size={38} color={colors.primary} />
          </View>
        </View>

        {/* 4 Statistics Metrics */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="package-down" size={20} color={colors.primary} />
            <Text style={s.statValue}>{orders.length}</Text>
            <Text style={s.statLabel}>कुल ऑर्डर्स</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="barcode-scan" size={20} color="#D97706" />
            <Text style={s.statValue}>
              {orders.filter((o) => o.status === 'TO_PACK' || o.status === 'NEW').length}
            </Text>
            <Text style={s.statLabel}>पैक करना शेष</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="truck-delivery" size={20} color="#15803D" />
            <Text style={s.statValue}>
              {orders.filter((o) => o.status === 'SHIPPED').length}
            </Text>
            <Text style={s.statLabel}>मार्ग में (Shipped)</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="currency-inr" size={20} color="#0284C7" />
            <Text style={s.statValue}>₹ 18.7K</Text>
            <Text style={s.statLabel}>कुल बिक्री</Text>
          </View>
        </View>

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsScroll}
        >
          {ORDER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.tabChip, isActive && s.tabChipActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Orders Fulfillment List */}
        <Text style={s.sectionTitle}>ऑर्डर सूची ({filteredOrders.length})</Text>

        {filteredOrders.map((order) => (
          <View key={order.id} style={s.orderCard}>
            <View style={s.orderCardTop}>
              <View>
                <Text style={s.orderNumber}>{order.orderNumber}</Text>
                <Text style={s.orderDate}>{order.placedAt}</Text>
              </View>
              <View
                style={[
                  s.statusPill,
                  order.status === 'TO_PACK'
                    ? s.statusPillOrange
                    : order.status === 'SHIPPED'
                    ? s.statusPillGreen
                    : s.statusPillBlue,
                ]}
              >
                <Text
                  style={[
                    s.statusPillText,
                    order.status === 'TO_PACK'
                      ? { color: '#92400E' }
                      : order.status === 'SHIPPED'
                      ? { color: '#15803D' }
                      : { color: '#1E40AF' },
                  ]}
                >
                  {order.status}
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.customerInfo}>
              <Text style={s.custName}>यजमान: {order.customerName}</Text>
              <Text style={s.custAddr} numberOfLines={2}>📍 {order.address}</Text>
            </View>

            {/* Items Summary in Order */}
            <View style={s.itemsBox}>
              {order.items?.map((it, idx) => (
                <View key={idx} style={s.itemMiniRow}>
                  <Text style={s.itemMiniName} numberOfLines={1}>• {it.name}</Text>
                  <Text style={s.itemMiniRack}>[{it.rack}]</Text>
                  <Text style={s.itemMiniQty}>x{it.qty}</Text>
                </View>
              ))}
            </View>

            {/* Packaging Rule Tag */}
            {order.packagingNotes && (
              <View style={s.packagingNotice}>
                <MaterialCommunityIcons name="shield-alert" size={14} color="#B45309" />
                <Text style={s.packagingNoticeText}>{order.packagingNotes}</Text>
              </View>
            )}

            <View style={s.orderCardBottom}>
              <Text style={s.orderTotal}>कुल: ₹{order.total} ({order.paymentMethod})</Text>
              <TouchableOpacity
                style={s.packBtn}
                activeOpacity={0.85}
                onPress={() => handleOpenPackModal(order)}
              >
                <MaterialCommunityIcons name="barcode-scan" size={16} color="#FFF" />
                <Text style={s.packBtnText}>
                  {order.status === 'SHIPPED' ? 'विवरण देखें' : 'पैक व शिप करें ›'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Warehouse Packing & Fulfillment Modal */}
      <Modal visible={showPackingModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.packModalSheet}>
            <View style={s.packModalHeader}>
              <View>
                <Text style={s.packModalOrder}>ऑर्डर {selectedOrder?.orderNumber}</Text>
                <Text style={s.packModalSub}>पिक लिस्ट व बारकोड सत्यापन</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPackingModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#3A1208" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Warehouse Pick List with Barcode Scan verification */}
              <Text style={s.pickListTitle}>पिक लिस्ट (Warehouse Items to Pick):</Text>
              {selectedOrder?.items?.map((it, idx) => (
                <View key={idx} style={s.pickItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pickItemName}>{it.name}</Text>
                    <Text style={s.pickItemMeta}>
                      रैक स्थान: <Text style={{ fontWeight: '800', color: colors.primary }}>{it.rack}</Text> · मात्रा: {it.qty}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[s.scanBtn, it.scanned && s.scanBtnDone]}
                    onPress={() => handleItemScan(it.sku)}
                  >
                    <MaterialCommunityIcons
                      name={it.scanned ? 'check-bold' : 'barcode'}
                      size={16}
                      color={it.scanned ? '#FFF' : colors.primary}
                    />
                    <Text style={[s.scanBtnText, it.scanned && { color: '#FFF' }]}>
                      {it.scanned ? 'सत्यापित ✓' : 'स्कैन करें'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Weight verification */}
              <View style={s.weightCard}>
                <Text style={s.weightLabel}>पार्सल का वास्तविक वजन (Packed Weight kg):</Text>
                <View style={s.weightInputRow}>
                  <TextInput
                    style={s.weightInput}
                    keyboardType="numeric"
                    value={weighInput}
                    onChangeText={setWeighInput}
                  />
                  <Text style={s.kgUnit}>किलोग्राम (kg)</Text>
                </View>
              </View>

              {/* Courier Label & AWB Info */}
              <View style={s.courierCard}>
                <MaterialCommunityIcons name="truck-fast" size={20} color="#15803D" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.courierTitle}>Delhivery Surface AWB: {selectedOrder?.awb}</Text>
                  <Text style={s.courierSub}>शिपिंग लेबल व GST इनवॉइस स्वतः संलग्न होगा</Text>
                </View>
              </View>
            </ScrollView>

            {/* Complete Dispatch Button */}
            <TouchableOpacity
              style={s.completePackBtn}
              activeOpacity={0.85}
              onPress={handleCompletePacking}
            >
              <MaterialCommunityIcons name="truck-check" size={20} color="#FFF" />
              <Text style={s.completePackBtnText}>
                लेबल प्रिंट करें व कूरियर डिस्पैच मार्क करें ›
              </Text>
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
  topHeader: {
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE3D7',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemDisc: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  brandTitle: {
    fontSize: 16.5,
    fontFamily: serif,
    fontWeight: '800',
    color: '#3A1208',
  },
  brandSubtitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE3D7',
    ...shadow,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  content: {
    padding: 16,
  },
  greetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  namasteText: {
    fontSize: 12.5,
    color: '#8C786E',
    fontWeight: '600',
  },
  vendorName: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '800',
    color: '#3A1208',
    marginTop: 2,
  },
  hubTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
  },
  hubTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    alignItems: 'center',
    ...shadow,
  },
  statValue: {
    fontFamily: serif,
    fontSize: 19,
    fontWeight: '800',
    color: '#3A1208',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#8C786E',
    fontWeight: '600',
    marginTop: 2,
  },
  tabsScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 14,
  },
  tabChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6458',
  },
  tabTextActive: {
    color: '#FFF',
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 12,
    ...shadow,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontFamily: serif,
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
  },
  orderDate: {
    fontSize: 11,
    color: '#8C786E',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillOrange: {
    backgroundColor: '#FEF3C7',
  },
  statusPillGreen: {
    backgroundColor: '#DCFCE7',
  },
  statusPillBlue: {
    backgroundColor: '#DBEAFE',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EDE4',
    marginVertical: 10,
  },
  customerInfo: {
    marginBottom: 8,
  },
  custName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3A1208',
  },
  custAddr: {
    fontSize: 12,
    color: '#7A6458',
    marginTop: 2,
    lineHeight: 16,
  },
  itemsBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    gap: 4,
  },
  itemMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMiniName: {
    fontSize: 12,
    color: '#3A1208',
    flex: 1,
  },
  itemMiniRack: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 6,
  },
  itemMiniQty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3A1208',
  },
  packagingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  packagingNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 14,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTotal: {
    fontFamily: serif,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#15803D',
  },
  packBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  packBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 10, 5, 0.75)',
    justifyContent: 'flex-end',
  },
  packModalSheet: {
    backgroundColor: '#FAF7F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  packModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  packModalOrder: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '800',
    color: '#3A1208',
  },
  packModalSub: {
    fontSize: 12,
    color: '#8C786E',
    marginTop: 2,
  },
  pickListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3A1208',
    marginBottom: 10,
  },
  pickItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  pickItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A1208',
  },
  pickItemMeta: {
    fontSize: 11.5,
    color: '#7A6458',
    marginTop: 3,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E8',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  scanBtnDone: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  weightCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  weightLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#3A1208',
    marginBottom: 6,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    backgroundColor: '#FAF7F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    paddingHorizontal: 12,
    height: 38,
    width: 90,
    fontSize: 14,
    fontWeight: '800',
    color: '#3A1208',
  },
  kgUnit: {
    marginLeft: 8,
    fontSize: 13,
    color: '#8C786E',
    fontWeight: '600',
  },
  courierCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  courierTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#166534',
  },
  courierSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  completePackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    ...shadow,
  },
  completePackBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
