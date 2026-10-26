import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import partnerAstroStore from '../../services/talkToAstroStore';
import AgoraCallView from '../../components/agora/AgoraCallView';
import socket from '../../services/socket';

export default function AstroSessionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState(partnerAstroStore.getActiveSession());
  const [activeTab, setActiveTab] = useState('session'); // session | kundali | notes
  const [elapsed, setElapsed] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoCamOff, setIsVideoCamOff] = useState(false);
  const [isFrontCam, setIsFrontCam] = useState(true);

  const timerRef = useRef();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const unsub = partnerAstroStore.subscribe((store) => {
      const s = store.getActiveSession();
      setSession(s ? { ...s } : null);
      if (s?.privateNotes) setNotesInput(s.privateNotes);
    });

    const handleRemoteEnd = () => {
      clearInterval(timerRef.current);
      partnerAstroStore.endSession();
      Alert.alert('सत्र संपन्न', 'यजमान द्वारा परामर्श समाप्त किया गया।');
      navigation.goBack();
    };

    const handleChatMessage = (payload) => {
      if (payload && payload.text && payload.sender !== 'astrologer') {
        partnerAstroStore.receiveClientMessage(payload.text);
      }
    };

    socket.on('astro:call:ended', handleRemoteEnd);
    socket.on('astro:chat:message', handleChatMessage);

    return () => {
      unsub();
      socket.off('astro:call:ended', handleRemoteEnd);
      socket.off('astro:chat:message', handleChatMessage);
    };
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const billedMins = Math.max(1, Math.ceil(elapsed / 60));
  const netEarningsAccrued = billedMins * (session?.netRatePerMinute || 5);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    partnerAstroStore.sendMessage(msg);
    socket.emit('astro:chat:send', {
      text: msg,
      sender: 'astrologer',
      senderName: 'ज्योतिषाचार्य (Astrologer)',
      recipientId: session?.userId || 'U101',
      sessionId: session?.id,
    });
    setChatInput('');
  };

  const handleSaveNotes = () => {
    partnerAstroStore.savePrivateNotes(notesInput);
    Alert.alert('नोट्स सहेजे गए', 'यजमान के लिए आपके निजी नोट्स सुरक्षित कर दिए गए हैं।');
  };

  const handleEndSession = () => {
    Alert.alert(
      'परामर्श समाप्त करें?',
      `क्या आप यह सत्र समाप्त करना चाहते हैं?\nकुल समय: ${billedMins} मिनट\nशुद्ध मानदेय: ₹${netEarningsAccrued} आपके वॉलेट में जुड़ेगा।`,
      [
        { text: 'रद्द', style: 'cancel' },
        {
          text: 'हाँ, समाप्त करें',
          style: 'destructive',
          onPress: () => {
            clearInterval(timerRef.current);
            socket.emit('astro:call:end', {
              channelName: session?.channelName || `vartalap_room_${session?.id || 'session'}`,
              callerId: session?.userId || 'U101',
              recipientId: 'V4569',
            });
            partnerAstroStore.endSession();
            Alert.alert('सत्र संपन्न', `₹${netEarningsAccrued} मानदेय आपके वॉलेट में क्रेडिट हो गया है।`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!session) {
    return (
      <View style={[s.centerContainer, { paddingTop: insets.top }]}>
        <Text style={s.noSessionText}>सक्रिय परामर्श समाप्त हो चुका है</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>डैशबोर्ड पर लौटें</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kundali = session.birthDetails.kundali;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.container, { paddingTop: insets.top }]}
    >
      {/* Top Header Bar */}
      <View style={s.navHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.clientName}>{session.userName}</Text>
            <View style={s.modeBadge}>
              <Text style={s.modeBadgeText}>{session.mode.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={s.sessionTopic}>{session.topic}</Text>
        </View>

        {/* Live Elapsed Timer & Net Accrued Earnings */}
        <View style={s.timerCol}>
          <View style={s.timerPill}>
            <MaterialCommunityIcons name="timer-sand" size={13} color={colors.primary} />
            <Text style={s.timerText}>{formatTimer(elapsed)}</Text>
          </View>
          <Text style={s.earningsText}>कमाई: ₹{netEarningsAccrued}</Text>
        </View>

        <TouchableOpacity style={s.hangUpBtn} onPress={handleEndSession}>
          <MaterialCommunityIcons name="phone-hangup" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 3 Section Segment Tabs */}
      <View style={s.tabsRow}>
        <TouchableOpacity
          style={[s.tabItem, activeTab === 'session' && s.activeTabItem]}
          onPress={() => setActiveTab('session')}
        >
          <MaterialCommunityIcons
            name="chat-processing-outline"
            size={16}
            color={activeTab === 'session' ? colors.primary : colors.textMuted}
          />
          <Text style={[s.tabLabel, activeTab === 'session' && s.activeTabLabel]}>
            परामर्श ({session.mode})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabItem, activeTab === 'kundali' && s.activeTabItem]}
          onPress={() => setActiveTab('kundali')}
        >
          <MaterialCommunityIcons
            name="om"
            size={16}
            color={activeTab === 'kundali' ? colors.primary : colors.textMuted}
          />
          <Text style={[s.tabLabel, activeTab === 'kundali' && s.activeTabLabel]}>
            ऑटो-कुंडली पैनल
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabItem, activeTab === 'notes' && s.activeTabItem]}
          onPress={() => setActiveTab('notes')}
        >
          <MaterialCommunityIcons
            name="notebook-outline"
            size={16}
            color={activeTab === 'notes' ? colors.primary : colors.textMuted}
          />
          <Text style={[s.tabLabel, activeTab === 'notes' && s.activeTabLabel]}>
            निजी नोट्स
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Views */}
      <View style={{ flex: 1 }}>
        {/* Tab 1: Live Chat / Call View */}
        {activeTab === 'session' && (
          <View style={{ flex: 1 }}>
            {session.mode === 'chat' ? (
              <ScrollView contentContainerStyle={s.chatList} showsVerticalScrollIndicator={false}>
                {session.chatMessages.map((m) => {
                  const isAstro = m.sender === 'astrologer';
                  return (
                    <View
                      key={m.id}
                      style={[s.msgRow, isAstro ? s.astroRow : s.clientRow]}
                    >
                      <View style={[s.msgBubble, isAstro ? s.astroBubble : s.clientBubble]}>
                        <Text style={[s.msgText, isAstro && s.astroMsgText]}>{m.text}</Text>
                        <Text style={[s.msgTime, isAstro && s.astroMsgTime]}>{m.time}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={s.callStage}>
                <AgoraCallView
                  channelName={session.channelName || `vartalap_room_${session.id || 'astro'}`}
                  mode={session.mode === 'video' ? 'video' : 'audio'}
                  isMuted={isMuted}
                  isSpeaker={isSpeaker}
                  isVideoCamOff={isVideoCamOff}
                  isFrontCam={isFrontCam}
                  remoteName={session.userName}
                  role="vendor"
                  onCallEnded={handleEndSession}
                />

                {/* Floating In-App Agora Call Controls */}
                <View style={[s.callControlsOverlay, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
                  <TouchableOpacity
                    style={[s.callCtrlBtn, isMuted && s.callCtrlBtnActive]}
                    onPress={() => setIsMuted(!isMuted)}
                  >
                    <MaterialCommunityIcons
                      name={isMuted ? 'microphone-off' : 'microphone'}
                      size={22}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.callCtrlBtn, isSpeaker && s.callCtrlBtnActive]}
                    onPress={() => setIsSpeaker(!isSpeaker)}
                  >
                    <MaterialCommunityIcons
                      name={isSpeaker ? 'volume-high' : 'volume-medium'}
                      size={22}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  {session.mode === 'video' && (
                    <>
                      <TouchableOpacity
                        style={[s.callCtrlBtn, isVideoCamOff && s.callCtrlBtnActive]}
                        onPress={() => setIsVideoCamOff(!isVideoCamOff)}
                      >
                        <MaterialCommunityIcons
                          name={isVideoCamOff ? 'video-off' : 'video'}
                          size={22}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.callCtrlBtn}
                        onPress={() => setIsFrontCam(!isFrontCam)}
                      >
                        <MaterialCommunityIcons name="camera-flip" size={22} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Chat Input Bar if chat mode */}
            {session.mode === 'chat' && (
              <View style={[s.chatInputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <TextInput
                  style={s.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="यजमान को उत्तर लिखें..."
                  placeholderTextColor="#A8988C"
                />
                <TouchableOpacity style={s.sendBtn} onPress={handleSendMessage}>
                  <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Auto-Kundali Panel */}
        {activeTab === 'kundali' && (
          <ScrollView contentContainerStyle={s.kundaliScroll} showsVerticalScrollIndicator={false}>
            <View style={s.kundaliCard}>
              <View style={s.kundaliCardHeader}>
                <MaterialCommunityIcons name="om" size={20} color={colors.primary} />
                <Text style={s.kundaliCardTitle}>यजमान जन्म विवरण (Birth Profile)</Text>
              </View>

              <View style={s.kundaliGridRow}>
                <View style={s.kundaliGridCol}>
                  <Text style={s.kundaliGridKey}>जन्म तिथि:</Text>
                  <Text style={s.kundaliGridVal}>{session.birthDetails.dob}</Text>
                </View>
                <View style={s.kundaliGridCol}>
                  <Text style={s.kundaliGridKey}>जन्म समय:</Text>
                  <Text style={s.kundaliGridVal}>{session.birthDetails.tob}</Text>
                </View>
              </View>

              <View style={s.kundaliGridRow}>
                <View style={s.kundaliGridCol}>
                  <Text style={s.kundaliGridKey}>जन्म स्थान:</Text>
                  <Text style={s.kundaliGridVal}>{session.birthDetails.pob}</Text>
                </View>
                <View style={s.kundaliGridCol}>
                  <Text style={s.kundaliGridKey}>लिंग:</Text>
                  <Text style={s.kundaliGridVal}>{session.birthDetails.gender}</Text>
                </View>
              </View>

              <View style={s.divider} />

              <Text style={s.kundaliSubHeader}>ग्रह गणना व मुख्य योग:</Text>
              <View style={s.astroPillRow}>
                <View style={s.astroPill}>
                  <Text style={s.astroPillLabel}>लग्न</Text>
                  <Text style={s.astroPillVal}>{kundali.lagna}</Text>
                </View>
                <View style={s.astroPill}>
                  <Text style={s.astroPillLabel}>राशि</Text>
                  <Text style={s.astroPillVal}>{kundali.rashi}</Text>
                </View>
                <View style={s.astroPill}>
                  <Text style={s.astroPillLabel}>नक्षत्र</Text>
                  <Text style={s.astroPillVal}>{kundali.nakshatra}</Text>
                </View>
              </View>

              <View style={s.dashaBox}>
                <Text style={s.dashaTitle}>वर्तमान विंशोत्तरी दशा:</Text>
                <Text style={s.dashaVal}>{kundali.dasha}</Text>
              </View>

              <View style={s.dashaBox}>
                <Text style={s.dashaTitle}>अनुकूल ग्रह:</Text>
                <Text style={s.dashaVal}>{kundali.favorablePlanets}</Text>
              </View>

              <View style={[s.dashaBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Text style={[s.dashaTitle, { color: colors.success }]}>सुझाए जाने वाले उपाय (Remedies):</Text>
                <Text style={s.dashaVal}>{kundali.remedyRecommended}</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Tab 3: Private Notes */}
        {activeTab === 'notes' && (
          <ScrollView contentContainerStyle={s.notesScroll} showsVerticalScrollIndicator={false}>
            <View style={s.notesCard}>
              <Text style={s.notesTitle}>यजमान हेतु निजी टिप्पणियाँ (Private Notes)</Text>
              <Text style={s.notesSub}>
                यह नोट्स केवल आपके लिए हैं। अगली बार जब यह यजमान परामर्श लेंगे, तब आपको यह नोट्स दिखाई देंगे।
              </Text>

              <TextInput
                style={s.notesTextArea}
                value={notesInput}
                onChangeText={setNotesInput}
                multiline
                placeholder="यजमान की कुंडली के मुख्य बिंदु, बताए गए उपाय या भविष्यफल यहाँ लिखें..."
                placeholderTextColor="#A8988C"
              />

              <TouchableOpacity style={s.saveNotesBtn} onPress={handleSaveNotes}>
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFFFFF" />
                <Text style={s.saveNotesBtnText}>नोट्स सहेजें</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noSessionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  backBtn: {
    backgroundColor: colors.saffron,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  modeBadge: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  modeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sessionTopic: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  timerCol: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  earningsText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    marginTop: 2,
  },
  hangUpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
  chatList: {
    padding: 14,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  astroRow: {
    justifyContent: 'flex-end',
  },
  clientRow: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '78%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  astroBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  clientBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow(1),
  },
  msgText: {
    fontSize: 13,
    color: colors.text,
  },
  astroMsgText: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  astroMsgTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  callStage: {
    flex: 1,
    backgroundColor: '#0A0612',
    position: 'relative',
    overflow: 'hidden',
  },
  callControlsOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 99,
  },
  callCtrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    ...shadow(3),
  },
  callCtrlBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.saffron,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FAF7F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    marginRight: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kundaliScroll: {
    padding: 16,
  },
  kundaliCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow(2),
  },
  kundaliCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  kundaliCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
  },
  kundaliGridRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  kundaliGridCol: {
    flex: 1,
  },
  kundaliGridKey: {
    fontSize: 11,
    color: colors.textMuted,
  },
  kundaliGridVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  kundaliSubHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  astroPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  astroPill: {
    flex: 1,
    backgroundColor: '#FAF7F0',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  astroPillLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  astroPillVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  dashaBox: {
    backgroundColor: '#FFF8EB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3DFC4',
    marginBottom: 8,
  },
  dashaTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dashaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  notesScroll: {
    padding: 16,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow(2),
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
  },
  notesSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 15,
  },
  notesTextArea: {
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    height: 160,
    textAlignVertical: 'top',
  },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  saveNotesBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
