import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartner } from '../../context/PartnerContext';
import colors from '../../theme/colors';

const CATEGORIES = ['All', 'Pooja', 'Havan', 'Special'];

export default function PoojaServicesScreen({ navigation }) {
  const { poojaServices } = usePartner();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredServices = poojaServices.filter(
    (s) => selectedCategory === 'All' || s.category === selectedCategory
  );

  const getIconForType = (type) => {
    switch (type) {
      case 'shiva':
        return { name: 'om', color: '#D48B28' };
      case 'ganesh':
        return { name: 'hands-pray', color: '#D48B28' };
      case 'lakshmi':
        return { name: 'lotus', color: '#D48B28' };
      default:
        return { name: 'fire', color: '#D48B28' };
    }
  };

  const handleBookNow = (service) => {
    Alert.alert(
      'Service Booking',
      `Schedule a booking or customize package: ${service.title}\nPrice: ₹ ${service.price.toLocaleString('en-IN')}`,
      [
        { text: 'Manage Pricing / Hours' },
        { text: 'View Details', onPress: () => navigation.navigate('BookingDetails', { bookingId: 'b1' }) },
        { text: 'OK' },
      ]
    );
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
          <Text style={s.headerTitle}>Pooja Services</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Category Pills */}
        <View style={s.tabContainer}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat)}
                style={[s.tabPill, isActive && s.tabPillActive]}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.list}>
            {filteredServices.map((item) => {
              const icon = getIconForType(item.imageType);
              return (
                <View key={item.id} style={s.serviceCard}>
                  {/* Deity Image / Icon Circle */}
                  <View style={s.deityCircle}>
                    <MaterialCommunityIcons name={icon.name} size={28} color={icon.color} />
                  </View>

                  <View style={s.serviceInfo}>
                    <Text style={s.serviceTitle}>{item.title}</Text>
                    <Text style={s.servicePrice}>₹ {item.price.toLocaleString('en-IN')}</Text>
                    <Text style={s.serviceDuration}>{item.duration}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => handleBookNow(item)}
                    style={s.bookNowBtn}
                  >
                    <Text style={s.bookNowBtnText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 18,
    gap: 10,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F2EAE1',
    borderWidth: 1,
    borderColor: '#E8DCD0',
  },
  tabPillActive: {
    backgroundColor: '#67101F',
    borderColor: '#67101F',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C4447',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  list: {
    gap: 14,
  },
  serviceCard: {
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
  },
  deityCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FDF5EA',
    borderWidth: 1,
    borderColor: '#F6E4CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1418',
    marginBottom: 3,
  },
  servicePrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2E1418',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#7D686B',
  },
  bookNowBtn: {
    backgroundColor: '#67101F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
