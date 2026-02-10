'use client';

import { useState } from 'react';
import { useMetronome } from '@/hooks/useMetronome';
import { usePresets } from '@/hooks/usePresets';
import { BPMControl } from './BPMControl';
import { TimeSignatureSelect } from './TimeSignatureSelect';
import { BeatPattern } from './BeatPattern';
import { SilentControl } from './SilentControl';
import { TempoRampControl } from './TempoRampControl';
import { PlayButton } from './PlayButton';
import { PresetModal } from './PresetModal';

export function Metronome() {
  const {
    config,
    isPlaying,
    currentBeat,
    setBpm,
    setTimeSignature,
    toggleBeatAccent,
    setSilentConfig,
    setTempoRampConfig,
    applyConfig,
    togglePlay,
  } = useMetronome();

  const { presets, savePreset, deletePreset, renamePreset } = usePresets();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4 py-8">
      {/* BPM表示 + コントロール */}
      <BPMControl bpm={config.bpm} onChange={setBpm} />

      {/* 再生/停止 */}
      <PlayButton isPlaying={isPlaying} onToggle={togglePlay} />

      {/* 拍子選択 */}
      <div className="w-full">
        <div className="text-xs text-gray-400 text-center mb-2 tracking-widest uppercase">
          拍子
        </div>
        <TimeSignatureSelect
          value={config.timeSignature}
          onChange={setTimeSignature}
        />
      </div>

      {/* 拍パターン */}
      <div className="w-full">
        <div className="text-xs text-gray-400 text-center mb-3">
          （タップで強弱切り替え）
        </div>
        <BeatPattern
          pattern={config.beatPattern}
          currentBeat={currentBeat}
          onToggle={toggleBeatAccent}
        />
      </div>

      {/* 小節ミュート */}
      <SilentControl
        config={config.silent}
        onChange={setSilentConfig}
      />

      {/* テンポ変更 */}
      <TempoRampControl
        config={config.tempoRamp}
        currentBpm={config.bpm}
        onChange={setTempoRampConfig}
      />

      {/* プリセット */}
      <div className="w-full">
        <div className="text-xs text-gray-400 text-center mb-2 tracking-widest uppercase">
          プリセット
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            呼び出し
          </button>
          <button
            onClick={() => {
              const name = window.prompt('プリセット名を入力');
              if (name?.trim()) {
                savePreset(name.trim(), config);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      {/* プリセットモーダル */}
      {isModalOpen && (
        <PresetModal
          presets={presets}
          currentConfig={config}
          onApply={applyConfig}
          onSave={savePreset}
          onDelete={deletePreset}
          onRename={renamePreset}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
