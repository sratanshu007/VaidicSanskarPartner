import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
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
  onCallEnded,
}) {
  const activeAppId = getLiveAgoraAppId(appId);
  const backendBase = (process.env.EXPO_PUBLIC_SOCKET_URL || 'https://vaidic-sanskar-admin-suite.onrender.com')
    .replace(/\/api\/partner\/?$/, '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
  const webViewRef = useRef(null);
  const [callStatus, setCallStatus] = useState('connecting');
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);

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
        if (onCallConnected) onCallConnected(data);
      } else if (data.type === 'REMOTE_JOINED') {
        setRemoteUserJoined(true);
      } else if (data.type === 'REMOTE_LEFT') {
        setRemoteUserJoined(false);
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
          body {
            background-color: #12091A;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            color: #fff;
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
            background: #1f0d2c;
          }
          #remote-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          #local-container {
            position: absolute;
            top: 60px;
            right: 12px;
            width: 92px;
            height: 130px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid rgba(230, 126, 0, 0.85);
            box-shadow: 0 6px 20px rgba(0,0,0,0.6);
            background: #2a1538;
            z-index: 99;
          }
          #local-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scaleX(-1);
          }
          .remote-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
          }
          .pulsing-disc {
            width: 110px;
            height: 110px;
            border-radius: 50%;
            background: linear-gradient(135deg, #E67E00, #8B1A1A);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 30px rgba(230, 126, 0, 0.4);
            animation: pulse 2s infinite ease-in-out;
            margin-bottom: 16px;
          }
          @keyframes pulse {
            0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(230, 126, 0, 0.5); }
            70% { transform: scale(1.04); box-shadow: 0 0 0 20px rgba(230, 126, 0, 0); }
            100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(230, 126, 0, 0); }
          }
          .status-badge {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 6px 14px;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 10px;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #1C9A5E;
          }
        </style>
      </head>
      <body>
        <div id="remote-container">
          <div id="remote-video"></div>
          <div id="placeholder" class="remote-placeholder">
            <div class="pulsing-disc">
              <span style="font-size: 42px;">👤</span>
            </div>
            <h3 style="font-size: 19px; font-weight: 700;">${remoteName}</h3>
            <p style="font-size: 13px; color: #D4AF37; margin-top: 4px;">
              ${mode === 'video' ? 'यजमान लाइव वीडियो • Agora RTC' : 'यजमान लाइव ऑडियो • Agora Voice HD'}
            </p>
            <div class="status-badge">
              <span class="dot"></span>
              <span>Channel: ${channelName}</span>
            </div>
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

          const APP_ID = "${activeAppId}";
          const CHANNEL = "${channelName}";
          const MODE = "${mode}";
          let TOKEN = ${token ? JSON.stringify(token) : 'null'};
          const BACKEND_BASE = "${backendBase}";

          let rtcClient = null;
          let localAudioTrack = null;
          let localVideoTrack = null;

          async function startCall() {
            try {
              if (typeof AgoraRTC === 'undefined') {
                postToRN({ type: 'CALL_CONNECTED', fallback: true });
                return;
              }

              rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

              rtcClient.on('user-published', async (user, mediaType) => {
                await rtcClient.subscribe(user, mediaType);
                if (mediaType === 'video') {
                  const placeholder = document.getElementById('placeholder');
                  if (placeholder) placeholder.style.display = 'none';
                  user.videoTrack.play('remote-video');
                  postToRN({ type: 'REMOTE_JOINED', uid: user.uid });
                }
                if (mediaType === 'audio') {
                  user.audioTrack.play();
                }
              });

              rtcClient.on('user-unpublished', (user, mediaType) => {
                if (mediaType === 'video') {
                  const placeholder = document.getElementById('placeholder');
                  if (placeholder) placeholder.style.display = 'flex';
                  postToRN({ type: 'REMOTE_LEFT', uid: user.uid });
                }
              });

              // Dynamic numeric UID for partner
              const uid = Math.floor(Math.random() * 899999) + 100000;

              // If token not provided upfront, auto-fetch from backend API /api/agora/token
              if (!TOKEN && BACKEND_BASE) {
                try {
                  const res = await fetch(BACKEND_BASE + '/api/agora/token?channelName=' + encodeURIComponent(CHANNEL) + '&uid=' + uid);
                  const data = await res.json();
                  if (data && data.token) {
                    TOKEN = data.token;
                    console.log('✅ Partner joined Agora with dynamic backend token');
                  }
                } catch (tokenErr) {
                  console.warn('Backend Agora Token Auto-fetch notice:', tokenErr.message);
                }
              }

              // Join Channel with dynamic UID and token
              await rtcClient.join(APP_ID, CHANNEL, TOKEN || null, uid);

              try {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                if (MODE === 'video') {
                  localVideoTrack = await AgoraRTC.createCameraVideoTrack({ facingMode: 'user' });
                  localVideoTrack.play('local-video');
                  await rtcClient.publish([localAudioTrack, localVideoTrack]);
                } else {
                  await rtcClient.publish([localAudioTrack]);
                }
              } catch (mediaErr) {
                console.warn('Media warning:', mediaErr);
              }

              postToRN({ type: 'CALL_CONNECTED', uid, channel: CHANNEL });
            } catch (err) {
              console.error('Agora Error:', err);
              postToRN({ type: 'CALL_CONNECTED', fallback: true });
            }
          }

          const handleControlsUpdate = async (msg) => {
            if (!msg) return;
            if (localAudioTrack && typeof msg.isMuted === 'boolean') {
              localAudioTrack.setEnabled(!msg.isMuted);
            }
            if (localVideoTrack && typeof msg.isVideoCamOff === 'boolean') {
              localVideoTrack.setEnabled(!msg.isVideoCamOff);
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

  return (
    <View style={s.container}>
      <WebView
        ref={webViewRef}
        source={{ html: agoraHtml }}
        style={s.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
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

      <View style={s.statusOverlay}>
        <View style={s.statusPill}>
          <View style={[s.statusDot, { backgroundColor: callStatus === 'connected' ? '#1C9A5E' : '#E67E00' }]} />
          <Text style={s.statusPillText}>
            {callStatus === 'connected' ? 'Agora RTC Consultation Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12091A',
    position: 'relative',
  },
  webview: {
    flex: 1,
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
  statusOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 50,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
