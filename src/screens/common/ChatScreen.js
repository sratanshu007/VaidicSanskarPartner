import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/ui';
import colors from '../../theme/colors';
import socket from '../../services/socket';
import panditBookingStore from '../../services/panditBookingStore';
import { useKeyboardLift } from '../../utils/useKeyboardLift';

/**
 * Phone Number Detection & Blocker:
 * Prevents sharing of phone numbers to strictly comply with privacy policy and prevent disintermediation.
 */
export function isPhoneNumberBlocked(input) {
  if (!input || typeof input !== 'string') return false;

  // 1. Standard Indian 10-digit mobile number with optional +91/0 prefix and separators
  const phoneRegex = /(?:(?:\+|0{0,2})91[\s.-]*)?(?:[6-9][\s.-]*(?:\d[\s.-]*){9})/i;
  if (phoneRegex.test(input)) return true;

  // 2. Any sequence containing 10 or more digits
  const digitsOnly = input.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 10) return true;

  // 3. Obfuscated digits with spaces/dots/dashes
  const spacedDigits = input.match(/(?:\d[\s\-_.,/]*){10,}/g);
  if (spacedDigits && spacedDigits.length > 0) return true;

  return false;
}

const PANDIT_QUICK_REPLIES = [
  'प्रणाम यजमान जी 🙏',
  'मैं रास्ते में हूँ, 10 मिनट में पहुँच रहा हूँ 🚗',
  'मैं आपके स्थान पर पहुँच चुका हूँ 🪔',
  'कृपया पूजा सामग्री तैयार रखें',
  'कृपया मुख्य द्वार खोलें',
];

export default function ChatScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const booking = panditBookingStore.getBooking() || route.params?.job;
  const name = route.params?.name || route.params?.yajmanName || booking?.yajmanName || 'यजमान';
  const bookingId = String(route.params?.bookingId || route.params?.id || route.params?.jobId || booking?.id || '');

  const [messages, setMessages] = useState(() => {
    if (Array.isArray(booking?.chatMessages) && booking.chatMessages.length > 0) {
      return [...booking.chatMessages];
    }
    return [
      {
        id: 'init-1',
        sender: 'pandit',
        text: `प्रणाम यजमान जी 🙏 मैंने आपकी ${booking?.pooja?.name || booking?.name || 'पूजा'} की सेवा स्वीकार कर ली है।`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [text, setText] = useState('');
  const listRef = useRef();
  const { androidLift, onContainerLayout } = useKeyboardLift(() => {
    listRef.current?.scrollToEnd({ animated: true });
  });

  useEffect(() => {
    if (bookingId) {
      socket.join(bookingId);
    }

    // Reactive subscription to panditBookingStore
    const unsub = panditBookingStore.subscribe((b) => {
      if (b?.chatMessages && Array.isArray(b.chatMessages)) {
        setMessages([...b.chatMessages]);
      }
    });

    // Real-time socket listener for incoming messages from yajman (devotee)
    const handleIncoming = (m) => {
      if (!m || !m.text) return;
      if (m.bookingId && bookingId && String(m.bookingId) !== String(bookingId)) return;
      if (m.from === 'pandit' || m.sender === 'pandit') return; // ignore own echo

      panditBookingStore.sendChatMessage('yajman', m.text);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const unsubMsg = socket.on('chat:message', handleIncoming);
    const unsubChat = socket.on('booking:chat', handleIncoming);

    return () => {
      if (typeof unsubMsg === 'function') unsubMsg();
      if (typeof unsubChat === 'function') unsubChat();
      if (typeof unsub === 'function') unsub();
    };
  }, [bookingId]);

  const send = (overrideText) => {
    const content = (overrideText || text).trim();
    if (!content) return;

    // Check privacy compliance: block phone numbers
    if (isPhoneNumberBlocked(content)) {
      Alert.alert(
        '⚠️ फोन नंबर साझा करना प्रतिबंधित है',
        'गोपनीयता नीति (Privacy Policy) के अनुसार व्यक्तिगत मोबाइल नंबर चैट में भेजना प्रतिबंधित है।\n\nयजमान से संपर्क करने के लिए "सुरक्षित कॉल (Masked Call)" सुविधा का उपयोग करें।',
        [{ text: 'समझ गया' }]
      );
      return;
    }

    // 1. Update local reactive store
    panditBookingStore.sendChatMessage('pandit', content);

    // 2. Broadcast via socket to User App
    const payload = {
      bookingId: bookingId || 'LIVE',
      id: 'm-' + Date.now(),
      sender: 'pandit',
      from: 'pandit',
      to: 'yajman',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    socket.emit('chat:message', payload);
    socket.emit('booking:chat', payload);

    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      onLayout={onContainerLayout}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        s.container,
        Platform.OS === 'android' && androidLift > 0 ? { paddingBottom: androidLift } : null,
      ]}
    >
      <Header
        title={name}
        subtitle="🔒 100% सुरक्षित चैट · नंबर गोपनीय"
        navigation={navigation}
        colorsArr={colors.maroonGradient}
        right={
          <TouchableOpacity
            style={s.callHeaderBtn}
            onPress={() => Linking.openURL('tel:+911140844892')}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* TOP PRIVACY BANNER */}
      <View style={s.privacyNotice}>
        <MaterialCommunityIcons name="shield-lock" size={15} color="#B45309" />
        <Text style={s.privacyNoticeText}>
          सुरक्षित संचार: व्यक्तिगत मोबाइल नंबर साझा करना प्रतिबंधित है।
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m, idx) => m.id || String(idx)}
        contentContainerStyle={{ padding: 16, paddingBottom: 10, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender === 'pandit' || item.from === 'pandit' || item.from === 'me';
          const isSys = item.sender === 'system';

          if (isSys) {
            return (
              <View style={s.sysBubble}>
                <Text style={s.sysText}>{item.text}</Text>
              </View>
            );
          }

          return (
            <View style={[s.bubble, isMe ? s.me : s.them]}>
              <Text style={[s.msg, isMe && s.meText]}>{item.text}</Text>
              <Text style={[s.time, isMe && s.meTime]}>{item.time || item.at || ''}</Text>
            </View>
          );
        }}
      />

      {/* QUICK REPLIES BAR FOR PANDIT */}
      <View style={s.quickBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {PANDIT_QUICK_REPLIES.map((q) => (
            <TouchableOpacity key={q} style={s.quickChip} onPress={() => send(q)}>
              <Text style={s.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* INPUT BAR */}
      <View
        style={[
          s.inputBar,
          { paddingBottom: androidLift > 0 ? 10 : Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          style={s.input}
          placeholder="यजमान को संदेश लिखें..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120)}
          multiline
          maxLength={800}
          textAlignVertical="center"
        />
        <TouchableOpacity style={s.sendBtn} onPress={() => send()} activeOpacity={0.85}>
          <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  callHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  privacyNoticeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  me: {
    backgroundColor: colors.maroon,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  them: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msg: {
    fontSize: 14.5,
    color: colors.text,
    lineHeight: 20,
  },
  meText: {
    color: '#FFFFFF',
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  meTime: {
    color: colors.goldSoft,
  },
  sysBubble: {
    alignSelf: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sysText: {
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: '600',
  },
  quickBar: {
    backgroundColor: '#FAF5EE',
    borderTopWidth: 1,
    borderTopColor: '#E8DEC8',
    paddingVertical: 8,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D48B28',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#67101F',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: colors.cream,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
