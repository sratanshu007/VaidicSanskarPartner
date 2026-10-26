import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import partnerKundaliStore from '../../services/horoscopeKundaliStore';

export default function KundaliToolsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [toolMode, setToolMode] = useState('kundali'); // 'kundali' | 'matching'

  // Input states
  const [clientName, setClientName] = useState('रमेश कुमार');
  const [clientDob, setClientDob] = useState('15/08/1994');
  const [clientTob, setClientTob] = useState('06:45 AM');
  const [clientPob, setClientPob] = useState('लखनऊ, उत्तर प्रदेश');

  const clientChart = partnerKundaliStore.getClientKundali();
  const matchingData = partnerKundaliStore.getMatching();

  const handleCompute = () => {
    partnerKundaliStore.computeChart(clientName, clientDob, clientTob, clientPob);
    Alert.alert('कुण्डली गणना संपन्न', 'यजमान की वैदिक लग्न कुण्डली व ग्रह गणना सफलतापूर्वक अपडेट हो गई है।');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Navigation Header */}
      <View style={s.navHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.navTitle}>ज्योतिष साधन (Astro Tools)</Text>
          <Text style={s.navSub}>कुण्डली निर्माण एवं अष्टकूट गुण मिलान</Text>
        </View>
      </View>

      {/* Tool Mode Selector */}
      <View style={s.toolTabsRow}>
        <TouchableOpacity
          style={[s.toolTab, toolMode === 'kundali' && s.selectedToolTab]}
          onPress={() => setToolMode('kundali')}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={16}
            color={toolMode === 'kundali' ? '#FFFFFF' : colors.textMuted}
          />
          <Text style={[s.toolTabLabel, toolMode === 'kundali' && s.selectedToolTabLabel]}>
            लग्न कुण्डली (Birth Chart)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.toolTab, toolMode === 'matching' && s.selectedToolTab]}
          onPress={() => setToolMode('matching')}
        >
          <MaterialCommunityIcons
            name="heart-multiple"
            size={16}
            color={toolMode === 'matching' ? '#FFFFFF' : colors.textMuted}
          />
          <Text style={[s.toolTabLabel, toolMode === 'matching' && s.selectedToolTabLabel]}>
            36 गुण मिलान (Matching)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mode 1: Kundali Generator */}
        {toolMode === 'kundali' && (
          <View>
            {/* Client Input Form */}
            <View style={s.inputCard}>
              <Text style={s.cardHeadTitle}>यजमान जन्म विवरण दर्ज करें:</Text>
              <TextInput
                style={s.textInput}
                value={clientName}
                onChangeText={setClientName}
                placeholder="यजमान का नाम"
              />
              <View style={s.twoInputsRow}>
                <TextInput
                  style={[s.textInput, { flex: 1, marginRight: 6 }]}
                  value={clientDob}
                  onChangeText={setClientDob}
                  placeholder="DD/MM/YYYY"
                />
                <TextInput
                  style={[s.textInput, { flex: 1, marginLeft: 6 }]}
                  value={clientTob}
                  onChangeText={setClientTob}
                  placeholder="06:45 AM"
                />
              </View>
              <TextInput
                style={s.textInput}
                value={clientPob}
                onChangeText={setClientPob}
                placeholder="जन्म स्थान (City, State)"
              />
              <TouchableOpacity style={s.computeBtn} onPress={handleCompute}>
                <MaterialCommunityIcons name="calculator-variant" size={18} color="#FFFFFF" />
                <Text style={s.computeBtnText}>वैदिक कुण्डली गणना करें</Text>
              </TouchableOpacity>
            </View>

            {/* Visual D1 Chart */}
            <View style={s.chartCard}>
              <Text style={s.chartHeadTitle}>D1 - जन्म लग्न कुण्डली ({clientChart.lagna})</Text>
              <View style={s.kundaliVisualBox}>
                <View style={s.chartRow}>
                  <View style={s.bhavBox}><Text style={s.bhavNum}>12</Text><Text style={s.bhavPlanets}>–</Text></View>
                  <View style={[s.bhavBox, s.lagnaBox]}><Text style={s.bhavNum}>1 (सिंह)</Text><Text style={s.bhavPlanets}>सूर्य, बुध</Text></View>
                  <View style={s.bhavBox}><Text style={s.bhavNum}>2</Text><Text style={s.bhavPlanets}>शुक्र</Text></View>
                </View>
                <View style={s.chartRow}>
                  <View style={s.bhavBox}><Text style={s.bhavNum}>11</Text><Text style={s.bhavPlanets}>मंगल</Text></View>
                  <View style={[s.bhavBox, { backgroundColor: '#FAF7F0' }]}><Text style={s.centerOm}>ॐ</Text></View>
                  <View style={s.bhavBox}><Text style={s.bhavNum}>3</Text><Text style={s.bhavPlanets}>गुरु</Text></View>
                </View>
                <View style={s.chartRow}>
                  <View style={s.bhavBox}><Text style={s.bhavNum}>10</Text><Text style={s.bhavPlanets}>केतु</Text></View>
                  <View style={s.bhavBox}><Text style={s.bhavNum}>7 (सप्तम)</Text><Text style={s.bhavPlanets}>शनि</Text></View>
                  <View style={s.bhavBox}><Text style={s.bhavNum}>4 (सुख)</Text><Text style={s.bhavPlanets}>चंद्रमा, राहु</Text></View>
                </View>
              </View>
            </View>

            {/* Planetary Table */}
            <View style={s.tableCard}>
              <Text style={s.cardHeadTitle}>ग्रह स्थिति तालिका (Degrees & Bhav):</Text>
              <View style={s.tableHeadRow}>
                <Text style={[s.th, { flex: 1.4 }]}>ग्रह</Text>
                <Text style={[s.th, { flex: 1.4 }]}>राशि</Text>
                <Text style={[s.th, { flex: 1.2 }]}>अंश</Text>
                <Text style={[s.th, { flex: 1 }]}>भाव</Text>
                <Text style={[s.th, { flex: 1.2 }]}>स्थिति</Text>
              </View>
              {clientChart.planets.map((p, i) => (
                <View key={i} style={[s.tableRow, i % 2 === 1 && { backgroundColor: '#FAF7F0' }]}>
                  <Text style={[s.td, { flex: 1.4, fontWeight: '700' }]}>{p.name}</Text>
                  <Text style={[s.td, { flex: 1.4 }]}>{p.rashi}</Text>
                  <Text style={[s.td, { flex: 1.2 }]}>{p.deg}</Text>
                  <Text style={[s.td, { flex: 1 }]}>{p.bhav}</Text>
                  <Text style={[s.td, { flex: 1.2, color: colors.primary }]}>{p.state}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mode 2: Matching Workbench */}
        {toolMode === 'matching' && (
          <View>
            <View style={s.scoreBox}>
              <Text style={s.scoreTitle}>{matchingData.boyName} + {matchingData.girlName}</Text>
              <View style={s.scoreDisc}>
                <Text style={s.scoreNum}>{matchingData.totalScore}</Text>
                <Text style={s.scoreSub}>/ 36 गुण</Text>
              </View>
              <Text style={s.scoreVerdict}>{matchingData.verdict}</Text>
            </View>

            <View style={s.tableCard}>
              <Text style={s.cardHeadTitle}>अष्टकूट 36 गुण विवरण तालिका:</Text>
              {matchingData.kootas.map((k, idx) => (
                <View key={idx} style={s.kootRow}>
                  <Text style={s.kootName}>{k.name}</Text>
                  <Text style={s.kootVal}>{k.score} / {k.max}</Text>
                </View>
              ))}
            </View>

            <View style={s.pariharBox}>
              <MaterialCommunityIcons name="information" size={18} color={colors.primary} />
              <Text style={s.pariharText}>{matchingData.pariharNote}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
  },
  navSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  toolTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toolTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  selectedToolTab: {
    backgroundColor: colors.primary,
  },
  toolTabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  selectedToolTabLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow(1),
  },
  cardHeadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FAF7F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 8,
  },
  twoInputsRow: {
    flexDirection: 'row',
  },
  computeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  computeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow(1),
  },
  chartHeadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  kundaliVisualBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  chartRow: {
    flexDirection: 'row',
    height: 64,
  },
  bhavBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lagnaBox: {
    backgroundColor: '#FFF8EB',
    borderColor: colors.saffron,
  },
  bhavNum: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: '700',
  },
  bhavPlanets: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
    textAlign: 'center',
  },
  centerOm: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '800',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 14,
    ...shadow(1),
  },
  tableHeadRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  td: {
    fontSize: 11,
    color: colors.text,
  },
  scoreBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow(2),
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  scoreDisc: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    borderWidth: 5,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  scoreNum: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  scoreSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  scoreVerdict: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success,
  },
  kootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  kootName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  kootVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  pariharBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8EB',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3DFC4',
  },
  pariharText: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
  },
});
