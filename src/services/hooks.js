import { useEffect, useRef, useState, useCallback } from 'react';

/** Ticking countdown in seconds with onEnd. Used by broadcast (180s) & SLA timers. */
export function useCountdown(initial, { onEnd, autoStart = true } = {}) {
  const [seconds, setSeconds] = useState(initial);
  const [running, setRunning] = useState(autoStart);
  const end = useRef(onEnd); end.current = onEnd;

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) { setRunning(false); end.current?.(); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  return { seconds, running, start: () => setRunning(true), stop: () => setRunning(false), reset: (s) => setSeconds(s ?? initial) };
}

/** Elapsed up-counter (in-call duration + earnings). */
export function useElapsed(running) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return sec;
}

export const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
export const fmtMMSS = (s) => { const m = Math.floor(s / 60), r = s % 60; return `${m}:${String(r).padStart(2, '0')}`; };
