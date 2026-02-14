'use client';

import { useCallback, useEffect, useState } from 'react';
import { type MetronomeConfig } from '@/types/metronome';
import { type Preset, MAX_PRESETS } from '@/types/preset';

const STORAGE_KEY = 'rhythmapp-presets';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function readFromStorage(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const presets: Preset[] = JSON.parse(raw);
    // 後方互換: soundフィールドがない古いプリセットにデフォルト値を補完
    return presets.map((p) => ({
      ...p,
      config: { ...{ sound: 'click' as const }, ...p.config },
    }));
  } catch {
    return [];
  }
}

function writeToStorage(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function usePresets() {
  const [presets, setPresets] = useState<Preset[]>([]);

  // SSR対策: クライアントでのみ読み込み
  useEffect(() => {
    setPresets(readFromStorage());
  }, []);

  const savePreset = useCallback(
    (name: string, config: MetronomeConfig): boolean => {
      const current = readFromStorage();
      if (current.length >= MAX_PRESETS) return false;
      const preset: Preset = { id: generateId(), name, config };
      const next = [...current, preset];
      writeToStorage(next);
      setPresets(next);
      return true;
    },
    [],
  );

  const deletePreset = useCallback((id: string) => {
    const next = readFromStorage().filter((p) => p.id !== id);
    writeToStorage(next);
    setPresets(next);
  }, []);

  const renamePreset = useCallback((id: string, name: string) => {
    const next = readFromStorage().map((p) =>
      p.id === id ? { ...p, name } : p,
    );
    writeToStorage(next);
    setPresets(next);
  }, []);

  return { presets, savePreset, deletePreset, renamePreset };
}
