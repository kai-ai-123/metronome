'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type BeatAccent,
  type MetronomeConfig,
  type SilentConfig,
  type TempoRampConfig,
  type TimeSignature,
  getBeatCount,
  getBeatIntervalSec,
  getDefaultPattern,
} from '@/types/metronome';

interface UseMetronomeReturn {
  config: MetronomeConfig;
  isPlaying: boolean;
  currentBeat: number;
  isSilentMeasure: boolean;
  currentMeasure: number;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  toggleBeatAccent: (index: number) => void;
  setSilentConfig: (update: Partial<SilentConfig>) => void;
  setTempoRampConfig: (update: Partial<TempoRampConfig>) => void;
  applyConfig: (config: MetronomeConfig) => void;
  togglePlay: () => void;
}

// --- Audio ---

function playClick(ctx: AudioContext, accent: BeatAccent, time: number) {
  if (accent === 'mute') return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const isStrong = accent === 'strong';
  osc.frequency.value = isStrong ? 1000 : 800;
  osc.type = 'sine';

  const duration = isStrong ? 0.06 : 0.04;
  const volume = isStrong ? 0.7 : 0.4;

  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + duration);
}

// --- Hook ---

const SCHEDULE_AHEAD = 0.1; // 100ms先まで事前スケジュール
const TIMER_INTERVAL = 25; // 25msごとにチェック

const DEFAULT_SILENT: SilentConfig = {
  enabled: false,
  soundBars: 2,
  silentBars: 1,
};

const DEFAULT_TEMPO_RAMP: TempoRampConfig = {
  enabled: false,
  mode: 'up',
  targetBpm: 100,
  stepBpm: 5,
  everyBars: 4,
};

