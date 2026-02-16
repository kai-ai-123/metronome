import { useState, useRef, useCallback, useEffect } from 'react';
import type { TimerMode } from '@/types/timer';

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function usePracticeTimer() {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isFinished) return;
    setIsRunning(true);
  }, [isFinished]);

  const stop = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsFinished(false);
    setElapsedSeconds(0);
    clearTimer();
  }, [clearTimer]);

  // タイマー動作
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    const MAX_SECONDS = 35999; // 9:59:59
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => (prev >= MAX_SECONDS ? 0 : prev + 1));
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // カウントダウン終了判定
  useEffect(() => {
    if (mode !== 'countdown') return;
    const targetSeconds = targetMinutes * 60;
    if (elapsedSeconds >= targetSeconds && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
      clearTimer();

      // ブラウザ通知
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('練習完了！', {
            body: `${targetMinutes}分の練習が終了しました`,
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification('練習完了！', {
                body: `${targetMinutes}分の練習が終了しました`,
              });
            }
          });
        }
      }
    }
  }, [elapsedSeconds, mode, targetMinutes, isRunning, clearTimer]);

  // 表示用の時間
  const displaySeconds =
    mode === 'countdown'
      ? Math.max(targetMinutes * 60 - elapsedSeconds, 0)
      : elapsedSeconds;

  const timeDisplay = formatTime(displaySeconds);

  return {
    mode,
    setMode,
    targetMinutes,
    setTargetMinutes,
    elapsedSeconds,
    isRunning,
    isFinished,
    timeDisplay,
    start,
    stop,
    reset,
  };
}
