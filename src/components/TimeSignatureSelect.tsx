'use client';

import { type TimeSignature } from '@/types/metronome';

interface TimeSignatureSelectProps {
  value: TimeSignature;
  onChange: (ts: TimeSignature) => void;
}

const QUARTER_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '5/4'];
const EIGHTH_SIGNATURES: TimeSignature[] = ['3/8', '6/8', '9/8', '12/8'];

export function TimeSignatureSelect({ value, onChange }: TimeSignatureSelectProps) {
  const renderButton = (ts: TimeSignature) => (
    <button
      key={ts}
      onClick={() => onChange(ts)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${ts === value
          ? 'bg-gray-900 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
    >
      {ts}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        {QUARTER_SIGNATURES.map(renderButton)}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {EIGHTH_SIGNATURES.map(renderButton)}
      </div>
    </div>
  );
}
