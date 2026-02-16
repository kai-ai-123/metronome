export type TimerMode = 'stopwatch' | 'countdown';

export interface TimerConfig {
  enabled: boolean;
  mode: TimerMode;
  targetMinutes: number;
  syncWithMetronome: boolean;
}
