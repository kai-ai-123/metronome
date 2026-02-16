'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMetronome } from '@/hooks/useMetronome';
import { usePresets } from '@/hooks/usePresets';
import { usePracticeTimer } from '@/hooks/usePracticeTimer';
import { BPMControl } from './BPMControl';
import { BeatPattern } from './BeatPattern';
import { PlayButton } from './PlayButton';
import { PracticeTimer } from './PracticeTimer';
import { SOUND_TYPES } from '@/types/metronome';

// モーダル系コンポーネントを遅延ロード（初回バンドルから分離）
const SettingModal = dynamic(() => import('./SettingModal').then(m => ({ default: m.SettingModal })), { ssr: false });
const PresetModal = dynamic(() => import('./PresetModal').then(m => ({ default: m.PresetModal })), { ssr: false });
const TimeSignatureSelect = dynamic(() => import('./TimeSignatureSelect').then(m => ({ default: m.TimeSignatureSelect })), { ssr: false });
const SoundSelect = dynamic(() => import('./SoundSelect').then(m => ({ default: m.SoundSelect })), { ssr: false });
const VolumeControl = dynamic(() => import('./VolumeControl').then(m => ({ default: m.VolumeControl })), { ssr: false });
const SilentControl = dynamic(() => import('./SilentControl').then(m => ({ default: m.SilentControl })), { ssr: false });
const TempoRampControl = dynamic(() => import('./TempoRampControl').then(m => ({ default: m.TempoRampControl })), { ssr: false });
const InstallPrompt = dynamic(() => import('./InstallPrompt').then(m => ({ default: m.InstallPrompt })), { ssr: false });

type ModalType =
  | 'timeSignature'
  | 'sound'
  | 'volume'
  | 'silent'
  | 'tempoRamp'
  | 'presetLoad'
  | 'timer'
  | null;

export function Metronome() {
  const {
    config,
    isPlaying,
    currentBeat,
    volume,
    setBpm,
    setTimeSignature,
    toggleBeatAccent,
    setSound,
    setVolume,
    setSilentConfig,
    setTempoRampConfig,
    applyConfig,
    togglePlay,
    stop: stopMetronome,
  } = useMetronome();

  const { presets, savePreset, deletePreset, renamePreset } = usePresets();

  // メトロノーム停止用refを先に用意（usePracticeTimerのonFinishで使う）
  const stopMetronomeRef = useRef(stopMetronome);
  stopMetronomeRef.current = stopMetronome;

  const handleTimerFinish = useCallback(() => {
    stopMetronomeRef.current();
  }, []);

  const timer = usePracticeTimer(handleTimerFinish);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [syncWithMetronome, setSyncWithMetronome] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // メトロノーム連動（timer.start/stopをrefで安定化し、不要な再実行を防止）
  const timerStartRef = useRef(timer.start);
  const timerStopRef = useRef(timer.stop);
  timerStartRef.current = timer.start;
  timerStopRef.current = timer.stop;

  const prevIsPlaying = useRef(isPlaying);
  useEffect(() => {
    if (!timerEnabled || !syncWithMetronome) {
      prevIsPlaying.current = isPlaying;
      return;
    }
    if (isPlaying && !prevIsPlaying.current) {
      timerStartRef.current();
    } else if (!isPlaying && prevIsPlaying.current) {
      timerStopRef.current();
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying, timerEnabled, syncWithMetronome]);

  const soundLabel =
    SOUND_TYPES.find((s) => s.id === config.sound)?.label ?? config.sound;

  const settingButtons: {
    label: string;
    sub: string;
    modal: ModalType;
    active?: boolean;
    sameStyle?: boolean;
  }[] = [
    { label: '拍子', sub: config.timeSignature, modal: 'timeSignature' },
    { label: '音色', sub: soundLabel, modal: 'sound' },
    { label: '音量', sub: `${volume}%`, modal: 'volume' },
    {
      label: 'ミュート切替',
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
    { label: 'プリセット', sub: '', modal: 'presetLoad', sameStyle: true },
  ];

  return (
    <div
      data-testid="metronome"
      className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 py-8"
    >
      {/* インストール案内 */}
      <InstallPrompt />

      {/* BPM表示 + コントロール */}
      <BPMControl bpm={config.bpm} onChange={setBpm} />

      {/* 再生/停止 */}
      <PlayButton isPlaying={isPlaying} onToggle={togglePlay} />

      {/* 拍パターン */}
      <div className="w-full">
        <BeatPattern
          pattern={config.beatPattern}
          currentBeat={currentBeat}
          onToggle={toggleBeatAccent}
        />
      </div>

      {/* 設定ボタングリッド 3×2 */}
      <div className="w-full grid grid-cols-3 gap-2">
        {settingButtons.map((btn, i) => (
          <button
            key={`${btn.modal}-${i}`}
            onClick={() => setActiveModal(btn.modal)}
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
            {btn.sub && (
              <span
                className={btn.sameStyle
                  ? `text-xs font-medium ${btn.active ? 'text-white' : 'text-gray-900'}`
                  : `text-[11px] ${btn.active ? 'text-gray-300' : 'text-gray-400'}`
                }
              >
                {btn.sub}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 練習タイマー: 設定ボタン + 時間表示の2列 */}
      <PracticeTimer
        enabled={timerEnabled}
        onToggleEnabled={() => setTimerEnabled((v) => !v)}
        mode={timer.mode}
        onModeChange={(m) => { timer.reset(); timer.setMode(m); }}
        targetMinutes={timer.targetMinutes}
        onTargetChange={(m) => { timer.reset(); timer.setTargetMinutes(m); }}
        syncWithMetronome={syncWithMetronome}
        onSyncChange={setSyncWithMetronome}
        timeDisplay={timer.timeDisplay}
        isRunning={timer.isRunning}
        isFinished={timer.isFinished}
        onStart={timer.start}
        onStop={timer.stop}
        onReset={timer.reset}
        showModal={activeModal === 'timer'}
        onOpenModal={() => setActiveModal('timer')}
        onCloseModal={() => setActiveModal(null)}
      />

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

      {activeModal === 'volume' && (
        <SettingModal title="音量" onClose={() => setActiveModal(null)}>
          <VolumeControl volume={volume} onChange={setVolume} />
        </SettingModal>
      )}

      {activeModal === 'silent' && (
        <SettingModal title="ミュート切替" onClose={() => setActiveModal(null)}>
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
