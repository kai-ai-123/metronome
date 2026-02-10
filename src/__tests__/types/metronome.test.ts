import { describe, expect, it } from 'vitest';
import {
  type TimeSignature,
  getBeatCount,
  getBeatIntervalSec,
  getDefaultPattern,
  isCompoundMeter,
} from '@/types/metronome';

describe('getBeatCount', () => {
  const cases: [TimeSignature, number][] = [
    ['2/4', 2],
    ['3/4', 3],
    ['4/4', 4],
    ['5/4', 5],
    ['3/8', 3],
    ['6/8', 6],
    ['9/8', 9],
    ['12/8', 12],
  ];

  it.each(cases)('%s → %d', (ts, expected) => {
    expect(getBeatCount(ts)).toBe(expected);
  });
});

describe('isCompoundMeter', () => {
  it('/8系はtrue', () => {
    expect(isCompoundMeter('3/8')).toBe(true);
    expect(isCompoundMeter('6/8')).toBe(true);
    expect(isCompoundMeter('9/8')).toBe(true);
    expect(isCompoundMeter('12/8')).toBe(true);
  });

  it('/4系はfalse', () => {
    expect(isCompoundMeter('2/4')).toBe(false);
    expect(isCompoundMeter('3/4')).toBe(false);
    expect(isCompoundMeter('4/4')).toBe(false);
    expect(isCompoundMeter('5/4')).toBe(false);
  });
});

describe('getBeatIntervalSec', () => {
  it('4/4 BPM120 → 0.5秒', () => {
    expect(getBeatIntervalSec(120, '4/4')).toBeCloseTo(0.5);
  });

  it('4/4 BPM60 → 1秒', () => {
    expect(getBeatIntervalSec(60, '4/4')).toBeCloseTo(1.0);
  });

  it('6/8 BPM120 → 60/120/3 = 約0.1667秒', () => {
    expect(getBeatIntervalSec(120, '6/8')).toBeCloseTo(60 / 120 / 3);
  });

  it('3/8 BPM90 → 60/90/3', () => {
    expect(getBeatIntervalSec(90, '3/8')).toBeCloseTo(60 / 90 / 3);
  });
});

describe('getDefaultPattern', () => {
  it('4/4 → [strong, normal, normal, normal]', () => {
    expect(getDefaultPattern('4/4')).toEqual([
      'strong',
      'normal',
      'normal',
      'normal',
    ]);
  });

  it('3/4 → [strong, normal, normal]', () => {
    expect(getDefaultPattern('3/4')).toEqual(['strong', 'normal', 'normal']);
  });

  it('6/8 → 3拍ごとにstrong/normalとmute', () => {
    expect(getDefaultPattern('6/8')).toEqual([
      'strong',
      'mute',
      'mute',
      'normal',
      'mute',
      'mute',
    ]);
  });

  it('12/8 → 12拍パターン', () => {
    const pattern = getDefaultPattern('12/8');
    expect(pattern).toHaveLength(12);
    expect(pattern[0]).toBe('strong');
    expect(pattern[3]).toBe('normal');
    expect(pattern[6]).toBe('normal');
    expect(pattern[9]).toBe('normal');
  });

  it('返り値は新しい配列（参照が異なる）', () => {
    const a = getDefaultPattern('4/4');
    const b = getDefaultPattern('4/4');
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
