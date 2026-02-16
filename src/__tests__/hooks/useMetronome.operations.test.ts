import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMetronome } from '@/hooks/useMetronome';

// AudioContext モック
vi.stubGlobal(
  'AudioContext',
  vi.fn(() => ({
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    createOscillator: vi.fn(() => ({
      frequency: { value: 0 },
      type: 'sine',
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    })),
  })),
);

describe('useMetronome - ユーザー操作シナリオ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BPM変更後に他の設定を変更してもBPMが保持される', () => {
    it('BPM変更後に拍をミュートしてもBPMが保持される', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(150));
      expect(result.current.config.bpm).toBe(150);

      act(() => result.current.toggleBeatAccent(1));
      expect(result.current.config.bpm).toBe(150);
      expect(result.current.config.beatPattern[1]).toBe('mute');
    });

    it('BPM変更後に拍子を変更してもBPMが保持される', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(200));
      act(() => result.current.setTimeSignature('3/4'));
      expect(result.current.config.bpm).toBe(200);
    });

    it('BPM変更後に音色を変更してもBPMが保持される', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(180));
      act(() => result.current.setSound('beep'));
      expect(result.current.config.bpm).toBe(180);
      expect(result.current.config.sound).toBe('beep');
    });

    it('BPM変更後にサイレント設定を変更してもBPMが保持される', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(160));
      act(() => result.current.setSilentConfig({ enabled: true }));
      expect(result.current.config.bpm).toBe(160);
      expect(result.current.config.silent.enabled).toBe(true);
    });

    it('BPM変更後にテンポランプ設定を変更してもBPMが保持される', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(120));
      act(() => result.current.setTempoRampConfig({ enabled: true, targetBpm: 180 }));
      expect(result.current.config.bpm).toBe(120);
      expect(result.current.config.tempoRamp.enabled).toBe(true);
    });
  });

  describe('複数設定を連続変更しても各値が保持される', () => {
    it('BPM・拍子・音色・ミュート・テンポランプを順番に変更', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(140));
      act(() => result.current.setTimeSignature('6/8'));
      act(() => result.current.setSound('wood'));
      act(() => result.current.setSilentConfig({ enabled: true, soundBars: 4 }));
      act(() => result.current.setTempoRampConfig({ enabled: true }));

      expect(result.current.config.bpm).toBe(140);
      expect(result.current.config.timeSignature).toBe('6/8');
      expect(result.current.config.sound).toBe('wood');
      expect(result.current.config.silent.enabled).toBe(true);
      expect(result.current.config.silent.soundBars).toBe(4);
      expect(result.current.config.tempoRamp.enabled).toBe(true);
    });

    it('拍パターンの複数拍をミュートしてもBPM・拍子が保持される', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(170));
      // normal → mute: strong→normal→mute で2回トグル
      // ただし2拍目は初期値normalなので1回でmuteに（normal→mute）ではなく
      // cycle: strong→normal→mute→strong なので normal→mute は1回
      act(() => result.current.toggleBeatAccent(1)); // normal → mute
      act(() => result.current.toggleBeatAccent(2)); // normal → mute

      expect(result.current.config.bpm).toBe(170);
      expect(result.current.config.beatPattern[1]).toBe('mute');
      expect(result.current.config.beatPattern[2]).toBe('mute');
    });
  });

  describe('applyConfig後も正常に設定変更できる', () => {
    it('プリセット適用後にBPMを変更できる', () => {
      const { result } = renderHook(() => useMetronome());

      const preset = {
        bpm: 90,
        timeSignature: '3/4' as const,
        beatPattern: ['strong' as const, 'normal' as const, 'normal' as const],
        sound: 'beep' as const,
        silent: { enabled: false, soundBars: 2, silentBars: 1 },
        tempoRamp: {
          enabled: false,
          mode: 'up' as const,
          targetBpm: 100,
          stepBpm: 5,
          everyBars: 4,
        },
      };

      act(() => result.current.applyConfig(preset));
      expect(result.current.config.bpm).toBe(90);

      act(() => result.current.setBpm(130));
      expect(result.current.config.bpm).toBe(130);
      // プリセットの他の値は保持
      expect(result.current.config.sound).toBe('beep');
      expect(result.current.config.timeSignature).toBe('3/4');
    });

    it('プリセット適用後に拍をミュートしてもBPMが保持される', () => {
      const { result } = renderHook(() => useMetronome());

      act(() => result.current.setBpm(200));
      act(() => result.current.toggleBeatAccent(0)); // strong → normal

      const snapshot = { ...result.current.config };
      act(() => result.current.applyConfig(snapshot));

      act(() => result.current.toggleBeatAccent(1)); // normal → mute
      expect(result.current.config.bpm).toBe(200);
    });
  });
});
