import type { TimerMode } from '@/types/timer';
import { SettingModal } from './SettingModal';

const TARGET_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

interface PracticeTimerProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  targetMinutes: number;
  onTargetChange: (minutes: number) => void;
  syncWithMetronome: boolean;
  onSyncChange: (sync: boolean) => void;
  timeDisplay: string;
  isRunning: boolean;
  isFinished: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  showModal: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

function timerSubLabel(enabled: boolean, mode: TimerMode): string {
  if (!enabled) return 'OFF';
  return mode === 'stopwatch' ? 'ストップウォッチ' : 'カウントダウン';
}

export function PracticeTimer({
  enabled,
  onToggleEnabled,
  mode,
  onModeChange,
  targetMinutes,
  onTargetChange,
  syncWithMetronome,
  onSyncChange,
  timeDisplay,
  isRunning,
  isFinished,
  onStart,
  onStop,
  onReset,
  showModal,
  onOpenModal,
  onCloseModal,
}: PracticeTimerProps) {
  const playDisabled = (mode === 'countdown' && isFinished) || syncWithMetronome;

  return (
    <>
      {/* 2列: 設定ボタン（左） + 時間表示（右） */}
      <div className="w-full grid grid-cols-[auto_1fr] gap-2" data-testid="practice-timer">
        {/* 設定ボタン */}
        <button
          onClick={onOpenModal}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-colors min-w-[72px] ${
            enabled
              ? 'bg-gray-900 text-white'
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <span className={`text-[11px] font-medium ${enabled ? 'text-white' : 'text-gray-900'}`}>
            練習タイマー
          </span>
          <span className={`text-[10px] ${enabled ? 'text-gray-300' : 'text-gray-400'}`}>
            {timerSubLabel(enabled, mode)}
          </span>
        </button>

        {/* 時間表示 + 操作 */}
        {enabled ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex items-center justify-center gap-3 w-full px-1">
              {/* 再生/停止 */}
              <button
                onClick={isRunning ? onStop : onStart}
                disabled={playDisabled}
                className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full transition-all ${
                  playDisabled
                    ? 'bg-gray-900/30 text-white cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-700 active:scale-95'
                }`}
                aria-label={isRunning ? 'タイマー停止' : 'タイマー開始'}
              >
                {isRunning ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="8,5 20,12 8,19" />
                  </svg>
                )}
              </button>

              {/* 時間 */}
              <span className={`text-2xl font-light tabular-nums text-center ${isFinished ? 'text-green-600' : 'text-gray-900'}`}>
                {timeDisplay}
              </span>

              {/* リセット */}
              <button
                onClick={onReset}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="タイマーリセット"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2v4h4" />
                  <path d="M2 6A6 6 0 1 1 3.5 11.5" />
                </svg>
              </button>
            </div>
            {syncWithMetronome && (
              <span className="text-[11px] text-gray-400 mt-1">メトロノーム連動中</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="text-3xl font-light tabular-nums text-gray-300">--:--</span>
          </div>
        )}
      </div>

      {/* 設定モーダル */}
      {showModal && (
        <SettingModal title="練習タイマー" onClose={onCloseModal}>
          <div className="flex flex-col gap-4">
            {/* ON/OFFトグル */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-gray-400 tracking-widest uppercase">
                {enabled ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={onToggleEnabled}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  enabled ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                aria-label="タイマーの切り替え"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 設定パネル */}
            <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
              {/* モード切り替え */}
              <div>
                <div className="text-xs text-gray-500 mb-2">モード</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['stopwatch', 'countdown'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => onModeChange(m)}
                      className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                        mode === m
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      {m === 'stopwatch' ? 'ストップウォッチ' : 'カウントダウン'}
                    </button>
                  ))}
                </div>
              </div>

              {/* カウントダウン時: 目標時間 */}
              {mode === 'countdown' && (
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2">目標時間</div>
                  <div className="grid grid-cols-4 gap-2">
                    {TARGET_OPTIONS.map((m) => (
                      <button
                        key={m}
                        onClick={() => onTargetChange(m)}
                        className={`py-2 rounded-lg text-sm transition-colors ${
                          targetMinutes === m
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        {m}分
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* メトロノーム連動 */}
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">メトロノーム連動</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSyncChange(true)}
                    className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                      syncWithMetronome
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => onSyncChange(false)}
                    className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                      !syncWithMetronome
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SettingModal>
      )}
    </>
  );
}
