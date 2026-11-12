import { useEffect, useRef, useState, useCallback } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Computes safe Android bottom padding when the OS does not shrink the window
 * (e.g. adjustPan / edge-to-edge), while avoiding double padding if the OS
 * already resizes the viewport. iOS relies on KeyboardAvoidingView behavior="padding".
 */
export function useKeyboardLift(onOpenScroll) {
  const [androidLift, setAndroidLift] = useState(0);
  const fullHeightRef = useRef(0);
  const latestHeightRef = useRef(0);
  const kbHeightRef = useRef(0);
  const onOpenRef = useRef(onOpenScroll);
  onOpenRef.current = onOpenScroll;

  const recomputeLift = useCallback(() => {
    if (Platform.OS !== 'android') return;
    const kb = kbHeightRef.current;
    if (kb <= 0) {
      setAndroidLift(0);
      return;
    }
    const shrunk =
      fullHeightRef.current > 0 && latestHeightRef.current > 0
        ? Math.max(0, fullHeightRef.current - latestHeightRef.current)
        : 0;
    setAndroidLift(Math.max(0, Math.round(kb - shrunk)));
  }, []);

  const onContainerLayout = useCallback(
    (e) => {
      const h = e?.nativeEvent?.layout?.height || 0;
      if (!h) return;
      latestHeightRef.current = h;
      if (kbHeightRef.current === 0 && h > fullHeightRef.current) {
        fullHeightRef.current = h;
      }
      recomputeLift();
    },
    [recomputeLift]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'android') {
        kbHeightRef.current = e?.endCoordinates?.height || 0;
        recomputeLift();
      }
      if (typeof onOpenRef.current === 'function') {
        setTimeout(() => onOpenRef.current?.(), 80);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'android') {
        kbHeightRef.current = 0;
        setAndroidLift(0);
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [recomputeLift]);

  return { androidLift, onContainerLayout };
}

