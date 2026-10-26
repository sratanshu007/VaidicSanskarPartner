import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import { Header } from '../../components/ui';
import { usePartner } from '../../context/PartnerContext';
import panditBookingStore from '../../services/panditBookingStore';

const PANDIT_REVIEW_TAGS = [
  'समय पर तैयार (Ready on time)',
  'सामग्री व्यवस्थित (Items arranged)',
  'सभ्य व आदरयुक्त व्यवहार (Polite behavior)',
  'दक्षिणा तुरंत दी (Prompt payment)',
  'पवित्र व शांत वातावरण (Devout atmosphere)',
  'सहयोगी परिवार (Cooperative family)',
];

export default function ReviewScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { addEarning } = usePartner();
  const job = route.params?.job || panditBookingStore.getBooking();
  const yajmanName = route.params?.name || job?.yajmanName || 'यजमान';

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([PANDIT_REVIEW_TAGS[0], PANDIT_REVIEW_TAGS[1]]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    const earning = job?.dakshina ? Math.round(job.dakshina * 0.85) : 1785;
    addEarning(earning, job?.pooja?.name || 'पूजा सेवा');
    panditBookingStore.submitReview({
      rating,
      tags: selectedTags,
      comment,
      from: 'pandit',
    });
    panditBookingStore.reset();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const dakshina = job?.dakshina || 2100;
  const netDakshina = Math.round(dakshina * 0.85);
  const samagriFee = job?.withSamagri ? (job?.samagriFee || 600) : 0;
  const totalCredited = netDakshina + samagriFee;

  return (
    <View style={s.container}>
      <Header
        title="पूजा संपन्न 🙏"
        subtitle="यजमान मूल्यांकन व समीक्षा"
        navigation={navigation}
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Payout Unlocked Banner */}
        <View style={s.payoutCard}>
          <View style={s.tickBox}>
            <MaterialCommunityIcons name="check-decagram" size={36} color="#15803D" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.payoutTitle}>दक्षिणा वॉलेट में क्रेडिट हुई</Text>
            <Text style={s.payoutAmount}>₹ {totalCredited}</Text>
            <Text style={s.payoutSub}>
              ₹{netDakshina} (85% शुद्ध दक्षिणा){samagriFee > 0 ? ` + ₹${samagriFee} सामग्री नकद` : ''}
            </Text>
          </View>
        </View>

        {/* Rating Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>यजमान {yajmanName} का मूल्यांकन करें</Text>
          <Text style={s.cardSub}>
            आपका फीडबैक वैदिक संस्कार समुदाय में शिष्टाचार बनाए रखने में मदद करता है।
          </Text>

          {/* 5-Star Row */}
          <View style={s.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={s.starTouch}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={colors.gold}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.ratingLabel}>
            {rating === 5 && 'उत्कृष्ट यजमान (5 / 5)'}
            {rating === 4 && 'बहुत अच्छा अनुभव (4 / 5)'}
            {rating === 3 && 'संतोषजनक (3 / 5)'}
            {rating <= 2 && 'सुधार की आवश्यकता'}
          </Text>

          <View style={s.divider} />

          {/* Quick Tags */}
          <Text style={s.tagsTitle}>अनुभव के मुख्य बिंदु चुनें</Text>
          <View style={s.tagsGrid}>
            {PANDIT_REVIEW_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[s.tagChip, active && s.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={active ? 'check' : 'plus'}
                    size={14}
                    color={active ? '#FFF' : '#7A6458'}
                  />
                  <Text style={[s.tagText, active && s.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.divider} />

          {/* Comment input */}
          <Text style={s.tagsTitle}>अतिरिक्त टिप्पणी (वैकल्पिक)</Text>
          <TextInput
            style={s.input}
            multiline
            placeholder="यजमान परिवार के साथ आपका अनुभव कैसा रहा..."
            placeholderTextColor="#8C786E"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={s.submitBtn}
          activeOpacity={0.85}
          onPress={handleSubmit}
        >
          <Text style={s.submitBtnText}>मूल्यांकन सबमिट करें व होम पर जाएं ›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    padding: 18,
  },
  payoutCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...shadow,
  },
  tickBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
  },
  payoutAmount: {
    fontFamily: serif,
    fontSize: 26,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  payoutSub: {
    fontSize: 11.5,
    color: '#15803D',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginBottom: 18,
    ...shadow,
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '800',
    color: '#3A1208',
  },
  cardSub: {
    fontSize: 12.5,
    color: '#7A6458',
    marginTop: 3,
    lineHeight: 18,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 18,
    gap: 8,
  },
  starTouch: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EDE4',
    marginVertical: 14,
  },
  tagsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A1208',
    marginBottom: 10,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
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
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 12,
    color: '#7A6458',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#FAF7F0',
    borderRadius: 14,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#3A1208',
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    ...shadow,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
