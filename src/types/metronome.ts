export type TimeSignature =
  | '2/4'
  | '3/4'
  | '4/4'
  | '5/4'
  | '3/8'
  | '6/8'
  | '9/8'
  | '12/8';

export type BeatAccent = 'strong' | 'normal' | 'mute';

export interface SilentConfig {
  enabled: boolean;
  soundBars: number;
  silentBars: number;
}

export type TempoRampMode = 'up' | 'down';

export interface TempoRampConfig {
  enabled: boolean;
  mode: TempoRampMode;
  targetBpm: number;
  stepBpm: number;
  everyBars: number;
}

export interface MetronomeConfig {
  bpm: number;
  timeSignature: TimeSignature;
  beatPattern: BeatAccent[];
  silent: SilentConfig;
  tempoRamp: TempoRampConfig;
}

export const TIME_SIGNATURES: TimeSignature[] = [
  '2/4',
  '3/4',
  '4/4',
  '5/4',
  '3/8',
  '6/8',
  '9/8',
  '12/8',
];

export function getBeatCount(ts: TimeSignature): number {
  const [beats] = ts.split('/').map(Number);
  return beats;
}

/** 8分音符系かどうか */
export function isCompoundMeter(ts: TimeSignature): boolean {
  return ts.endsWith('/8');
}

/** BPMから1拍(表示上の1ビート)の間隔（秒）を返す */
export function getBeatIntervalSec(bpm: number, ts: TimeSignature): number {
  if (isCompoundMeter(ts)) {
    // 8分音符系: 分子÷3 を4分音符の拍数とみなす
    // → 8分音符1つ = (60/BPM) / 3
    return 60 / bpm / 3;
  }
  return 60 / bpm;
}

const DEFAULT_PATTERNS: Partial<Record<TimeSignature, BeatAccent[]>> = {
  '3/8': ['strong', 'mute', 'mute'],
  '6/8': ['strong', 'mute', 'mute', 'normal', 'mute', 'mute'],
  '9/8': [
    'strong',
    'mute',
    'mute',
    'normal',
    'mute',
    'mute',
    'normal',
    'mute',
    'mute',
  ],
  '12/8': [
    'strong',
    'mute',
    'mute',
    'normal',
    'mute',
    'mute',
    'normal',
    'mute',
    'mute',
    'normal',
    'mute',
    'mute',
  ],
};

export function getDefaultPattern(ts: TimeSignature): BeatAccent[] {
  if (DEFAULT_PATTERNS[ts]) return [...DEFAULT_PATTERNS[ts]!];
  const count = getBeatCount(ts);
  return ['strong', ...Array<BeatAccent>(count - 1).fill('normal')];
}
