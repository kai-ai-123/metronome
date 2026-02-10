'use client';

import type { BeatAccent } from '@/types/metronome';

interface BeatPatternProps {
  pattern: BeatAccent[];
  currentBeat: number;
  onToggle: (index: number) => void;
}

const ACCENT_STYLES: Record<BeatAccent, { size: string; bg: string }> = {
  strong: { size: 'w-12 h-12', bg: 'bg-gray-900' },
  normal: { size: 'w-10 h-10', bg: 'bg-gray-400' },
  mute:   { size: 'w-10 h-10', bg: 'bg-gray-200' },
};

export function BeatPattern({ pattern, currentBeat, onToggle }: BeatPatternProps) {
  return (
    <div className="flex justify-center items-end gap-3">
      {pattern.map((accent, i) => {
        const style = ACCENT_STYLES[accent];
        const isActive = i === currentBeat;

        return (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className={`${style.size} ${style.bg} rounded-full transition-all active:scale-90
                       ${isActive ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}`}
            aria-label={`拍${i + 1}: ${accent}`}
          />
        );
      })}
    </div>
  );
}
