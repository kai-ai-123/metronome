'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type BeatAccent,
  type MetronomeConfig,
  type SilentConfig,
  type SoundType,
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
  volume: number;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setSound: (sound: SoundType) => void;
  setVolume: (volume: number) => void;
  toggleBeatAccent: (index: number) => void;
  setSilentConfig: (update: Partial<SilentConfig>) => void;
  setTempoRampConfig: (update: Partial<TempoRampConfig>) => void;
  applyConfig: (config: MetronomeConfig) => void;
  togglePlay: () => void;
}

// --- Audio ---

interface SoundDef {
  strong: { freq: number; type: OscillatorType; duration: number; volume: number };
  normal: { freq: number; type: OscillatorType; duration: number; volume: number };
}

const SOUND_DEFS: Record<Exclude<SoundType, 'hi-hat' | 'wood'>, SoundDef> = {
  click: {
    strong: { freq: 1000, type: 'sine', duration: 0.06, volume: 0.7 },
    normal: { freq: 800, type: 'sine', duration: 0.04, volume: 0.4 },
  },
  beep: {
    strong: { freq: 700, type: 'triangle', duration: 0.05, volume: 0.7 },
    normal: { freq: 500, type: 'triangle', duration: 0.03, volume: 0.4 },
  },
};

function playOscClick(
  ctx: AudioContext,
  dest: AudioNode,
  accent: 'strong' | 'normal',
  time: number,
  def: SoundDef,
) {
  const params = def[accent];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = params.freq;
  osc.type = params.type;

  gain.gain.setValueAtTime(params.volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + params.duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + params.duration);
}

// --- ウッドブロック（サンプルベース） ---

let woodBlockBuffer: AudioBuffer | null = null;
let woodBlockLoadPromise: Promise<void> | null = null;

// サンプル位置（秒）と再生長
const WOOD_STRONG = { offset: 3.45, duration: 0.3 }; // 高い音
const WOOD_NORMAL = { offset: 1.8, duration: 0.3 }; // 低い音

function loadWoodBlockSample(ctx: AudioContext): Promise<void> {
  if (woodBlockBuffer) return Promise.resolve();
  if (woodBlockLoadPromise) return woodBlockLoadPromise;
  woodBlockLoadPromise = (async () => {
    try {
      const res = await fetch('/sounds/wood-block.mp3');
      const arrayBuf = await res.arrayBuffer();
      woodBlockBuffer = await ctx.decodeAudioData(arrayBuf);
    } catch (e) {
      console.warn('ウッドブロックサンプルの読み込みに失敗:', e);
    }
  })();
  return woodBlockLoadPromise;
}

function playWoodBlock(
  ctx: AudioContext,
  dest: AudioNode,
  accent: 'strong' | 'normal',
  time: number,
) {
  if (!woodBlockBuffer) return;

  const sample = accent === 'strong' ? WOOD_STRONG : WOOD_NORMAL;
  const source = ctx.createBufferSource();
  source.buffer = woodBlockBuffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(accent === 'strong' ? 0.9 : 0.55, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + sample.duration);

  source.connect(gain);
  gain.connect(dest);

  source.start(time, sample.offset, sample.duration);
}

// --- ハイハット（サンプルベース） ---

let hiHatBuffer: AudioBuffer | null = null;
let hiHatLoadPromise: Promise<void> | null = null;

const HI_HAT_SAMPLE = { offset: 0.05, duration: 0.3 };

function loadHiHatSample(ctx: AudioContext): Promise<void> {
  if (hiHatBuffer) return Promise.resolve();
  if (hiHatLoadPromise) return hiHatLoadPromise;
  hiHatLoadPromise = (async () => {
    try {
      const res = await fetch('/sounds/hi-hat.mp3');
      const arrayBuf = await res.arrayBuffer();
      hiHatBuffer = await ctx.decodeAudioData(arrayBuf);
    } catch (e) {
      console.warn('ハイハットサンプルの読み込みに失敗:', e);
    }
  })();
  return hiHatLoadPromise;
}

