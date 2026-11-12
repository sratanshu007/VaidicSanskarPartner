import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { serif, shadow } from '../../theme/styles';
import { usePartner } from '../../context/PartnerContext';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['06:00 AM', '09:00 AM', '12:00 PM', '04:00 PM', '07:00 PM'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function SlotManagerScreen({ navigation }) {
  const { bookings, slots, toggleSlot } = usePartner();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [showSlotControls, setShowSlotControls] = useState(false);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
      cells.push({ day: prevMonthDays - i, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({ day: d, inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length - (firstWeekday + daysInMonth) + 1, inMonth: false });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const changeMonth = (delta) => {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
    setSelectedDay(1);
  };

  const bookingsList = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    const active = list.filter(
      (b) => String(b.status || '').toLowerCase() !== 'cancelled'
    );
    if (active.length > 0) return active.slice(0, 4);
    return [
      {
        id: 'cal-sample-1',
        poojaName: 'Satyanarayan Puja',
        time: '10:00 AM',
        date: `${selectedDay} ${MONTHS[viewMonth].slice(0, 3)} ${viewYear}`,
        amount: 2500,
        status: 'confirmed',
      },
    ];
  }, [bookings, selectedDay, viewMonth, viewYear]);

  const selectedWeekdayIndex = new Date(viewYear, viewMonth, selectedDay).getDay();
  const weekdayKey = SHORT_DAYS[(selectedWeekdayIndex + 6) % 7];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4A0813" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>My Calendar</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* White Sacred Month Calendar Card */}
        <View style={[styles.calendarCard, shadow]}>
          <View style={styles.monthBar}>
            <TouchableOpacity style={styles.monthArrow} onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={18} color="#4A0813" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity style={styles.monthArrow} onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={18} color="#4A0813" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((wd) => (
              <Text key={wd} style={styles.weekHeaderText}>
                {wd}
              </Text>
            ))}
          </View>

          <View style={styles.gridWrap}>
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.inMonth && cell.day === selectedDay;
              return (
                <TouchableOpacity
                  key={`${cell.day}-${idx}`}
                  disabled={!cell.inMonth}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDay(cell.day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.inMonth && styles.dayMuted,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Bookings Header */}
        <View style={styles.bookingsHeadRow}>
          <Text style={styles.sectionTitle}>Today's Bookings</Text>
          <Text style={styles.countText}>
            {bookingsList.length} Booking{bookingsList.length > 1 ? 's' : ''}
          </Text>
        </View>

        {bookingsList.map((b, idx) => {
          const id = b.id || b._id || b.bookingId || `b-${idx}`;
          return (
            <View key={id} style={[styles.bookingCard, shadow]}>
              <Image
                source={require('../../../assets/banner_havan_kund.png')}
                style={styles.bookingAvatar}
                resizeMode="cover"
              />
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle} numberOfLines={1}>
                  {b.poojaName || b.serviceName || b.title || 'Satyanarayan Puja'}
                </Text>
                <Text style={styles.bookingTime}>{b.time || b.slot || '10:00 AM'}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.viewBtn}
                onPress={() =>
                  navigation.navigate('BookingDetails', { bookingId: id, booking: b })
                }
              >
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Expandable Time Slot Availability Controls */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.slotsAccordion, shadow]}
          onPress={() => setShowSlotControls((prev) => !prev)}
        >
          <View>
            <Text style={styles.slotsTitle}>Available Time Slots ({weekdayKey})</Text>
            <Text style={styles.slotsSub}>Tap to manage your Muhurat & Pooja availability</Text>
          </View>
          <Ionicons
            name={showSlotControls ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#4A0813"
          />
        </TouchableOpacity>

        {showSlotControls && (
          <View style={[styles.slotsPanel, shadow]}>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const blocked =
                  Array.isArray(slots?.[weekdayKey]) && slots[weekdayKey].includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    activeOpacity={0.8}
                    style={[styles.slotChip, !blocked ? styles.slotAvail : styles.slotBlocked]}
                    onPress={() => toggleSlot?.(weekdayKey, slot)}
                  >
                    <Text
                      style={[
                        styles.slotChipText,
                        !blocked ? styles.slotAvailText : styles.slotBlockedText,
                      ]}
                    >
                      {slot} {blocked ? '(Off)' : '(Open)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 14,
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
  headerTitle: {
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '700',
    color: '#4A0813',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 34,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 20,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  monthArrow: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  monthLabel: {
    fontFamily: serif,
    fontSize: 16.5,
    fontWeight: '700',
    color: '#2F1510',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8D7B6E',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: '#67101F',
  },
  dayText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2F1510',
  },
  dayMuted: {
    color: '#C5B8AA',
    fontWeight: '400',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bookingsHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 17.5,
    fontWeight: '700',
    color: '#2F1510',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B55B19',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EADFD1',
    marginBottom: 10,
    gap: 12,
  },
  bookingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFE4D6',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F1510',
  },
  bookingTime: {
    fontSize: 12.5,
    color: '#7A6859',
    marginTop: 2,
  },
  viewBtn: {
    backgroundColor: '#67101F',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
  },
  viewBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slotsAccordion: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EADFD1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotsTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#4A0813',
  },
  slotsSub: {
    fontSize: 12,
    color: '#7A6859',
    marginTop: 2,
  },
  slotsPanel: {
    marginTop: 8,
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EADFD1',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotAvail: {
    backgroundColor: '#EAF8EF',
    borderColor: '#1E8E4A',
  },
  slotBlocked: {
    backgroundColor: '#F5ECE6',
    borderColor: '#D5C3B6',
  },
  slotChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  slotAvailText: {
    color: '#1E8E4A',
  },
  slotBlockedText: {
    color: '#8C7A6B',
  },
});
