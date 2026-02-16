'use client';

import { type SoundType, SOUND_TYPES } from '@/types/metronome';

interface SoundSelectProps {
  value: SoundType;
  onChange: (sound: SoundType) => void;
}

export function SoundSelect({ value, onChange }: SoundSelectProps) {
  return (
    <div data-testid="sound-select" className="grid grid-cols-2 gap-2">
      {SOUND_TYPES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${
              id === value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
