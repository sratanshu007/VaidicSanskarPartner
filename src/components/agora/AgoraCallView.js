import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  AppState,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import InCallManager from 'react-native-incall-manager';
import colors from '../../theme/colors';
import { BASE_URL } from '../../services/api';

const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

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
  channelName = 'vartalap_call',
  mode = 'video', // 'audio' | 'video'
  appId,
  token = null,
  uid,
  isMuted = false,
  isSpeaker = true,
  isVideoCamOff = false,
  isFrontCam = true,
  remoteName = 'Customer',
  remotePhoto = null,
  role = 'vendor',
  onCallConnected,
  onStatusChange,
  onCallEnded,
}) {
  const activeAppId = getLiveAgoraAppId(appId);
  const backendBase = (BASE_URL || 'https://vaidic-sanskar-admin-suite.onrender.com')
    .replace(/\/api\/partner\/?$/, '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
  const secureBaseUrl = backendBase.startsWith('https://')
    ? `${backendBase}/`
    : 'https://vaidic-sanskar-admin-suite.onrender.com/';

  const webViewRef = useRef(null);
  const setWebViewRef = useCallback((r) => {
    if (r) webViewRef.current = r;
  }, []);

  const resolvedUid = Number(uid) || (role === 'user' ? 10001 : 20001);

  const [hasPermission, setHasPermission] = useState(Platform.OS !== 'android');
  const [checkingPermission, setCheckingPermission] = useState(Platform.OS === 'android');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPermanentlyDenied, setIsPermanentlyDenied] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const checkMediaPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(true);
      setCheckingPermission(false);
      setPermissionDenied(false);
      return true;
    }
    try {
      const micGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const camGranted =
        mode !== 'video' || (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA));

      if (micGranted && camGranted) {
        setHasPermission(true);
        setCheckingPermission(false);
        setPermissionDenied(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Media permission check error in Partner App:', err);
      return false;
    }
  }, [mode]);

  const requestMediaPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(true);
      setCheckingPermission(false);
      return;
    }
    setCheckingPermission(true);
    try {
      const alreadyGranted = await checkMediaPermissions();
      if (alreadyGranted) {
        setHasPermission(true);
        setCheckingPermission(false);
        setPermissionDenied(false);
        return;
      }

      const reqList = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (mode === 'video') {
        reqList.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      const results = await PermissionsAndroid.requestMultiple(reqList);

      const micStatus = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      const camStatus =
        mode !== 'video'
          ? PermissionsAndroid.RESULTS.GRANTED
          : results[PermissionsAndroid.PERMISSIONS.CAMERA];

      const micOk = micStatus === PermissionsAndroid.RESULTS.GRANTED;
      const camOk = camStatus === PermissionsAndroid.RESULTS.GRANTED;

      if (micOk && camOk) {
        setHasPermission(true);
        setPermissionDenied(false);
        setIsPermanentlyDenied(false);
      } else if (micOk) {
        setHasPermission(true);
        setPermissionDenied(false);
        setIsPermanentlyDenied(false);
      } else {
        setHasPermission(false);
        setPermissionDenied(true);
        const permBlocked =
          micStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
          camStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
        setIsPermanentlyDenied(Boolean(permBlocked));
      }
    } catch (err) {
      console.warn('Media permission request error in Partner App:', err);
      setHasPermission(true);
      setPermissionDenied(false);
    } finally {
      setCheckingPermission(false);
    }
  }, [mode, checkMediaPermissions]);

  useEffect(() => {
    requestMediaPermissions();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkMediaPermissions().then((granted) => {
          if (granted) {
            setHasPermission(true);
            setPermissionDenied(false);
          }
        });
      }
    });

    return () => {
      sub.remove();
    };
  }, [requestMediaPermissions, checkMediaPermissions]);

  // Native audio routing (MODE_IN_COMMUNICATION + speaker/earpiece)
  useEffect(() => {
    if (!hasPermission) return undefined;
    try {
      InCallManager.start({ media: mode === 'video' ? 'video' : 'audio' });
    } catch (e) {
      console.warn('InCallManager start error', e);
    }
    return () => {
      try { InCallManager.stop(); } catch (e) { }
    };
  }, [hasPermission, mode]);

  useEffect(() => {
    if (!hasPermission) return;
    try { InCallManager.setForceSpeakerphoneOn(Boolean(isSpeaker)); } catch (e) { }
  }, [hasPermission, isSpeaker]);

  // Leave channel on unmount
  useEffect(() => {
    return () => {
      try {
        webViewRef.current?.injectJavaScript(
          'window.leaveAgoraCall && window.leaveAgoraCall(); true;'
        );
      } catch (e) { }
    };
  }, []);

  // Push token updates directly to WebView if token arrives after mount
  useEffect(() => {
    if (token && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_TOKEN',
          token,
          channelName,
        })
      );
    }
  }, [token, channelName]);

  // Send control commands to Agora WebView engine
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

  // Periodic audio unlock watchdog
  useEffect(() => {
    const id = setInterval(() => {
      try {
        webViewRef.current?.injectJavaScript('window.unlockAllAudio && window.unlockAllAudio(); true;');
      } catch (e) { }
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOG') {
        console.log(`[Agora WebView Partner] [${data.level}]`, data.msg);
      } else if (data.type === 'CALL_CONNECTED') {
        setCallStatus('connected');
        onStatusChange?.({ stage: 'connected' });
        webViewRef.current?.injectJavaScript('window.unlockAllAudio && window.unlockAllAudio(); true;');
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: 'UPDATE_CONTROLS',
            isMuted,
            isVideoCamOff: mode === 'audio' ? true : isVideoCamOff,
            isFrontCam,
            isSpeaker,
          })
        );
        if (onCallConnected) onCallConnected(data);
      } else if (data.type === 'MIC_ACTIVE') {
        setMicActive(true);
        onStatusChange?.({ micActive: true });
      } else if (data.type === 'MIC_ERROR') {
        setMicActive(false);
        onStatusChange?.({ micActive: false, error: data.message });
      } else if (data.type === 'REMOTE_JOINED' || data.type === 'REMOTE_AUDIO_ACTIVE') {
        setRemoteUserJoined(true);
        onStatusChange?.({ remoteJoined: true });
        webViewRef.current?.injectJavaScript('window.unlockAllAudio && window.unlockAllAudio(); true;');
      } else if (data.type === 'REMOTE_LEFT') {
        setRemoteUserJoined(false);
        onStatusChange?.({ remoteJoined: false });
      } else if (data.type === 'CALL_ERROR') {
        setCallStatus('failed');
        onStatusChange?.({ stage: 'failed', error: data.message });
      } else if (data.type === 'CALL_ENDED') {
        if (onCallEnded) onCallEnded();
      } else if (data.type === 'VOLUME_INDICATOR') {
        const lvl = data.level || 0;
        setAudioLevel((prev) => (Math.abs(prev - lvl) > 8 ? lvl : prev));
      }
    } catch (e) { }
  };

  const agoraHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Agora Partner In-App Call</title>
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
            z-index: 5;
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
            <h3 style="font-size: 20px; font-weight: 800; letter-spacing: 0.3px;">${escapeHtml(remoteName)}</h3>
            <p style="font-size: 13px; color: #F7C966; margin-top: 4px; font-weight: 600;">
              ${mode === 'video' ? 'लाइव वीडियो परामर्श • Agora RTC HD' : 'सुरक्षित लाइव ऑडियो कॉल • Agora Voice HD'}
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
              <span id="call-label">चैनल से जुड़ रहे हैं... (${escapeHtml(channelName)})</span>
            </div>
          </div>
        </div>

        ${mode === 'video' ? `
          <div id="local-container">
            <div id="local-video"></div>
          </div>
        ` : ''}

        <div id="audio-unblock-banner" style="display:none; position:fixed; bottom:20px; left:20px; right:20px; background:#D48B28; color:#12091A; padding:12px 16px; border-radius:14px; text-align:center; font-weight:800; font-size:13.5px; z-index:99999; box-shadow:0 6px 20px rgba(0,0,0,0.6); cursor:pointer;">
          🔊 आवाज चालू करने के लिए यहाँ टैप करें (Tap to enable voice)
        </div>

        <script>
          var postToRN = function(data) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
          };

          // Forward console logs to React Native Metro
          ['log', 'warn', 'error'].forEach(function(k) {
            var orig = console[k];
            console[k] = function() {
              var args = Array.prototype.slice.call(arguments);
              postToRN({
                type: 'LOG',
                level: k,
                msg: args.map(function(a) {
                  try {
                    return typeof a === 'object' ? JSON.stringify(a) : String(a);
                  } catch (e) {
                    return String(a);
                  }
                }).join(' '),
              });
              if (orig) orig.apply(console, arguments);
            };
          });

          var setCallLabel = function(text) {
            var el = document.getElementById('call-label');
            if (el) el.textContent = text;
          };

          var APP_ID = ${JSON.stringify(activeAppId)};
          var CHANNEL = ${JSON.stringify(channelName)};
          var MODE = ${JSON.stringify(mode)};
          var MY_UID = Number(${JSON.stringify(resolvedUid)});
          var TOKEN = ${token ? JSON.stringify(token) : 'null'};
          var BACKEND_BASE = ${JSON.stringify(backendBase)};

          var controls = {
            isMuted: ${JSON.stringify(Boolean(isMuted))},
            isVideoCamOff: ${JSON.stringify(mode === 'audio' ? true : Boolean(isVideoCamOff))},
            isFrontCam: ${JSON.stringify(Boolean(isFrontCam))},
            isSpeaker: ${JSON.stringify(Boolean(isSpeaker))}
          };

          var rtcClient = null;
          var localAudioTrack = null;
          var localVideoTrack = null;
          var remoteAudioTracks = [];
          var speakerEnabled = true;
          var isCallStarting = false;
          var isCallJoined = false;
          var isApplyingControls = false;

          function unlockAllAudio() {
            try {
              if (typeof AgoraRTC !== 'undefined' && AgoraRTC.getAudioContext) {
                var ctx = AgoraRTC.getAudioContext();
                if (ctx && ctx.state === 'suspended') {
                  ctx.resume().catch(function() {});
                }
              }
              remoteAudioTracks.forEach(function(track) {
                try {
                  if (!track.isPlaying) track.play();
                } catch (e) {}
              });
            } catch (e) {}
          }

  function updateSpeakerRouting(speakerOn) {
    speakerEnabled = Boolean(speakerOn);
    remoteAudioTracks.forEach(function(t) {
      try { t.setVolume(100); } catch (e) {}
    });
  }

  window.resumeAudioContext = unlockAllAudio;
  window.unlockAllAudio = unlockAllAudio;

  var dismissBanner = function() {
    unlockAllAudio();
    var b = document.getElementById('audio-unblock-banner');
    if (b) b.style.display = 'none';
  };
  window.addEventListener('click', dismissBanner);
  window.addEventListener('touchstart', dismissBanner, { passive: true });


  // Debounced control applicator that avoids Agora mutex deadlocks
  async function applyControls() {
    if (isApplyingControls) return;
    isApplyingControls = true;
    try {
      if (localAudioTrack && typeof localAudioTrack.enabled === 'boolean') {
        var targetAudioState = !controls.isMuted;
        if (localAudioTrack.enabled !== targetAudioState && !localAudioTrack._busy) {
          localAudioTrack._busy = true;
          try {
            await localAudioTrack.setEnabled(targetAudioState);
          } catch (e) {
            console.warn('[Agora] Mic setEnabled error in Partner App:', e);
          } finally {
            localAudioTrack._busy = false;
          }
        }
      }
      if (MODE === 'video' && localVideoTrack && typeof localVideoTrack.enabled === 'boolean') {
        var targetVideoState = !controls.isVideoCamOff;
        if (localVideoTrack.enabled !== targetVideoState && !localVideoTrack._busy) {
          localVideoTrack._busy = true;
          try {
            await localVideoTrack.setEnabled(targetVideoState);
            var localBox = document.getElementById('local-container');
            if (localBox) localBox.style.display = targetVideoState ? 'block' : 'none';
          } catch (e) {
            console.warn('[Agora] Camera setEnabled error in Partner App:', e);
          } finally {
            localVideoTrack._busy = false;
          }
        }
      }
      updateSpeakerRouting(controls.isSpeaker);
    } finally {
      isApplyingControls = false;
    }
  }

  async function subscribeAndPlay(user, mediaType) {
    try {
      if (MODE === 'audio' && mediaType === 'video') {
        console.log('[Agora] Audio call active in Partner App - ignoring remote video stream');
        return;
      }

      console.log('[Agora] Subscribing to user in Partner App:', user.uid, mediaType);
      await rtcClient.subscribe(user, mediaType);

      if (mediaType === 'video' && user.videoTrack) {
        var placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'none';
        user.videoTrack.play('remote-video', { fit: 'cover' });
        console.log('[Agora] Remote video playing in Partner App for user:', user.uid);
        postToRN({ type: 'REMOTE_JOINED', uid: user.uid });
      }

      if (mediaType === 'audio' && user.audioTrack) {
        remoteAudioTracks = remoteAudioTracks.filter(function(t) { return t !== user.audioTrack; });
        remoteAudioTracks.push(user.audioTrack);

        try {
          user.audioTrack.play();
          user.audioTrack.setVolume(100);
          console.log('[Agora] Remote audio track playing in Partner App for user:', user.uid);
        } catch (playErr) {
          console.warn('[Agora] Remote audio play error in Partner App:', playErr);
        }

        unlockAllAudio();
        setCallLabel('🟢 लाइव वॉइस सक्रिय • दोनों पक्ष जुड़े');
        postToRN({ type: 'REMOTE_AUDIO_ACTIVE', uid: user.uid });
        postToRN({ type: 'REMOTE_JOINED', uid: user.uid });
      }
    } catch (subErr) {
      console.warn('[Agora] Subscribe error in Partner App for user ' + user.uid + ':', subErr);
    }
  }

  function withTimeout(promise, ms, label) {
    return new Promise(function(resolve, reject) {
      var t = setTimeout(function() { reject(new Error(label || 'timeout')); }, ms);
      promise.then(
        function(v) { clearTimeout(t); resolve(v); },
        function(e) { clearTimeout(t); reject(e); }
      );
    });
  }

  // Camera track: single Agora call, real error name logged
  async function createCameraTrackSafe() {
    if (MODE !== 'video') return null;
    try {
      var track = await withTimeout(
        AgoraRTC.createCameraVideoTrack({ facingMode: 'user', encoderConfig: '480p_1' }),
        20000,
        'Camera capture timeout'
      );
      console.log('[Agora] Camera track created');
      return track;
    } catch (e) {
      console.error('[Agora] Camera error:', (e && e.name) || '', (e && e.message) || e);
      postToRN({ type: 'CAM_ERROR', message: ((e && e.name) || '') + ': ' + ((e && e.message) || '') });
      return null;
    }
  }

  // Microphone track: single Agora call (no native getUserMedia mixing), real error name logged
  async function createMicrophoneTrackSafe() {
    try {
      var track = await withTimeout(
        AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: 'speech_standard',
          AEC: true, ANS: true, AGC: true
        }),
        20000,
        'Microphone capture timeout'
      );
      console.log('[Agora] Mic track created');
      return track;
    } catch (e) {
      console.error('[Agora] Mic error:', (e && e.name) || '', (e && e.message) || e);
      postToRN({ type: 'MIC_ERROR', message: ((e && e.name) || '') + ': ' + ((e && e.message) || '') });
      return null;
    }
  }

  async function startCall() {
    if (isCallStarting || isCallJoined) {
      console.log('[Agora] startCall skipped in Partner App: already starting or joined');
      return;
    }
    isCallStarting = true;

    try {
      if (typeof AgoraRTC === 'undefined') {
        setCallLabel('⚠️ Agora SDK लोड नहीं हो सका (इंटरनेट जांचें)');
        postToRN({ type: 'CALL_ERROR', message: 'AgoraRTC SDK unavailable' });
        return;
      }

      // Autoplay handler must be set after SDK is confirmed loaded
      try { AgoraRTC.setLogLevel(2); } catch (e) {}
      AgoraRTC.onAudioAutoplayFailed = function() {
        console.warn('[Agora] Autoplay blocked, showing unlock banner');
        var b = document.getElementById('audio-unblock-banner');
        if (b) b.style.display = 'block';
        unlockAllAudio();
      };

      setCallLabel('🎙️ ' + (MODE === 'video' ? 'माइक व कैमरा तैयार हो रहा है...' : 'माइक तैयार हो रहा है...'));

      // 1. Parallel independent track creation (Camera & Mic NEVER block each other!)
      var trackResults = await Promise.all([
        createCameraTrackSafe(),
        createMicrophoneTrackSafe()
      ]);

      localVideoTrack = trackResults[0];
      localAudioTrack = trackResults[1];

      // Play local camera preview in PIP container immediately if camera is available
      var localBox = document.getElementById('local-container');
      if (localVideoTrack && MODE === 'video') {
        try {
          localVideoTrack.play('local-video', { fit: 'cover', mirror: true });
          if (localBox) localBox.style.display = 'block';
          postToRN({ type: 'CAM_ACTIVE', uid: MY_UID });
          console.log('[Agora] Local camera preview playing in Partner App PIP container');
        } catch (playCamErr) {
          console.warn('[Agora] Local camera play warning in Partner App:', playCamErr);
        }
      } else if (localBox) {
        localBox.style.display = 'none';
      }

      if (localAudioTrack) {
        postToRN({ type: 'MIC_ACTIVE', uid: MY_UID });
        console.log('[Agora] Local microphone active in Partner App');
      } else {
        postToRN({ type: 'MIC_ERROR', message: 'Microphone track could not be created' });
        setCallLabel('⚠️ माइक उपलब्ध नहीं - अनुमति जांचें');
      }

      await applyControls();

              // 2. Client + events
              rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

              rtcClient.enableAudioVolumeIndicator();
              rtcClient.on('volume-indicator', function(volumes) {
                if (volumes.length > 0) {
                  postToRN({ type: 'VOLUME_INDICATOR', level: volumes[0].level });
                }
              });

              rtcClient.on('user-published', async function(user, mediaType) {
                await subscribeAndPlay(user, mediaType);
              });

              rtcClient.on('user-unpublished', function(user, mediaType) {
                console.log('[Agora] User unpublished in Partner App:', user.uid, mediaType);
                if (mediaType === 'video') {
                  var placeholder = document.getElementById('placeholder');
                  if (placeholder) placeholder.style.display = 'flex';
                }
                if (mediaType === 'audio' && user.audioTrack) {
                  remoteAudioTracks = remoteAudioTracks.filter(function(t) { return t !== user.audioTrack; });
                }
              });

              rtcClient.on('user-left', function(user) {
                console.log('[Agora] Remote user left channel in Partner App:', user.uid);
                var placeholder = document.getElementById('placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                remoteAudioTracks = [];
                setCallLabel('दूसरे पक्ष ने कॉल समाप्त की');
                postToRN({ type: 'REMOTE_LEFT', uid: user.uid });
              });

              // 3. Token Resolution
              var joinToken = TOKEN || null;
              if (!joinToken && BACKEND_BASE) {
                try {
                  var ctrl = new AbortController();
                  var timer = setTimeout(function() { ctrl.abort(); }, 15000);
                  var res = await fetch(
                    BACKEND_BASE + '/api/agora/token?channelName=' + encodeURIComponent(CHANNEL) + '&uid=' + MY_UID,
                    { signal: ctrl.signal }
                  );
                  clearTimeout(timer);
                  var data = await res.json();
                  if (data && data.token) {
                    joinToken = data.token;
                  }
                } catch (tErr) {
                  console.warn('[Agora] Token fetch fallback notice in Partner App:', tErr && tErr.message);
                }
              }

              // 4. Join channel
              try {
                await rtcClient.join(APP_ID, CHANNEL, joinToken, MY_UID);
                isCallJoined = true;
                console.log('[Agora] Joined channel successfully as UID in Partner App:', MY_UID);
              } catch (initialJoinErr) {
                console.warn('[Agora] Initial join error in Partner App, retrying with fresh token for UID ' + MY_UID + ':', initialJoinErr);
                setCallLabel('🔄 ऑथेंटिकेशन टोकन रिफ्रेश हो रहा है...');
                try {
                  var res2 = await fetch(
                    BACKEND_BASE + '/api/agora/token?channelName=' + encodeURIComponent(CHANNEL) + '&uid=' + MY_UID
                  );
                  var freshData = await res2.json();
                  if (freshData && freshData.token) {
                    joinToken = freshData.token;
                    await rtcClient.join(APP_ID, CHANNEL, joinToken, MY_UID);
                    isCallJoined = true;
                  } else {
                    throw initialJoinErr;
                  }
                } catch (retryErr) {
                  throw initialJoinErr;
                }
              }

              // 5. Subscribe to users already present in channel
              if (rtcClient.remoteUsers && rtcClient.remoteUsers.length > 0) {
                console.log('[Agora] Subscribing to existing remote users in Partner App:', rtcClient.remoteUsers.length);
                rtcClient.remoteUsers.forEach(function(u) {
                  if (u.hasAudio) subscribeAndPlay(u, 'audio');
                  if (u.hasVideo) subscribeAndPlay(u, 'video');
                });
              }

              // 6. Publish local tracks
              var publishList = [];
              if (localAudioTrack) publishList.push(localAudioTrack);
              if (MODE === 'video' && localVideoTrack) publishList.push(localVideoTrack);

              if (publishList.length > 0) {
                try {
                  await rtcClient.publish(publishList);
                  console.log('[Agora] Published ' + publishList.length + ' local tracks in Partner App to channel ' + CHANNEL);
                  setCallLabel('🟢 लाइव ' + (MODE === 'video' ? 'वीडियो व ऑडियो' : 'वॉइस') + ' सक्रिय');
                } catch (pubErr) {
                  console.warn('[Agora] Combined publish warning in Partner App, attempting individual publish:', pubErr);
                  for (var i = 0; i < publishList.length; i++) {
                    try {
                      await rtcClient.publish(publishList[i]);
                      console.log('[Agora] Individually published track in Partner App:', publishList[i].trackMediaType);
                    } catch (singleErr) {
                      console.error('[Agora] Single publish error in Partner App:', singleErr);
                    }
                  }
                  setCallLabel('🟢 लाइव ' + (MODE === 'video' ? 'वीडियो व ऑडियो' : 'वॉइस') + ' सक्रिय');
                }
              } else {
                setCallLabel('⚠️ माइक या कैमरा सक्रिय नहीं है');
              }

              unlockAllAudio();
              postToRN({ type: 'CALL_CONNECTED', uid: MY_UID, channel: CHANNEL });
            } catch (err) {
              console.error('[Agora] RTC Start Error in Partner App:', err);
              setCallLabel('⚠️ कनेक्शन त्रुटि: ' + (err && err.message ? err.message : 'पुनः प्रयास करें'));
              postToRN({ type: 'CALL_ERROR', channel: CHANNEL, message: err && err.message ? err.message : 'Agora join error' });
            } finally {
              isCallStarting = false;
            }
          }

          async function cleanupCall() {
            try {
              isCallJoined = false;
              isCallStarting = false;
              if (localAudioTrack) {
                try { localAudioTrack.stop(); localAudioTrack.close(); } catch(e) {}
                localAudioTrack = null;
              }
              if (localVideoTrack) {
                try { localVideoTrack.stop(); localVideoTrack.close(); } catch(e) {}
                localVideoTrack = null;
              }
              if (rtcClient) {
                try { await rtcClient.leave(); } catch(e) {}
                rtcClient = null;
              }
            } catch (e) {}
          }

          window.leaveAgoraCall = cleanupCall;
          window.addEventListener('pagehide', function() { cleanupCall(); });

          var handleControlsUpdate = async function(msg) {
            if (!msg) return;

            if (msg.type === 'SET_TOKEN' && msg.token) {
              TOKEN = msg.token;
              // Guard: Only renew if token belongs to this channel
              if (rtcClient && isCallJoined) {
                if (!msg.channelName || msg.channelName === CHANNEL) {
                  try {
                    await rtcClient.renewToken(TOKEN);
                    console.log('[Agora] Token renewed in active channel in Partner App');
                  } catch (renErr) {
                    console.warn('[Agora] Token renewal notice in Partner App:', renErr);
                  }
                }
              } else if (!isCallStarting && !isCallJoined) {
                startCall();
              }
              return;
            }

            if (msg.type === 'LEAVE_CALL') {
              await cleanupCall();
              return;
            }

            if (msg.type === 'UPDATE_CONTROLS') {
              if (typeof msg.isMuted === 'boolean') controls.isMuted = msg.isMuted;
              if (typeof msg.isVideoCamOff === 'boolean') controls.isVideoCamOff = msg.isVideoCamOff;
              if (typeof msg.isSpeaker === 'boolean') controls.isSpeaker = msg.isSpeaker;
              await applyControls();

              if (localVideoTrack && typeof msg.isFrontCam === 'boolean' && msg.isFrontCam !== controls.isFrontCam) {
                controls.isFrontCam = msg.isFrontCam;
                try {
                  if (typeof localVideoTrack.setDevice === 'function') {
                    var cams = await AgoraRTC.getCameras();
                    if (cams && cams.length > 1) {
                      var targetCam = msg.isFrontCam ? cams[0] : cams[cams.length - 1];
                      await localVideoTrack.setDevice(targetCam.deviceId);
                    }
                  } else if (typeof localVideoTrack.replaceTrack === 'function' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    var targetFacing = msg.isFrontCam ? 'user' : 'environment';
                    var newStream = await navigator.mediaDevices.getUserMedia({
                      video: { facingMode: targetFacing, width: { ideal: 640 }, height: { ideal: 480 } }
                    });
                    var newTrack = newStream.getVideoTracks()[0];
                    if (newTrack) {
                      await localVideoTrack.replaceTrack(newTrack);
                    }
                  }
                } catch (flipErr) {
                  console.warn('[Agora] Camera flip notice in Partner App:', flipErr && flipErr.message);
                }
              }
              unlockAllAudio();
            }
          };

          window.addEventListener('message', function(e) {
            try { handleControlsUpdate(JSON.parse(e.data)); } catch (err) {}
          });
          document.addEventListener('message', function(e) {
            try { handleControlsUpdate(JSON.parse(e.data)); } catch (err) {}
          });

          // Watchdog: re-check audio playback every 2.5s
          setInterval(function() {
            unlockAllAudio();
          }, 2500);

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
    [activeAppId, channelName, mode, remoteName, backendBase, secureBaseUrl, resolvedUid]
  );

  if (!hasPermission) {
    return (
      <View style={s.permissionContainer}>
        <View style={s.permissionCard}>
          <View style={s.permissionIconRing}>
            <MaterialCommunityIcons
              name={permissionDenied ? 'shield-alert-outline' : mode === 'video' ? 'video-wireless' : 'microphone'}
              size={46}
              color="#F7C966"
            />
          </View>
          <Text style={s.permissionTitle}>
            {mode === 'video' ? 'कैमरा व माइक अनुमति आवश्यक' : 'माइक अनुमति आवश्यक'}
          </Text>
          <Text style={s.permissionSubtitle}>
            {checkingPermission
              ? 'अनुमति की स्थिति जांची जा रही है...'
              : permissionDenied
                ? 'लाइव परामर्श के लिए कृपया अपने फोन से कैमरा व माइक की अनुमति प्रदान करें।'
                : 'लाइव चैनल से जुड़ने के लिए अनुमति आवश्यक है।'}
          </Text>

          {checkingPermission ? (
            <ActivityIndicator size="small" color="#D48B28" style={{ marginTop: 16 }} />
          ) : (
            <View style={{ width: '100%', marginTop: 20, gap: 10 }}>
              <TouchableOpacity
                style={s.permissionPrimaryBtn}
                activeOpacity={0.85}
                onPress={requestMediaPermissions}
              >
                <MaterialCommunityIcons name="shield-check" size={18} color="#12091A" />
                <Text style={s.permissionPrimaryBtnText}>अनुमति दें (Grant Permission)</Text>
              </TouchableOpacity>

              {permissionDenied && (
                <TouchableOpacity
                  style={s.permissionSecondaryBtn}
                  activeOpacity={0.85}
                  onPress={() => Linking.openSettings()}
                >
                  <MaterialCommunityIcons name="cog-outline" size={17} color="#F7C966" />
                  <Text style={s.permissionSecondaryBtnText}>ऐप सेटिंग्स खोलें (Open Settings)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={s.container}
      onTouchStart={() => {
        try {
          webViewRef.current?.injectJavaScript('window.unlockAllAudio && window.unlockAllAudio(); true;');
        } catch (e) { }
      }}
    >
      <WebView
        ref={setWebViewRef}
        key={`${channelName}_${resolvedUid}`}
        source={webViewSource}
        style={s.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onError={(e) => console.warn('WebView error', e.nativeEvent)}
        onHttpError={(e) => console.warn('WebView http error', e.nativeEvent)}
        renderLoading={() => (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={colors.accent || '#E67E00'} />
            <Text style={s.loaderText}>Connecting to Agora Channel...</Text>
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
  permissionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#12091A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(28, 14, 40, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 139, 40, 0.4)',
    padding: 24,
    alignItems: 'center',
  },
  permissionIconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(212, 139, 40, 0.15)',
    borderWidth: 1.5,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionSubtitle: {
    color: '#E0D4C3',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  permissionPrimaryBtn: {
    backgroundColor: '#D48B28',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
  },
  permissionPrimaryBtnText: {
    color: '#12091A',
    fontWeight: '800',
    fontSize: 13.5,
  },
  permissionSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(247, 201, 102, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
  },
  permissionSecondaryBtnText: {
    color: '#F7C966',
    fontWeight: '700',
    fontSize: 13,
  },
});