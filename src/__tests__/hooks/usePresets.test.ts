import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type MetronomeConfig, getDefaultPattern } from '@/types/metronome';
import { MAX_PRESETS } from '@/types/preset';
import { usePresets } from '@/hooks/usePresets';

const STORAGE_KEY = 'rhythmapp-presets';

const makeConfig = (bpm = 120): MetronomeConfig => ({
  bpm,
  timeSignature: '4/4',
  beatPattern: getDefaultPattern('4/4'),
  sound: 'click',
  silent: { enabled: false, soundBars: 2, silentBars: 1 },
  tempoRamp: {
    enabled: false,
    mode: 'up',
    targetBpm: 100,
    stepBpm: 5,
    everyBars: 4,
  },
});

describe('usePresets', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('初期状態は空配列', () => {
    const { result } = renderHook(() => usePresets());
    expect(result.current.presets).toEqual([]);
  });

  it('localStorageに既存データがあれば読み込む', () => {
    const existing = [{ id: 'test1', name: 'Preset1', config: makeConfig() }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    const { result } = renderHook(() => usePresets());
    expect(result.current.presets).toEqual(existing);
  });

  it('savePresetで保存できる', () => {
    const { result } = renderHook(() => usePresets());

    act(() => {
      result.current.savePreset('My Preset', makeConfig(100));
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe('My Preset');
    expect(result.current.presets[0].config.bpm).toBe(100);

    // localStorageにも保存されている
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
  });

  it('deletePresetで削除できる', () => {
    const { result } = renderHook(() => usePresets());

    act(() => {
      result.current.savePreset('A', makeConfig());
    });
    const id = result.current.presets[0].id;

    act(() => {
      result.current.deletePreset(id);
    });

    expect(result.current.presets).toHaveLength(0);
  });

  it('renamePresetでリネームできる', () => {
    const { result } = renderHook(() => usePresets());

    act(() => {
      result.current.savePreset('Old Name', makeConfig());
    });
    const id = result.current.presets[0].id;

    act(() => {
      result.current.renamePreset(id, 'New Name');
    });

    expect(result.current.presets[0].name).toBe('New Name');
  });

  it('上限を超えるとsavePresetはfalseを返す', () => {
    const { result } = renderHook(() => usePresets());

    // MAX_PRESETS個保存
    for (let i = 0; i < MAX_PRESETS; i++) {
      act(() => {
        result.current.savePreset(`Preset ${i}`, makeConfig());
      });
    }
    expect(result.current.presets).toHaveLength(MAX_PRESETS);

    // 上限超え
    let success = false;
    act(() => {
      success = result.current.savePreset('Over Limit', makeConfig());
    });
    expect(success).toBe(false);
    expect(result.current.presets).toHaveLength(MAX_PRESETS);
  });
});
