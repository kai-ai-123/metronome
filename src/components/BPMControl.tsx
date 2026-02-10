'use client';

interface BPMControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

const btnClass =
  'w-10 h-10 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-xl';

export function BPMControl({ bpm, onChange }: BPMControlProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* BPM数値 */}
      <div data-testid="bpm-value" className="text-6xl font-light text-gray-900 tabular-nums">
        {bpm}
      </div>
      <div className="text-sm text-gray-400 tracking-widest uppercase">BPM</div>

      {/* ボタン + スライダー */}
      <div className="flex items-center gap-2 w-full max-w-xs">
        <button
          onClick={() => onChange(bpm - 5)}
          className={btnClass}
          aria-label="BPMを5下げる"
        >
          «
        </button>
        <button
          onClick={() => onChange(bpm - 1)}
          className={btnClass}
          aria-label="BPMを1下げる"
        >
          ‹
        </button>

        <input
          data-testid="bpm-slider"
          type="range"
          min={30}
          max={300}
          value={bpm}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-gray-900"
        />

        <button
          onClick={() => onChange(bpm + 1)}
          className={btnClass}
          aria-label="BPMを1上げる"
        >
          ›
        </button>
        <button
          onClick={() => onChange(bpm + 5)}
          className={btnClass}
          aria-label="BPMを5上げる"
        >
          »
        </button>
      </div>
    </div>
  );
}
