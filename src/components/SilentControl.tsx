'use client';

import { type SilentConfig } from '@/types/metronome';

interface SilentControlProps {
  config: SilentConfig;
  onChange: (update: Partial<SilentConfig>) => void;
}

export function SilentControl({ config, onChange }: SilentControlProps) {
  return (
    <div className="w-full">
      {/* ヘッダー: ラベル + ON/OFFトグル */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-xs text-gray-400 tracking-widest uppercase">
          小節ミュート
        </span>
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            config.enabled ? 'bg-gray-900' : 'bg-gray-300'
          }`}
          aria-label="小節ミュートの切り替え"
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
        <div className="flex items-center justify-center gap-6">
          {/* ON小節数 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-12">ON</span>
            <button
              onClick={() =>
                onChange({ soundBars: Math.max(1, config.soundBars - 1) })
              }
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              −
            </button>
            <span className="text-lg font-semibold w-6 text-center">
              {config.soundBars}
            </span>
            <button
              onClick={() =>
                onChange({ soundBars: Math.min(8, config.soundBars + 1) })
              }
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              +
            </button>
          </div>

          {/* MUTE小節数 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-12">MUTE</span>
            <button
              onClick={() =>
                onChange({ silentBars: Math.max(1, config.silentBars - 1) })
              }
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
            >
              −
            </button>
            <span className="text-lg font-semibold w-6 text-center">
              {config.silentBars}
            </span>
            <button
              onClick={() =>
                onChange({ silentBars: Math.min(8, config.silentBars + 1) })
              }
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
