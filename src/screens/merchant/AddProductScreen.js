import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import merchantStore, { STORE_CATEGORIES } from '../../services/estoreStore';

export default function AddProductScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [category, setCategory] = useState('kits');
  const [isKit, setIsKit] = useState(false);
  const [poojaType, setPoojaType] = useState('Satyanarayan Katha');
  const [price, setPrice] = useState('1199');
  const [mrp, setMrp] = useState('1599');
  const [stock, setStock] = useState('50');
  const [sku, setSku] = useState('KIT-NEW-01');
  const [rack, setRack] = useState('Aisle 2, Rack B-05');
  const [weight, setWeight] = useState('1.2 kg');
  const [hsn, setHsn] = useState('33074100');
  const [gstPercent, setGstPercent] = useState('12');
  const [isFragile, setIsFragile] = useState(false);
  const [isLiquid, setIsLiquid] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !nameHi.trim() || !price) {
      Alert.alert('त्रुटि', 'कृपया सामग्री का नाम (हिंदी व अंग्रेजी) और मूल्य दर्ज करें।');
      return;
    }

    merchantStore.addProduct({
      name,
      nameHi,
      category,
      isKit,
      poojaType: isKit ? poojaType : null,
      price: Number(price),
      mrp: Number(mrp) || Number(price) * 1.3,
      stock: Number(stock) || 0,
      sku,
      rack,
      weight,
      hsn,
      gstPercent: Number(gstPercent),
      isFragile,
      isLiquid,
    });

    Alert.alert('सफल ✓', 'नई सामग्री सफलतापूर्वक इन्वेंटरी में जोड़ दी गई है।', [
      { text: 'ठीक है', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={s.container}>
      <Header
        title="नई पूजा सामग्री जोड़ें"
        subtitle="कैटलॉग व वेयरहाउस रैक प्रविष्टि"
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Kit vs Regular Product Toggle */}
        <View style={s.card}>
          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchTitle}>क्या यह सम्पूर्ण पूजा किट (Pooja Kit) है?</Text>
              <Text style={s.switchSub}>
                किट को सीधे यजमान की पंडित बुकिंग के साथ 1-क्लिक में जोड़ा जा सकता है।
              </Text>
            </View>
            <Switch
              value={isKit}
              onValueChange={setIsKit}
              trackColor={{ false: '#ECE3D7', true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          {isKit && (
            <View style={s.kitPoojaRow}>
              <Text style={s.label}>संबद्ध पूजा का प्रकार (Associated Pooja):</Text>
              <View style={s.poojaChips}>
                {[
                  'Satyanarayan Katha',
                  'Rudrabhishek Pooja',
                  'Griha Pravesh',
                  'Maha Mrityunjaya',
                  'Navgrah Shanti',
                ].map((pt) => (
                  <TouchableOpacity
                    key={pt}
                    style={[s.poojaChip, poojaType === pt && s.poojaChipActive]}
                    onPress={() => setPoojaType(pt)}
                  >
                    <Text style={[s.poojaChipText, poojaType === pt && s.poojaChipTextActive]}>
                      {pt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Product Names */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>सामग्री नाम व विवरण</Text>
          <Text style={s.label}>हिंदी नाम (यजमान ऐप में प्रमुखता से दिखेगा) *</Text>
          <TextInput
            style={s.input}
            placeholder="उदा. श्री सत्यनारायण कथा सम्पूर्ण पूजा किट"
            placeholderTextColor="#8C786E"
            value={nameHi}
            onChangeText={setNameHi}
          />

          <Text style={s.label}>अंग्रेजी नाम (English Title) *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Satyanarayan Pooja Complete Kit"
            placeholderTextColor="#8C786E"
            value={name}
            onChangeText={setName}
          />

          <Text style={s.label}>श्रेणी (Category):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            <View style={s.catRow}>
              {STORE_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, category === cat.id && s.catChipActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[s.catChipText, category === cat.id && s.catChipTextActive]}>
                    {cat.hi}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Pricing & Stock */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>मूल्य, SKU व स्टॉक विवरण</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>विक्रय मूल्य (₹) *</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>MRP (₹)</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={mrp}
                onChangeText={setMrp}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>SKU कोड</Text>
              <TextInput style={s.input} value={sku} onChangeText={setSku} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>प्रारंभिक स्टॉक संख्या *</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={stock}
                onChangeText={setStock}
              />
            </View>
          </View>
        </View>

        {/* Warehouse Fulfillment & Logistics */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>वेयरहाउस रैक व लॉजिस्टिक्स नियम</Text>
          <Text style={s.label}>वेयरहाउस रैक स्थान (Warehouse Rack Location):</Text>
          <TextInput
            style={s.input}
            placeholder="उदा. Aisle 2, Rack B-05"
            placeholderTextColor="#8C786E"
            value={rack}
            onChangeText={setRack}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>पैक्ड वजन</Text>
              <TextInput style={s.input} value={weight} onChangeText={setWeight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>HSN कोड</Text>
              <TextInput style={s.input} value={hsn} onChangeText={setHsn} />
            </View>
            <View style={{ flex: 0.8 }}>
              <Text style={s.label}>GST (%)</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={gstPercent}
                onChangeText={setGstPercent}
              />
            </View>
          </View>

          {/* Special packing flags */}
          <View style={s.flagRow}>
            <View style={s.switchMini}>
              <Text style={s.flagLabel}>कांच / टूटने योग्य (Fragile)</Text>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: '#ECE3D7', true: colors.primary }}
              />
            </View>
            <View style={s.switchMini}>
              <Text style={s.flagLabel}>द्रव / तेल / घी (Liquid)</Text>
              <Switch
                value={isLiquid}
                onValueChange={setIsLiquid}
                trackColor={{ false: '#ECE3D7', true: colors.primary }}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        <TouchableOpacity style={s.saveBtn} activeOpacity={0.85} onPress={handleSave}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFF" />
          <Text style={s.saveBtnText}>सामग्री सुरक्षित करें व कैटलॉग में जोड़ें ›</Text>
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 14,
    ...shadow,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#3A1208',
  },
  switchSub: {
    fontSize: 11,
    color: '#7A6458',
    marginTop: 2,
    lineHeight: 15,
  },
  kitPoojaRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3EDE4',
  },
  poojaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  poojaChip: {
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  poojaChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  poojaChipText: {
    fontSize: 11,
    color: '#7A6458',
    fontWeight: '700',
  },
  poojaChipTextActive: {
    color: '#FFF',
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 15,
    fontWeight: '800',
    color: '#3A1208',
    marginBottom: 10,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A6458',
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#3A1208',
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  catRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catChip: {
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 11.5,
    color: '#7A6458',
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3EDE4',
  },
  switchMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagLabel: {
    fontSize: 12,
    color: '#3A1208',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE3D7',
    paddingHorizontal: 16,
    paddingTop: 12,
    ...shadow,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
