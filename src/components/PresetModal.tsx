'use client';

import { useState } from 'react';
import { type MetronomeConfig } from '@/types/metronome';
import { type Preset, MAX_PRESETS } from '@/types/preset';

interface PresetModalProps {
  presets: Preset[];
  currentConfig: MetronomeConfig;
  onApply: (config: MetronomeConfig) => void;
  onSave: (name: string, config: MetronomeConfig) => boolean;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onClose: () => void;
}

export function PresetModal({
  presets,
  currentConfig,
  onApply,
  onSave,
  onDelete,
  onRename,
  onClose,
}: PresetModalProps) {
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleApply = (config: MetronomeConfig) => {
    onApply(config);
    onClose();
  };

  const handleSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    onSave(trimmed, currentConfig);
    setSaveName('');
    setIsSaving(false);
  };

  const handleRenameStart = (preset: Preset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
  };

  const handleRenameConfirm = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const isFull = presets.length >= MAX_PRESETS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold">プリセット</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* 一覧 */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {presets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              保存されたプリセットはありません
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {presets.map((preset) => (
                <li key={preset.id} className="flex items-center gap-2">
                  {/* プリセット本体（タップで適用） */}
                  {editingId === preset.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleRenameConfirm()
                        }
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-base"
                        autoFocus
                      />
                      <button
                        onClick={handleRenameConfirm}
                        className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(preset.config)}
                      className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                        {preset.name}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {preset.config.bpm}BPM · {preset.config.timeSignature}
                      </span>
                    </button>
                  )}

                  {/* 編集・削除 */}
                  {editingId !== preset.id && (
                    <>
                      <button
                        onClick={() => handleRenameStart(preset)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 text-xs"
                        aria-label="名前変更"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onDelete(preset.id)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-300 hover:text-red-400 text-xs"
                        aria-label="削除"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 保存エリア */}
        <div className="px-4 py-3 border-t border-gray-100">
          {isSaving ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="プリセット名を入力"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsSaving(false);
                  setSaveName('');
                }}
                className="px-2 py-2 text-sm text-gray-400 hover:text-gray-600"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSaving(true)}
              disabled={isFull}
              className="w-full py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isFull
                ? `上限（${MAX_PRESETS}個）に達しています`
                : '現在の設定を保存'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