function playHiHat(
  ctx: AudioContext,
  dest: AudioNode,
  accent: 'strong' | 'normal',
  time: number,
) {
  if (!hiHatBuffer) return;

  const isStrong = accent === 'strong';
  const source = ctx.createBufferSource();
  source.buffer = hiHatBuffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(isStrong ? 1.0 : 0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + HI_HAT_SAMPLE.duration);

  if (isStrong) {
    // strong拍: ハイパスで高域を強調し明るく鋭い音に
    const filter = ctx.createBiquadFilter();
    filter.type = 'highshelf';
    filter.frequency.value = 6000;
    filter.gain.value = 6;

    source.connect(filter);
    filter.connect(gain);
  } else {
    source.connect(gain);
  }
  gain.connect(dest);

  source.start(time, HI_HAT_SAMPLE.offset, HI_HAT_SAMPLE.duration);
}

function playClick(
  ctx: AudioContext,
  dest: AudioNode,
  accent: BeatAccent,
  time: number,
  sound: SoundType,
) {
  if (accent === 'mute') return;

  if (sound === 'hi-hat') {
    playHiHat(ctx, dest, accent, time);
  } else if (sound === 'wood') {
    playWoodBlock(ctx, dest, accent, time);
  } else {
    playOscClick(ctx, dest, accent, time, SOUND_DEFS[sound]);
  }
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
    sound: 'click',
    volume: 100,
    silent: DEFAULT_SILENT,
    tempoRamp: DEFAULT_TEMPO_RAMP,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [isSilentMeasure, setIsSilentMeasure] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const measureCountRef = useRef(0); // 現在の小節番号（0始まり）
  const lastRampMeasureRef = useRef(0); // 前回テンポ変更した小節番号

  const configRef = useRef(config);
  configRef.current = config;

  const volumeRef = useRef(config.volume);
  volumeRef.current = config.volume;

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
            // functional update内でprev.bpmから計算し、他のsetConfigとの競合を防止
            setConfig((prev) => {
              const step = ramp.mode === 'up' ? ramp.stepBpm : -ramp.stepBpm;
              let newBpm = prev.bpm + step;
              if (ramp.mode === 'up') {
                newBpm = Math.min(newBpm, ramp.targetBpm);
              } else {
                newBpm = Math.max(newBpm, ramp.targetBpm);
              }
              if (newBpm === prev.bpm) return prev;
              return { ...prev, bpm: newBpm };
            });
          }
        }
      }

      const silent = checkSilent(measureCountRef.current, cfg.silent);

      // 無音区間でなければ音を鳴らす
      if (!silent) {
        const dest = masterGainRef.current ?? ctx.destination;
        playClick(ctx, dest, accent, nextBeatTimeRef.current, cfg.sound);
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
      // iOS Safari対応: webkitAudioContextフォールバック
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AudioCtx();
      audioCtxRef.current = ctx;
    }
    if (!masterGainRef.current) {
      const gain = ctx.createGain();
      gain.gain.value = volumeRef.current / 100;
      gain.connect(ctx.destination);
      masterGainRef.current = gain;
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    // iOS Safari: 無音バッファを再生してAudioContextをアンロック
    const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = silent;
    source.connect(ctx.destination);
    source.start(0);
    // サンプル音源を事前読み込み（完了を待つ）
    await Promise.all([
      loadWoodBlockSample(ctx),
      loadHiHatSample(ctx),
    ]);
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
      const dest = masterGainRef.current ?? ctx.destination;
      playClick(ctx, dest, cfg.beatPattern[0], now, cfg.sound);
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

  const setSound = useCallback((sound: SoundType) => {
    setConfig((prev) => ({ ...prev, sound }));
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setConfig((prev) => ({ ...prev, volume: clamped }));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = clamped / 100;
    }
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
    if (masterGainRef.current && newConfig.volume !== undefined) {
      masterGainRef.current.gain.value = newConfig.volume / 100;
    }
  }, []);

  return {
    config,
    isPlaying,
    currentBeat,
    isSilentMeasure,
    currentMeasure,
    volume: config.volume,
    setBpm,
    setTimeSignature,
    setSound,
    setVolume,
    toggleBeatAccent,
    setSilentConfig,
    setTempoRampConfig,
    applyConfig,
    togglePlay,
  };
}
