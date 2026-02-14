# rhythm-app 仕様書

<!-- 記載ルール: products/docs/SPEC_GUIDELINES.md を参照 -->

## 画面構成

### 画面一覧

現状は単一ページ構成（メトロノーム画面のみ）。

- エントリポイント: `app/page.tsx` → `components/Metronome.tsx`

### 画面遷移

```
[メトロノーム画面]
       │
       ├→ [設定モーダル]（拍子/音色/ミュート/テンポ変更）
       └→ [プリセットモーダル]（呼び出し）
```

---

## 画面詳細

### メトロノーム画面

`components/Metronome.tsx`

- BPMコントロール: 数値表示 + スライダー + ±1/±5ボタン（範囲: 30-300） → `components/BPMControl.tsx`
- 再生/停止ボタン: 大型トグルボタン → `components/PlayButton.tsx`
- 拍パターン: 拍ごとのインジケーター、タップで強/通常/無音を切り替え → `components/BeatPattern.tsx`
- 設定ボタングリッド（2×3）: 各ボタンタップでモーダル表示
  - 拍子 / 音色 / ミュート / テンポ変更 / プリセット呼び出し / プリセット保存
  - ミュート・テンポ変更はON時にボタン色反転（bg-gray-900）

### 設定モーダル

`components/SettingModal.tsx`（汎用モーダル）

- 拍子選択: 8種類（2/4, 3/4, 4/4, 5/4, 3/8, 6/8, 9/8, 12/8） → `components/TimeSignatureSelect.tsx`
- 音色選択: 4種類（クリック/ウッド/ビープ/ハイハット） → `components/SoundSelect.tsx`
- サイレント小節: ON/OFFトグル + 鳴る小節数(1-8) + 無音小節数(1-8) → `components/SilentControl.tsx`
- テンポランプ: ON/OFFトグル + UP/DOWN + 到達BPM + 変化量(±1-20) + 間隔(1-16小節) → `components/TempoRampControl.tsx`

### プリセットモーダル

`components/PresetModal.tsx`

- 保存済みプリセット一覧（最大10個）
- 各プリセット: 適用 / 名前変更 / 削除
- 閉じるボタン

---

## 機能仕様

### メトロノーム

ロジック: `hooks/useMetronome.ts` / 型定義: `types/metronome.ts`

| 機能 | 説明 |
|------|------|
| BPM設定 | 30-300の範囲でBPM設定 |
| 拍子選択 | 8種類の拍子に対応（4分音符系・8分音符系で拍間隔の計算が異なる） |
| 再生/停止 | Web Audio APIによるスケジューラベースの音声再生 |
| 拍パターン編集 | 各拍の強/通常/無音をタップで切り替え |
| 音色選択 | 4種類から選択。ウッド・ハイハットはmp3サンプルベース再生（`public/sounds/`） |
| サイレント小節 | 鳴る小節数・無音小節数のサイクルで自動ミュート |
| テンポランプ | N小節ごとにBPMを自動で段階変化（UP/DOWN） |

### プリセット

ロジック: `hooks/usePresets.ts` / 型定義: `types/preset.ts`

| 機能 | 説明 |
|------|------|
| 保存 | 現在のMetronomeConfig全体を名前付きで保存（最大10個、localStorage） |
| 呼び出し | 保存済みプリセットの設定を適用 |
| 名前変更 | プリセット名を変更 |
| 削除 | プリセットを削除 |

---

## データ保存

- 保存先: localStorage
- プリセット: キー `rhythmapp-presets`

---

## 技術構成

- Next.js + Vercel
- React 19
- Tailwind CSS 4
- Web Audio API（メトロノーム音声）
- Vitest（ユニットテスト）
- Playwright（E2Eテスト）