export function useMetronome(): UseMetronomeReturn {
  const [config, setConfig] = useState<MetronomeConfig>({
    bpm: 100,
    timeSignature: '4/4',
    beatPattern: getDefaultPattern('4/4'),
    silent: DEFAULT_SILENT,
    tempoRamp: DEFAULT_TEMPO_RAMP,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [isSilentMeasure, setIsSilentMeasure] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const measureCountRef = useRef(0); // 現在の小節番号（0始まり）
  const lastRampMeasureRef = useRef(0); // 前回テンポ変更した小節番号

  const configRef = useRef(config);
  configRef.current = config;

  /** 現在の小節が無音区間かどうかを判定 */
  const checkSilent = useCallback(
    (measureIndex: number, silent: SilentConfig): boolean => {
      if (!silent.enabled) return false;
      const cycleLength = silent.soundBars + silent.silentBars;
      const posInCycle = measureIndex % cycleLength;
      return posInCycle >= silent.soundBars;
    },
    [],
  );

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const cfg = configRef.current;
    const interval = getBeatIntervalSec(cfg.bpm, cfg.timeSignature);
    const beatsPerMeasure = getBeatCount(cfg.timeSignature);

    while (nextBeatTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const idx = beatIndexRef.current;
      const beatInMeasure = idx % beatsPerMeasure;
      const accent = cfg.beatPattern[beatInMeasure % cfg.beatPattern.length];

      // 小節の先頭で小節カウントを更新
      if (beatInMeasure === 0 && idx > 0) {
        measureCountRef.current += 1;

        // テンポランプ: everyBarsごとにBPMを変更
        const ramp = cfg.tempoRamp;
        if (ramp.enabled) {
          const measuresSinceLast =
            measureCountRef.current - lastRampMeasureRef.current;
          if (measuresSinceLast >= ramp.everyBars) {
            lastRampMeasureRef.current = measureCountRef.current;
            const currentBpm = cfg.bpm;
            const step = ramp.mode === 'up' ? ramp.stepBpm : -ramp.stepBpm;
            let newBpm = currentBpm + step;
            // 到達BPMを超えないようクランプ
            if (ramp.mode === 'up') {
              newBpm = Math.min(newBpm, ramp.targetBpm);
            } else {
              newBpm = Math.max(newBpm, ramp.targetBpm);
            }
            if (newBpm !== currentBpm) {
              setConfig((prev) => ({ ...prev, bpm: newBpm }));
            }
          }
        }
      }

      const silent = checkSilent(measureCountRef.current, cfg.silent);

      // 無音区間でなければ音を鳴らす
      if (!silent) {
        playClick(ctx, accent, nextBeatTimeRef.current);
      }

      // UIは常に更新（無音中もビートは動く）
      setCurrentBeat(beatInMeasure);
      setIsSilentMeasure(silent);
      setCurrentMeasure(measureCountRef.current);

      nextBeatTimeRef.current += interval;
      beatIndexRef.current += 1;
    }
  }, [checkSilent]);

  // AudioContextを初期化（ユーザー操作時に呼ぶ）
  const ensureAudioContext = useCallback(async (): Promise<AudioContext> => {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    const ctx = await ensureAudioContext();

    beatIndexRef.current = 0;
    measureCountRef.current = 0;
    lastRampMeasureRef.current = 0;

    // 1拍目を少し先にスケジュール（AudioContext初回作成時にcurrentTime≈0で鳴らないのを回避）
    const cfg = configRef.current;
    const now = ctx.currentTime + 0.05;
    const silent = checkSilent(0, cfg.silent);

    if (!silent) {
      playClick(ctx, cfg.beatPattern[0], now);
    }
    setCurrentBeat(0);
    setIsSilentMeasure(silent);
    setCurrentMeasure(0);

    // 2拍目以降のスケジューリング開始
    const interval = getBeatIntervalSec(cfg.bpm, cfg.timeSignature);
    nextBeatTimeRef.current = now + interval;
    beatIndexRef.current = 1;

    setIsPlaying(true);
    timerRef.current = window.setInterval(scheduler, TIMER_INTERVAL);
  }, [ensureAudioContext, scheduler, checkSilent]);

  const stop = useCallback(() => {
    stopTimer();
    setIsPlaying(false);
    setCurrentBeat(-1);
    setIsSilentMeasure(false);
    setCurrentMeasure(0);
  }, [stopTimer]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const setBpm = useCallback((bpm: number) => {
    const clamped = Math.max(30, Math.min(300, bpm));
    setConfig((prev) => ({ ...prev, bpm: clamped }));
  }, []);

  const setTimeSignature = useCallback((ts: TimeSignature) => {
    setConfig((prev) => ({
      ...prev,
      timeSignature: ts,
      beatPattern: getDefaultPattern(ts),
    }));
  }, []);

  const toggleBeatAccent = useCallback((index: number) => {
    setConfig((prev) => {
      const next: BeatAccent[] = [...prev.beatPattern];
      const cycle: BeatAccent[] = ['strong', 'normal', 'mute'];
      const cur = cycle.indexOf(next[index]);
      next[index] = cycle[(cur + 1) % cycle.length];
      return { ...prev, beatPattern: next };
    });
  }, []);

  const setSilentConfig = useCallback((update: Partial<SilentConfig>) => {
    setConfig((prev) => ({
      ...prev,
      silent: { ...prev.silent, ...update },
    }));
  }, []);

  const setTempoRampConfig = useCallback((update: Partial<TempoRampConfig>) => {
    setConfig((prev) => ({
      ...prev,
      tempoRamp: { ...prev.tempoRamp, ...update },
    }));
  }, []);

  const applyConfig = useCallback((newConfig: MetronomeConfig) => {
    setConfig(newConfig);
  }, []);

  return {
    config,
    isPlaying,
    currentBeat,
    isSilentMeasure,
    currentMeasure,
    setBpm,
    setTimeSignature,
    toggleBeatAccent,
    setSilentConfig,
    setTempoRampConfig,
    applyConfig,
    togglePlay,
  };
}
