import { io } from 'socket.io-client';
import { BASE_URL, getAuthToken } from './api';

/**
 * Partner WebSocket Service — real-time alerts & live GPS tracking & live Astro Talk.
 * Connects to unified backend (vaidic-sanskar-admin-suite / terabase):
 *   - Live Astrologer Presence (astro:online, astro:presence, astro:offline, astro:list)
 *   - Real-time Agora Call Signaling (astro:call:incoming, astro:call:accept, astro:call:decline, astro:call:ended)
 *   - Live Consultation Chat (astro:chat:send, astro:chat:message)
 *   - Incoming puja requests & lifecycle sync (booking:request, job:broadcast, tracking:update, etc.)
 */
class PartnerSocket {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connected = false;
    this.emitQueue = [];
    this.activeAstroPayload = null;
    this.registeredServerEvents = new Set();
    this.autoConnect();
  }

  autoConnect() {
    try {
      const socketHost = (process.env.EXPO_PUBLIC_SOCKET_URL || 'https://vaidic-sanskar-admin-suite.onrender.com').replace(/\/api\/partner\/?$/, '').replace(/\/api\/?$/, '');
      const token = getAuthToken();

      this.socket = io(socketHost, {
        auth: { token },
        query: { role: 'vendor' },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 25,
        reconnectionDelay: 1500,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log(`🔌 [Partner App] Live Socket Connected: ${this.socket.id}`);
        this.emitLocal('open', { socketId: this.socket.id });

        // Re-attach any listeners registered before connect
        this.attachAllListenersToServer();

        // Flush queued emits
        while (this.emitQueue.length > 0) {
          const item = this.emitQueue.shift();
          this.socket.emit(item.event, item.data, item.callback);
        }

        // Auto re-broadcast live partner presence if previously online
        if (this.activeAstroPayload) {
          this.socket.emit('astro:online', this.activeAstroPayload);
          this.socket.emit('astro:presence', this.activeAstroPayload);
        }
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        console.log(`🔌 [Partner App] Live Socket Disconnected: ${reason}`);
        this.emitLocal('close', { reason });
      });

      this.socket.on('connect_error', (err) => {
        this.connected = false;
        this.emitLocal('error', err);
      });

      // Default events to forward from server to local listeners
      const coreEvents = [
        'booking:request',
        'job:broadcast',
        'job:new',
        'instant:request',
        'instant:new',
        'instant:offer',
        'booking:taken',
        'job:taken',
        'tracking:update',
        'booking:location',
        'booking:cancelled',
        'chat:message',
        'order:new',
        'inquiry:new',
        'vendor:update',
        'vendor:status',
        'kyc:approved',
        'astro:call:incoming',
        'astro:call:connected',
        'astro:call:declined',
        'astro:call:ended',
        'astro:chat:message',
        'astro:presence',
        'astro:online',
        'astro:offline',
        'astro:list',
      ];

      coreEvents.forEach((ev) => this.bindServerEvent(ev));
    } catch (e) {
      console.log('Partner socket init notice:', e?.message);
    }
  }

  bindServerEvent(event) {
    if (!this.socket || this.registeredServerEvents.has(event)) return;
    this.registeredServerEvents.add(event);
    this.socket.on(event, (data) => {
      this.emitLocal(event, data);
    });
  }

  attachAllListenersToServer() {
    if (!this.socket) return;
    Object.keys(this.listeners).forEach((ev) => {
      this.bindServerEvent(ev);
    });
  }

  connect(token) {
    if (this.socket && this.connected) return;
    if (this.socket) {
      if (token) this.socket.auth = { token };
      this.socket.connect();
    } else {
      this.autoConnect();
    }
  }

  join(room) {
    if (!room) return;
    this.emit('booking:join', { bookingId: room, room });
  }

  leave(room) {
    if (!room) return;
    this.emit('booking:leave', { bookingId: room, room });
  }

  on(event, cb) {
    (this.listeners[event] ||= []).push(cb);
    if (this.socket) {
      this.bindServerEvent(event);
    }
    return () => {
      this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== cb);
    };
  }

  off(event, cb) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== cb);
    }
  }

  emitLocal(event, data) {
    (this.listeners[event] || []).forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Socket listener error [${event}]:`, err);
      }
    });
  }

  emit(event, data, callback) {
    this.emitLocal(event, data);

    // Track online astrologer payload for auto-reconnect resilience
    if (event === 'astro:online' || event === 'astro:presence') {
      if (data?.isOnline !== false) {
        this.activeAstroPayload = data;
      } else {
        this.activeAstroPayload = null;
      }
    }

    if (this.socket && this.connected) {
      this.socket.emit(event, data, callback);
    } else {
      this.emitQueue.push({ event, data, callback });
      if (!this.socket) this.autoConnect();
    }
  }

  send(event, data) {
    this.emit(event, data);
  }

  disconnect() {
    this.activeAstroPayload = null;
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connected = false;
  }

  simulate(event, data, after = 2500) {
    const t = setTimeout(() => this.emitLocal(event, data), after);
    return () => clearTimeout(t);
  }
}

const socket = new PartnerSocket();
export default socket;
