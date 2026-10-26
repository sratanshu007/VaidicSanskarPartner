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

export default function PortfolioScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [mandaliName, setMandaliName] = useState('श्री श्याम कृपा भजन मंडली');
  const [leaderName, setLeaderName] = useState('पं. सत्यनारायण मिश्रा');
  const [city, setCity] = useState('वाराणसी, उत्तर प्रदेश');
  const [radiusKm, setRadiusKm] = useState('25');
  const [membersCount, setMembersCount] = useState('7');
  const [expYears, setExpYears] = useState('12');
  const [ownSound, setOwnSound] = useState(true);

  const [selectedStyles, setSelectedStyles] = useState([
    'श्री सुंदरकांड पाठ',
    'भजन संध्या व संकीर्तन',
    'खाटू श्याम संकीर्तन',
  ]);

  const [selectedInstruments, setSelectedInstruments] = useState([
    'हारमोनियम',
    'ढोलक',
    'तबला',
    'मंजीरा',
    'ऑक्टोपैड',
  ]);

  const [pkgPrice, setPkgPrice] = useState('11000');
  const [pkgDuration, setPkgDuration] = useState('3 घंटे');
  const [extraHourRate, setExtraHourRate] = useState('2500');

  const ALL_STYLES = [
    'श्री सुंदरकांड पाठ',
    'भजन संध्या व संकीर्तन',
    'भगवती जागरण व जगराता',
    'खाटू श्याम संकीर्तन',
    'श्री रामचरितमानस पाठ',
    'साईं संध्या व भजन',
    'हनुमान चालीसा पाठ',
  ];

  const ALL_INSTRUMENTS = [
    'हारमोनियम',
    'ढोलक',
    'तबला',
    'मंजीरा',
    'ऑक्टोपैड',
    'सिंथेसाइजर',
    'झांझ',
  ];

  const toggleStyle = (st) => {
    if (selectedStyles.includes(st)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== st));
    } else {
      setSelectedStyles([...selectedStyles, st]);
    }
  };

  const toggleInstrument = (ins) => {
    if (selectedInstruments.includes(ins)) {
      setSelectedInstruments(selectedInstruments.filter((i) => i !== ins));
    } else {
      setSelectedInstruments([...selectedInstruments, ins]);
    }
  };

  const handleSave = () => {
    Alert.alert('प्रोफाइल सुरक्षित ✓', 'मंडली विवरण व पैकेज सफलतापूर्वक अपडेट कर दिए गए हैं।', [
      { text: 'ठीक है', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={s.container}>
      <Header
        title="मंडली प्रोफाइल व पैकेज"
        subtitle="लिस्टिंग, सदस्य संख्या व दरें"
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Details Card */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>मूल विवरण व मुखिया</Text>

          <Text style={s.label}>मंडली का नाम *</Text>
          <TextInput
            style={s.input}
            value={mandaliName}
            onChangeText={setMandaliName}
          />

          <Text style={s.label}>मंडली मुखिया / व्यास का नाम *</Text>
          <TextInput
            style={s.input}
            value={leaderName}
            onChangeText={setLeaderName}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1.5 }}>
              <Text style={s.label}>आधार शहर (Base City) *</Text>
              <TextInput style={s.input} value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>सेवा दायरा (km) *</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={radiusKm}
                onChangeText={setRadiusKm}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>कुल सदस्य संख्या *</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={membersCount}
                onChangeText={setMembersCount}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>अनुभव (वर्ष)</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={expYears}
                onChangeText={setExpYears}
              />
            </View>
          </View>
        </View>

        {/* Styles Multi-Select */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>भजन व संकीर्तन शैलियां (Singing Styles)</Text>
          <View style={s.chipGrid}>
            {ALL_STYLES.map((st) => {
              const active = selectedStyles.includes(st);
              return (
                <TouchableOpacity
                  key={st}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => toggleStyle(st)}
                >
                  <MaterialCommunityIcons
                    name={active ? 'check' : 'plus'}
                    size={14}
                    color={active ? '#FFF' : '#7A6458'}
                  />
                  <Text style={[s.chipText, active && s.chipTextActive]}>{st}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Instruments & Sound System */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>वाद्य यंत्र व साउंड सिस्टम</Text>

          <View style={s.soundSwitchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.soundSwitchTitle}>क्या मंडली का स्वयं का साउंड सिस्टम है?</Text>
              <Text style={s.soundSwitchSub}>
                यदि हाँ, तो पैकेज में हाई-क्वालिटी साउंड व माइक व्यवस्था शामिल मानी जाएगी।
              </Text>
            </View>
            <Switch
              value={ownSound}
              onValueChange={setOwnSound}
              trackColor={{ false: '#ECE3D7', true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <Text style={[s.label, { marginTop: 12 }]}>शामिल वाद्य यंत्र (Instruments):</Text>
          <View style={s.chipGrid}>
            {ALL_INSTRUMENTS.map((ins) => {
              const active = selectedInstruments.includes(ins);
              return (
                <TouchableOpacity
                  key={ins}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => toggleInstrument(ins)}
                >
                  <MaterialCommunityIcons
                    name={active ? 'check' : 'plus'}
                    size={14}
                    color={active ? '#FFF' : '#7A6458'}
                  />
                  <Text style={[s.chipText, active && s.chipTextActive]}>{ins}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Packages & Pricing */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>मानक पैकेज व दरें (Package & Rates)</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>कार्यक्रम पैकेज दर (₹) *</Text>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={pkgPrice}
                onChangeText={setPkgPrice}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>मानक अवधि</Text>
              <TextInput
                style={s.input}
                value={pkgDuration}
                onChangeText={setPkgDuration}
              />
            </View>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={s.label}>अतिरिक्त समय की दर (₹ प्रति घंटा):</Text>
            <TextInput
              style={s.input}
              keyboardType="number-pad"
              value={extraHourRate}
              onChangeText={setExtraHourRate}
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        <TouchableOpacity style={s.saveBtn} activeOpacity={0.85} onPress={handleSave}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFF" />
          <Text style={s.saveBtnText}>मंडली प्रोफाइल सुरक्षित करें ›</Text>
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
    marginBottom: 4,
    marginTop: 6,
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: '#ECE3D7',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: '#7A6458',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  soundSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  soundSwitchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3A1208',
  },
  soundSwitchSub: {
    fontSize: 11,
    color: '#7A6458',
    marginTop: 2,
    lineHeight: 15,
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
