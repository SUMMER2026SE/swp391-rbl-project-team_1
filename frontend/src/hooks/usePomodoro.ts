'use client';

import { useState, useEffect, useRef } from 'react';

export type PomodoroMode = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

const MODE_DURATIONS = {
  WORK: 25 * 60, // 25 minutes in seconds
  SHORT_BREAK: 5 * 60, // 5 minutes
  LONG_BREAK: 15 * 60 // 15 minutes
};

export function usePomodoro() {
  const [mode, setMode] = useState<PomodoroMode>('WORK');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_DURATIONS.WORK);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync tab title with timer state
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    const modeEmoji = mode === 'WORK' ? '🍅' : '☕';
    document.title = isRunning 
      ? `${minutes}:${seconds} — EduPath ${modeEmoji}`
      : `EduPath ${modeEmoji}`;

    return () => {
      document.title = 'EduPath';
    };
  }, [timeLeft, isRunning, mode]);

  // Handle countdown interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, mode]);

  const handleSessionEnd = () => {
    setIsRunning(false);
    playAlarm();

    if (mode === 'WORK') {
      const nextCount = sessionCount + 1;
      setSessionCount(nextCount);

      if (nextCount % 4 === 0) {
        setMode('LONG_BREAK');
        setTimeLeft(MODE_DURATIONS.LONG_BREAK);
      } else {
        setMode('SHORT_BREAK');
        setTimeLeft(MODE_DURATIONS.SHORT_BREAK);
      }
    } else {
      setMode('WORK');
      setTimeLeft(MODE_DURATIONS.WORK);
    }
  };

  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(apiDestination(audioCtx));

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5); // beep for 0.5s
    } catch (error) {
      console.warn('Audio feedback failed to trigger:', error);
    }
  };

  // Safe fallback helper for AudioContext destination mapping
  const apiDestination = (ctx: AudioContext) => {
    return ctx.destination;
  };

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);

  const reset = (customMode?: PomodoroMode) => {
    setIsRunning(false);
    const targetMode = customMode || mode;
    setMode(targetMode);
    setTimeLeft(MODE_DURATIONS[targetMode]);
  };

  const skip = () => {
    handleSessionEnd();
  };

  return {
    timeLeft,
    isRunning,
    mode,
    sessionCount,
    start,
    pause,
    reset,
    skip
  };
}

export default usePomodoro;
