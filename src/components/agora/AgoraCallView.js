import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import colors from '../../theme/colors';
import { BASE_URL } from '../../services/api';

/**
 * Dynamically resolves live Agora App ID:
 * 1. Runtime prop passed directly to AgoraCallView
 * 2. EXPO_PUBLIC_AGORA_APP_ID from active .env file
 * 3. AGORA_APP_ID from process.env
 * 4. Constants.expoConfig?.extra?.agoraAppId (from app.json / EAS Build)
 * 5. Production fallback App ID
 */
export const getLiveAgoraAppId = (overrideId) => {
  if (overrideId && typeof overrideId === 'string' && overrideId.trim().length > 0) {
    return overrideId.trim();
  }
  return (
    process.env.EXPO_PUBLIC_AGORA_APP_ID ||
    process.env.AGORA_APP_ID ||
    Constants?.expoConfig?.extra?.agoraAppId ||
    Constants?.manifest?.extra?.agoraAppId ||
    'c24160ab909f4ab089971d527d05a89b'
  ).trim();
};

export const DEFAULT_AGORA_APP_ID = getLiveAgoraAppId();

export default function AgoraCallView({
  channelName = 'vartalap_room_demo',
  mode = 'video', // 'audio' | 'video'
  appId,
  token = null,
  isMuted = false,
  isSpeaker = true,
  isVideoCamOff = false,
  isFrontCam = true,
  remoteName = 'Devotee / Customer',
  role = 'vendor',
  onCallConnected,
  onStatusChange,
  onCallEnded,
}) {
  const activeAppId = getLiveAgoraAppId(appId);
  const backendBase = (process.env.EXPO_PUBLIC_SOCKET_URL || BASE_URL || 'https://vaidic-sanskar-admin-suite.onrender.com')
    .replace(/\/api\/partner\/?$/, '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
  const secureBaseUrl = backendBase.startsWith('https://')
    ? `${backendBase}/`
    : 'https://vaidic-sanskar-admin-suite.onrender.com/';
  const webViewRef = useRef(null);
  const initialTokenRef = useRef(token);
  const [hasPermission, setHasPermission] = useState(Platform.OS !== 'android');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);

  const requestMediaPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(true);
      setPermissionDenied(false);
      return;
    }
    try {
      const reqList = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (mode === 'video') {
        reqList.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }
      const results = await PermissionsAndroid.requestMultiple(reqList);
      const micGranted = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      const camGranted =
        mode !== 'video' || results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(micGranted && camGranted);
      setPermissionDenied(!(micGranted && camGranted));
    } catch (err) {
      setHasPermission(true);
    }
  }, [mode]);

  useEffect(() => {
    requestMediaPermissions();
    return () => {
      try {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'LEAVE_CALL' }));
      } catch (e) {}
    };
  }, [requestMediaPermissions]);

  // Send control updates to Agora WebRTC engine
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'UPDATE_CONTROLS',
          isMuted,
          isVideoCamOff: mode === 'audio' ? true : isVideoCamOff,
          isFrontCam,
          isSpeaker,
        })
      );
    }
  }, [isMuted, isVideoCamOff, isFrontCam, isSpeaker, mode]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CALL_CONNECTED') {
        setCallStatus('connected');
        onStatusChange?.({ stage: 'connected' });
        if (onCallConnected) onCallConnected(data);
      } else if (data.type === 'MIC_ACTIVE') {
        onStatusChange?.({ micActive: true });
      } else if (data.type === 'MIC_ERROR') {
        onStatusChange?.({ micActive: false, error: data.message });
      } else if (data.type === 'REMOTE_JOINED' || data.type === 'REMOTE_AUDIO_ACTIVE') {
        setRemoteUserJoined(true);
        onStatusChange?.({ remoteJoined: true });
      } else if (data.type === 'REMOTE_LEFT') {
        setRemoteUserJoined(false);
        onStatusChange?.({ remoteJoined: false });
      } else if (data.type === 'CALL_ERROR') {
        setCallStatus('failed');
        onStatusChange?.({ stage: 'failed', error: data.message });
      } else if (data.type === 'CALL_ENDED') {
        if (onCallEnded) onCallEnded();
      }
    } catch (e) {}
  };

  const agoraHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Agora Partner Video</title>
        <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            background-color: #12091A;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #remote-container {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #14071f;
            overflow: hidden;
          }
          #remote-video {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #remote-video div, #remote-video video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          #local-container {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 100px;
            height: 142px;
            border-radius: 14px;
            overflow: hidden;
            border: 2px solid #D48B28;
            box-shadow: 0 8px 24px rgba(0,0,0,0.65);
            background: #2a1538;
            z-index: 99;
          }
          #local-video {
            width: 100%;
            height: 100%;
          }
          #local-video div, #local-video video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            transform: scaleX(-1);
          }
          .remote-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
            margin: auto;
            z-index: 10;
          }
          .pulsing-disc {
            width: 110px;
            height: 110px;
            border-radius: 50%;
            background: linear-gradient(135deg, #D48B28, #67101F);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 35px rgba(212, 139, 40, 0.45);
            animation: pulse 2.2s infinite ease-in-out;
            margin-bottom: 14px;
            border: 2px solid rgba(247, 201, 102, 0.6);
          }
          @keyframes pulse {
            0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(212, 139, 40, 0.6); }
            70% { transform: scale(1.04); box-shadow: 0 0 0 24px rgba(212, 139, 40, 0); }
            100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(212, 139, 40, 0); }
          }
          .sound-wave {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            height: 28px;
            margin-top: 12px;
          }
          .sound-wave .bar {
            width: 4px;
            border-radius: 3px;
            background: #F7C966;
            animation: bounce 1.2s infinite ease-in-out;
          }
          .sound-wave .b1 { height: 10px; animation-delay: 0.1s; }
          .sound-wave .b2 { height: 22px; animation-delay: 0.25s; }
          .sound-wave .b3 { height: 28px; animation-delay: 0.4s; }
          .sound-wave .b4 { height: 18px; animation-delay: 0.15s; }
          .sound-wave .b5 { height: 12px; animation-delay: 0.3s; }
          @keyframes bounce {
            0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
            50% { transform: scaleY(1); opacity: 1; }
          }
          .status-badge {
            background: rgba(0, 0, 0, 0.65);
            border: 1px solid rgba(247, 201, 102, 0.35);
            border-radius: 20px;
            padding: 6px 14px;
            font-size: 11.5px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4ADE80;
            box-shadow: 0 0 8px #4ADE80;
          }
        </style>
      </head>
      <body>
        <div id="remote-container">
          <div id="remote-video"></div>
          <div id="placeholder" class="remote-placeholder">
            <div class="pulsing-disc">
              <span style="font-size: 46px;">🕉️</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; letter-spacing: 0.3px;">${remoteName}</h3>
            <p style="font-size: 13px; color: #F7C966; margin-top: 4px; font-weight: 600;">
              ${mode === 'video' ? 'यजमान लाइव वीडियो • Agora RTC HD' : 'यजमान लाइव ऑडियो • Agora Voice HD'}
            </p>
            ${mode === 'audio' ? `
              <div class="sound-wave">
                <span class="bar b1"></span>
                <span class="bar b2"></span>
                <span class="bar b3"></span>
                <span class="bar b4"></span>
                <span class="bar b5"></span>
              </div>
            ` : ''}
            <div class="status-badge">
              <span class="dot"></span>
              <span id="call-label">चैनल से जुड़ रहे हैं... (${channelName})</span>
            </div>
            <button id="autoplay-banner" onclick="resumeRemoteAudio()" style="display:none;margin-top:14px;background:#D48B28;color:#12091A;border:none;border-radius:18px;padding:10px 18px;font-weight:800;font-size:13px;cursor:pointer;">
              🔊 आवाज़ सुनने के लिए टैप करें (Tap to Unmute)
            </button>
          </div>
        </div>

        ${mode === 'video' ? `
          <div id="local-container">
            <div id="local-video"></div>
          </div>
        ` : ''}

        <script>
          const postToRN = (data) => {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
          };

          const setCallLabel = (text) => {
            const el = document.getElementById('call-label');
            if (el) el.textContent = text;
          };

          const APP_ID = ${JSON.stringify(activeAppId)};
          const CHANNEL = ${JSON.stringify(channelName)};
          const MODE = ${JSON.stringify(mode)};
          let TOKEN = ${initialTokenRef.current ? JSON.stringify(initialTokenRef.current) : 'null'};
          const BACKEND_BASE = ${JSON.stringify(backendBase)};

          let rtcClient = null;
          let localAudioTrack = null;
          let localVideoTrack = null;
          let remoteAudioTracks = [];
          let speakerEnabled = true;

          function resumeRemoteAudio() {
            const btn = document.getElementById('autoplay-banner');
            if (btn) btn.style.display = 'none';
            remoteAudioTracks.forEach((track) => {
              try {
                track.play();
                track.setVolume(speakerEnabled ? 100 : 70);
              } catch (e) {}
            });
          }

          async function subscribeAndPlay(user, mediaType) {
            await rtcClient.subscribe(user, mediaType);
            if (mediaType === 'video' && user.videoTrack) {
              const placeholder = document.getElementById('placeholder');
              if (placeholder) placeholder.style.display = 'none';
              user.videoTrack.play('remote-video');
              postToRN({ type: 'REMOTE_JOINED', uid: user.uid });
            }
            if (mediaType === 'audio' && user.audioTrack) {
              remoteAudioTracks = remoteAudioTracks.filter((t) => t !== user.audioTrack);
              remoteAudioTracks.push(user.audioTrack);
              try {
                user.audioTrack.play();
                user.audioTrack.setVolume(speakerEnabled ? 100 : 70);
              } catch (playErr) {
                const btn = document.getElementById('autoplay-banner');
                if (btn) btn.style.display = 'inline-block';
              }
              setCallLabel('🟢 लाइव वॉइस सक्रिय • यजमान जुड़े');
              postToRN({ type: 'REMOTE_AUDIO_ACTIVE', uid: user.uid });
              postToRN({ type: 'REMOTE_JOINED', uid: user.uid });
            }
          }

          async function startCall() {
            try {
              if (typeof AgoraRTC === 'undefined') {
                setCallLabel('⚠️ Agora SDK लोड नहीं हो सका');
                postToRN({ type: 'CALL_ERROR', message: 'AgoraRTC SDK unavailable' });
                return;
              }

              AgoraRTC.onAudioAutoplayFailed = () => {
                const btn = document.getElementById('autoplay-banner');
                if (btn) btn.style.display = 'inline-block';
              };

              rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

              rtcClient.on('user-published', async (user, mediaType) => {
                try {
                  await subscribeAndPlay(user, mediaType);
                } catch (subErr) {
                  console.warn('Subscribe error:', subErr);
                }
              });

              rtcClient.on('user-unpublished', (user, mediaType) => {
                if (mediaType === 'video') {
                  const placeholder = document.getElementById('placeholder');
                  if (placeholder) placeholder.style.display = 'flex';
                  postToRN({ type: 'REMOTE_LEFT', uid: user.uid });
                }
              });

              rtcClient.on('user-left', (user) => {
                const placeholder = document.getElementById('placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                setCallLabel('यजमान ने कॉल समाप्त की');
                postToRN({ type: 'REMOTE_LEFT', uid: user.uid });
              });

              // Dynamic numeric UID for partner
              let uid = Math.floor(Math.random() * 899999) + 100000;
              let joinToken = TOKEN || null;

              // Always prefer a UID-matched RTC token from backend
              if (BACKEND_BASE) {
                try {
                  const res = await fetch(BACKEND_BASE + '/api/agora/token?channelName=' + encodeURIComponent(CHANNEL) + '&uid=' + uid);
                  const data = await res.json();
                  if (data && data.mode === 'testing') {
                    joinToken = null;
                  } else if (data && data.token) {
                    joinToken = data.token;
                  }
                } catch (tokenErr) {
                  console.warn('Backend Agora Token Auto-fetch notice:', tokenErr.message);
                }
              }

              try {
                await rtcClient.join(APP_ID, CHANNEL, joinToken, uid);
              } catch (joinErr) {
                if (TOKEN) {
                  uid = await rtcClient.join(APP_ID, CHANNEL, TOKEN, 0);
                } else {
                  throw joinErr;
                }
              }

              setCallLabel('🎙️ चैनल जुड़ा • माइक शुरू हो रहा है...');

              // Subscribe to any remote users already publishing
              if (rtcClient.remoteUsers && rtcClient.remoteUsers.length > 0) {
                for (const rUser of rtcClient.remoteUsers) {
                  if (rUser.hasAudio) await subscribeAndPlay(rUser, 'audio');
                  if (rUser.hasVideo && MODE === 'video') await subscribeAndPlay(rUser, 'video');
                }
              }

              // Create local tracks with crystal clear HD audio and video
              try {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                  AEC: true,
                  ANS: true,
                  AGC: true,
                  encoderConfig: 'high_quality_stereo',
                });
                if (MODE === 'video') {
                  localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                    facingMode: 'user',
                    encoderConfig: {
                      width: { max: 1280, ideal: 1280 },
                      height: { max: 720, ideal: 720 },
                      frameRate: { ideal: 30, max: 30 },
                      bitrateMax: 1500,
                    },
                    optimizationMode: 'detail',
                  });
                  localVideoTrack.play('local-video', { fit: 'cover', mirror: true });
                  await rtcClient.publish([localAudioTrack, localVideoTrack]);
                } else {
                  await rtcClient.publish([localAudioTrack]);
                }
                setCallLabel('🎙️ माइक सक्रिय • लाइव वॉइस तैयार');
                postToRN({ type: 'MIC_ACTIVE', uid });
              } catch (mediaErr) {
                console.warn('Local media capture warning:', mediaErr);
                setCallLabel('⚠️ माइक अनुमति आवश्यक');
                postToRN({ type: 'MIC_ERROR', message: mediaErr && mediaErr.message ? mediaErr.message : 'Mic blocked' });
              }

              postToRN({ type: 'CALL_CONNECTED', uid, channel: CHANNEL });
            } catch (err) {
              console.error('Agora Error:', err);
              setCallLabel('⚠️ कनेक्शन त्रुटि: ' + (err && err.message ? err.message : 'Retry'));
              postToRN({ type: 'CALL_ERROR', channel: CHANNEL, message: err && err.message ? err.message : 'Agora join error' });
            }
          }

          async function cleanupCall() {
            try {
              if (localAudioTrack) { localAudioTrack.stop(); localAudioTrack.close(); localAudioTrack = null; }
              if (localVideoTrack) { localVideoTrack.stop(); localVideoTrack.close(); localVideoTrack = null; }
              if (rtcClient) { await rtcClient.leave(); rtcClient = null; }
            } catch (e) {}
          }

          const handleControlsUpdate = async (msg) => {
            if (!msg) return;
            if (msg.type === 'LEAVE_CALL') {
              await cleanupCall();
              return;
            }
            if (localAudioTrack && typeof msg.isMuted === 'boolean') {
              localAudioTrack.setEnabled(!msg.isMuted);
            }
            if (typeof msg.isSpeaker === 'boolean') {
              speakerEnabled = msg.isSpeaker;
              remoteAudioTracks.forEach((t) => {
                try { t.setVolume(speakerEnabled ? 100 : 70); } catch (e) {}
              });
            }
            if (localVideoTrack && typeof msg.isVideoCamOff === 'boolean') {
              localVideoTrack.setEnabled(!msg.isVideoCamOff);
              const localBox = document.getElementById('local-container');
              if (localBox) localBox.style.display = msg.isVideoCamOff ? 'none' : 'block';
            }
            if (localVideoTrack && typeof msg.isFrontCam === 'boolean') {
              try {
                const cams = await AgoraRTC.getCameras();
                if (cams && cams.length > 1) {
                  const targetCam = msg.isFrontCam ? cams[0] : cams[cams.length - 1];
                  await localVideoTrack.setDevice(targetCam.deviceId);
                }
              } catch (e) {}
            }
          };

          window.addEventListener('message', (e) => {
            try {
              handleControlsUpdate(JSON.parse(e.data));
            } catch (err) {}
          });

          document.addEventListener('message', (e) => {
            try {
              handleControlsUpdate(JSON.parse(e.data));
            } catch (err) {}
          });

          startCall();
        </script>
      </body>
    </html>
  `;

  const webViewSource = useMemo(
    () => ({
      html: agoraHtml,
      baseUrl: secureBaseUrl,
    }),
    [activeAppId, channelName, mode, remoteName, backendBase, secureBaseUrl]
  );

  if (!hasPermission) {
    return (
      <View style={s.loader}>
        <MaterialCommunityIcons
          name={permissionDenied ? 'microphone-off' : 'microphone'}
          size={44}
          color="#F7C966"
        />
        <Text style={[s.loaderText, { textAlign: 'center', paddingHorizontal: 24 }]}>
          {permissionDenied
            ? 'लाइव वॉइस/वीडियो कॉल के लिए कृपया माइक्रोफोन व कैमरा की अनुमति दें।'
            : 'माइक और ऑडियो अनुमति प्राप्त की जा रही है...'}
        </Text>
        {permissionDenied && (
          <TouchableOpacity
            onPress={requestMediaPermissions}
            style={{
              marginTop: 14,
              backgroundColor: '#D48B28',
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#12091A', fontWeight: '800', fontSize: 13 }}>
              अनुमति दें (Grant Mic Permission)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <WebView
        ref={webViewRef}
        source={webViewSource}
        style={s.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        allowsProtectedMedia={true}
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        mixedContentMode="compatibility"
        androidHardwareAccelerationDisabled={false}
        originWhitelist={['*']}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={colors.accent || '#E67E00'} />
            <Text style={s.loaderText}>Connecting to Agora Consultation Room...</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#12091A',
    position: 'relative',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#12091A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loaderText: {
    color: '#FBF7F0',
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
  },
});
