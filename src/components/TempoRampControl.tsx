'use client';

import { type TempoRampConfig, type TempoRampMode } from '@/types/metronome';

interface TempoRampControlProps {
  config: TempoRampConfig;
  currentBpm: number;
  onChange: (update: Partial<TempoRampConfig>) => void;
}

export function TempoRampControl({ config, currentBpm, onChange }: TempoRampControlProps) {
  const sign = config.mode === 'up' ? '+' : '-';

  const handleModeChange = (mode: TempoRampMode) => {
    onChange({ mode, targetBpm: currentBpm });
  };

  const handleTargetDown = () => {
    const next = config.targetBpm - 5;
    if (config.mode === 'up') {
      onChange({ targetBpm: Math.max(currentBpm, next) });
    } else {
      onChange({ targetBpm: Math.max(30, next) });
    }
  };

  const handleTargetUp = () => {
    const next = config.targetBpm + 5;
    if (config.mode === 'down') {
      onChange({ targetBpm: Math.min(currentBpm, next) });
    } else {
      onChange({ targetBpm: Math.min(300, next) });
    }
  };

  return (
    <div className="w-full">
      {/* ヘッダー: ラベル + ON/OFFトグル */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-xs text-gray-400 tracking-widest uppercase">
          テンポ変更
        </span>
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            config.enabled ? 'bg-gray-900' : 'bg-gray-300'
          }`}
          aria-label="テンポ変更の切り替え"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              config.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 設定パネル（有効時のみ表示） */}
      {config.enabled && (
        <div className="flex flex-col items-center gap-3">
          {/* UP / DOWN 切り替え */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => handleModeChange('up')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                config.mode === 'up'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              UP
            </button>
            <button
              onClick={() => handleModeChange('down')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                config.mode === 'down'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              DOWN
            </button>
          </div>

          {/* 到達BPM */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-20">到達BPM</span>
            <button
              onClick={handleTargetDown}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              −
            </button>
            <span className="text-lg font-semibold w-10 text-center">{config.targetBpm}</span>
            <button
              onClick={handleTargetUp}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              +
            </button>
          </div>

          {/* 変化量 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-20">変化量</span>
            <button
              onClick={() => onChange({ stepBpm: Math.max(1, config.stepBpm - 1) })}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              −
            </button>
            <span className="text-lg font-semibold w-10 text-center">{sign}{config.stepBpm}</span>
            <button
              onClick={() => onChange({ stepBpm: Math.min(20, config.stepBpm + 1) })}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              +
            </button>
          </div>

          {/* 何小節ごと */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-20">間隔</span>
            <button
              onClick={() => onChange({ everyBars: Math.max(1, config.everyBars - 1) })}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              −
            </button>
            <span className="text-lg font-semibold w-14 text-center whitespace-nowrap">{config.everyBars}小節</span>
            <button
              onClick={() => onChange({ everyBars: Math.min(16, config.everyBars + 1) })}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
