/**
 * Ensures React Native environment and `globalThis.expo` are initialized before
 * `expo` / `expo-modules-core` evaluate `globalThis.expo.EventEmitter`.
 * Prevents `[runtime not ready]: Cannot read property 'EventEmitter' of undefined`
 * on fast reloads or Bridgeless startup races.
 */
try {
  require('react-native/setup-env');
} catch (e) {
  try {
    require('react-native/Libraries/Core/InitializeCore');
  } catch (e2) {}
}

try {
  if (!globalThis.expo || !globalThis.expo.EventEmitter) {
    const { TurboModuleRegistry } = require('react-native');
    TurboModuleRegistry?.get?.('ExpoModulesCore')?.installModules?.();
  }
} catch (e) {}

if (!globalThis.expo || !globalThis.expo.EventEmitter) {
  let CoreModule = null;
  try {
    CoreModule = require('expo-modules-core/build/polyfill/CoreModule');
  } catch (e) {}

  class FallbackEventEmitter {
    constructor() {
      this._listeners = new Map();
    }
    addListener(eventName, listener) {
      if (!this._listeners.has(eventName)) this._listeners.set(eventName, new Set());
      this._listeners.get(eventName).add(listener);
      return { remove: () => this.removeListener(eventName, listener) };
    }
    removeListener(eventName, listener) {
      this._listeners.get(eventName)?.delete(listener);
    }
    removeAllListeners(eventName) {
      this._listeners.get(eventName)?.clear();
    }
    emit(eventName, ...args) {
      const set = this._listeners.get(eventName);
      if (!set) return;
      set.forEach((fn) => {
        try { fn(...args); } catch (err) {}
      });
    }
    listenerCount(eventName) {
      return this._listeners.get(eventName)?.size ?? 0;
    }
  }

  const EventEmitter = CoreModule?.EventEmitter || FallbackEventEmitter;
  const NativeModule = CoreModule?.NativeModule || class NativeModule extends EventEmitter {};
  const SharedObject = CoreModule?.SharedObject || class SharedObject extends EventEmitter { release() {} };
  const SharedRef = CoreModule?.SharedRef || class SharedRef extends SharedObject {};

  globalThis.expo = {
    ...(globalThis.expo || {}),
    EventEmitter,
    NativeModule,
    SharedObject,
    SharedRef,
    modules: (globalThis.expo && globalThis.expo.modules) || {},
  };
}
