import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMetronome } from '@/hooks/useMetronome';

// AudioContext モック
const mockResume = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn();
const mockCreateOscillator = vi.fn(() => ({
  frequency: { value: 0 },
  type: 'sine',
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}));
const mockCreateGain = vi.fn(() => ({
  gain: {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
}));

vi.stubGlobal(
  'AudioContext',
  vi.fn(() => ({
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: mockResume,
    close: mockClose,
    createOscillator: mockCreateOscillator,
    createGain: mockCreateGain,
  })),
);

describe('useMetronome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態が正しい', () => {
    const { result } = renderHook(() => useMetronome());

    expect(result.current.config.bpm).toBe(100);
    expect(result.current.config.timeSignature).toBe('4/4');
    expect(result.current.config.beatPattern).toEqual([
      'strong',
      'normal',
      'normal',
      'normal',
    ]);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentBeat).toBe(-1);
  });

  it('setBpmでBPMを変更できる', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setBpm(140);
    });
    expect(result.current.config.bpm).toBe(140);
  });

  it('BPMは30〜300にクランプされる', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setBpm(10);
    });
    expect(result.current.config.bpm).toBe(30);

    act(() => {
      result.current.setBpm(500);
    });
    expect(result.current.config.bpm).toBe(300);
  });

  it('setTimeSignatureで拍子を変更するとビートパターンも更新される', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setTimeSignature('3/4');
    });
    expect(result.current.config.timeSignature).toBe('3/4');
    expect(result.current.config.beatPattern).toEqual([
      'strong',
      'normal',
      'normal',
    ]);
  });

  it('6/8に変更すると8分音符系パターンになる', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setTimeSignature('6/8');
    });
    expect(result.current.config.beatPattern).toEqual([
      'strong',
      'mute',
      'mute',
      'normal',
      'mute',
      'mute',
    ]);
  });

  it('toggleBeatAccentでアクセントが循環する', () => {
    const { result } = renderHook(() => useMetronome());

    // strong → normal
    act(() => {
      result.current.toggleBeatAccent(0);
    });
    expect(result.current.config.beatPattern[0]).toBe('normal');

    // normal → mute
    act(() => {
      result.current.toggleBeatAccent(0);
    });
    expect(result.current.config.beatPattern[0]).toBe('mute');

    // mute → strong
    act(() => {
      result.current.toggleBeatAccent(0);
    });
    expect(result.current.config.beatPattern[0]).toBe('strong');
  });

  it('setSilentConfigでサイレント設定を更新できる', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setSilentConfig({ enabled: true, soundBars: 3 });
    });
    expect(result.current.config.silent.enabled).toBe(true);
    expect(result.current.config.silent.soundBars).toBe(3);
    // 未指定のフィールドは元のまま
    expect(result.current.config.silent.silentBars).toBe(1);
  });

  it('setTempoRampConfigでテンポランプ設定を更新できる', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setTempoRampConfig({ enabled: true, targetBpm: 160 });
    });
    expect(result.current.config.tempoRamp.enabled).toBe(true);
    expect(result.current.config.tempoRamp.targetBpm).toBe(160);
  });

  it('applyConfigで全設定を一括適用できる', () => {
    const { result } = renderHook(() => useMetronome());

    const newConfig = {
      bpm: 180,
      timeSignature: '3/4' as const,
      beatPattern: ['strong' as const, 'mute' as const, 'normal' as const],
      silent: { enabled: true, soundBars: 4, silentBars: 2 },
      tempoRamp: {
        enabled: false,
        mode: 'down' as const,
        targetBpm: 60,
        stepBpm: 10,
        everyBars: 2,
      },
    };

    act(() => {
      result.current.applyConfig(newConfig);
    });
    expect(result.current.config).toEqual(newConfig);
  });
});
