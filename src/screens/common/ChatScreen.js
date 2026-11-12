import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/ui';
import colors from '../../theme/colors';
import socket from '../../services/socket';
import { useKeyboardLift } from '../../utils/useKeyboardLift';

export default function ChatScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const name = route.params?.name || route.params?.yajmanName || 'यजमान';
  const bookingId = route.params?.bookingId || route.params?.id || route.params?.jobId;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef();
  const { androidLift, onContainerLayout } = useKeyboardLift(() => {
    listRef.current?.scrollToEnd({ animated: true });
  });

  useEffect(() => {
    if (bookingId) {
      socket.send('booking:join', { bookingId });
    }
    const off = socket.on('chat:message', (m) => {
      if (m?.from === 'yajman') {
        setMessages((p) => [
          ...p,
          {
            id: Date.now().toString() + Math.random(),
            from: 'them',
            text: m.text,
            at: now(m.at),
          },
        ]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });
    return () => {
      if (typeof off === 'function') off();
    };
  }, [bookingId]);

  const send = () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setMessages((p) => [...p, { id: Date.now().toString(), from: 'me', text: msgText, at: now() }]);
    socket.send('chat:message', {
      bookingId,
      from: 'pandit',
      text: msgText,
    });
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  };

  return (
    <KeyboardAvoidingView
      onLayout={onContainerLayout}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        { flex: 1, backgroundColor: colors.cream },
        Platform.OS === 'android' && androidLift > 0 ? { paddingBottom: androidLift } : null,
      ]}
    >
      <Header title={name} subtitle="🔒 Number masked · encrypted" navigation={navigation} colorsArr={colors.maroonGradient} />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[s.b, item.from === 'me' ? s.me : s.them]}>
            <Text style={[s.msg, item.from === 'me' && { color: '#fff' }]}>{item.text}</Text>
            <Text style={[s.time, item.from === 'me' && { color: colors.goldSoft }]}>{item.at}</Text>
          </View>
        )}
      />
      <View
        style={[
          s.bar,
          { paddingBottom: androidLift > 0 ? 10 : Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          style={s.input}
          placeholder="Type a message…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120)}
          multiline
          maxLength={1000}
          textAlignVertical="center"
        />
        <TouchableOpacity style={s.send} onPress={send}><MaterialCommunityIcons name="send" size={20} color="#fff" /></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
const s = StyleSheet.create({
  b: { maxWidth: '78%', padding: 12, borderRadius: 16, marginBottom: 10 },
  me: { backgroundColor: colors.maroon, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  them: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msg: { fontSize: 14.5, color: colors.text, lineHeight: 20 },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 44, maxHeight: 110, backgroundColor: colors.cream, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
