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
import { SoundSelect } from './SoundSelect';
import { PresetModal } from './PresetModal';
import { SettingModal } from './SettingModal';
import { SOUND_TYPES } from '@/types/metronome';

type ModalType =
  | 'timeSignature'
  | 'sound'
  | 'silent'
  | 'tempoRamp'
  | 'presetLoad'
  | 'presetSave'
  | null;

export function Metronome() {
  const {
    config,
    isPlaying,
    currentBeat,
    setBpm,
    setTimeSignature,
    toggleBeatAccent,
    setSound,
    setSilentConfig,
    setTempoRampConfig,
    applyConfig,
    togglePlay,
  } = useMetronome();

  const { presets, savePreset, deletePreset, renamePreset } = usePresets();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const soundLabel =
    SOUND_TYPES.find((s) => s.id === config.sound)?.label ?? config.sound;

  const settingButtons: {
    label: string;
    sub: string;
    modal: ModalType;
    active?: boolean;
    sameStyle?: boolean;
    action?: () => void;
  }[] = [
    { label: '拍子', sub: config.timeSignature, modal: 'timeSignature' },
    { label: '音色', sub: soundLabel, modal: 'sound' },
    {
      label: 'ミュート',
      sub: config.silent.enabled ? 'ON' : 'OFF',
      modal: 'silent',
      active: config.silent.enabled,
    },
    {
      label: 'テンポ変更',
      sub: config.tempoRamp.enabled ? 'ON' : 'OFF',
      modal: 'tempoRamp',
      active: config.tempoRamp.enabled,
    },
    { label: 'プリセット', sub: '呼び出し', modal: 'presetLoad', sameStyle: true },
    {
      label: 'プリセット',
      sub: '保存',
      modal: 'presetSave' as ModalType,
      sameStyle: true,
      action: () => {
        const name = window.prompt('プリセット名を入力');
        if (name?.trim()) {
          savePreset(name.trim(), config);
        }
      },
    },
  ];

  return (
    <div
      data-testid="metronome"
      className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 py-8"
    >
      {/* BPM表示 + コントロール */}
      <BPMControl bpm={config.bpm} onChange={setBpm} />

      {/* 再生/停止 */}
      <PlayButton isPlaying={isPlaying} onToggle={togglePlay} />

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

      {/* 設定ボタングリッド 2×2 */}
      <div className="w-full grid grid-cols-2 gap-2">
        {settingButtons.map((btn, i) => (
          <button
            key={`${btn.modal}-${i}`}
            onClick={() => {
              if (btn.action) {
                btn.action();
              } else {
                setActiveModal(btn.modal);
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-colors ${
              btn.active
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <span
              className={`text-xs font-medium ${btn.active ? 'text-white' : 'text-gray-900'}`}
            >
              {btn.label}
            </span>
            <span
              className={btn.sameStyle
                ? `text-xs font-medium ${btn.active ? 'text-white' : 'text-gray-900'}`
                : `text-[11px] ${btn.active ? 'text-gray-300' : 'text-gray-400'}`
              }
            >
              {btn.sub}
            </span>
          </button>
        ))}
      </div>

      {/* モーダル群 */}
      {activeModal === 'timeSignature' && (
        <SettingModal title="拍子" onClose={() => setActiveModal(null)}>
          <TimeSignatureSelect
            value={config.timeSignature}
            onChange={(ts) => {
              setTimeSignature(ts);
              setActiveModal(null);
            }}
          />
        </SettingModal>
      )}

      {activeModal === 'sound' && (
        <SettingModal title="音色" onClose={() => setActiveModal(null)}>
          <SoundSelect
            value={config.sound}
            onChange={(s) => {
              setSound(s);
              setActiveModal(null);
            }}
          />
        </SettingModal>
      )}

      {activeModal === 'silent' && (
        <SettingModal title="小節ミュート" onClose={() => setActiveModal(null)}>
          <SilentControl
            config={config.silent}
            onChange={setSilentConfig}
          />
        </SettingModal>
      )}

      {activeModal === 'tempoRamp' && (
        <SettingModal title="テンポ変更" onClose={() => setActiveModal(null)}>
          <TempoRampControl
            config={config.tempoRamp}
            currentBpm={config.bpm}
            onChange={setTempoRampConfig}
          />
        </SettingModal>
      )}

      {activeModal === 'presetLoad' && (
        <PresetModal
          presets={presets}
          currentConfig={config}
          onApply={applyConfig}
          onSave={savePreset}
          onDelete={deletePreset}
          onRename={renamePreset}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
