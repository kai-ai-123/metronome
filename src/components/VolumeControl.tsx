'use client';

interface VolumeControlProps {
  volume: number;
  onChange: (volume: number) => void;
}

export function VolumeControl({ volume, onChange }: VolumeControlProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-4xl font-light text-gray-900 tabular-nums">
        {volume}
        <span className="text-sm text-gray-400 ml-1">%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full max-w-xs accent-gray-900"
      />
    </div>
  );
}
