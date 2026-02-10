import { type MetronomeConfig } from './metronome';

export interface Preset {
  id: string;
  name: string;
  config: MetronomeConfig;
}

export const MAX_PRESETS = 10;
