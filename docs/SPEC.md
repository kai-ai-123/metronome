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
       ├→ [インストール案内バナー]（初回のみ、閉じるとlocalStorageで非表示記憶）
       ├→ [設定モーダル]（拍子/音色/音量/ミュート切替/テンポ変更/タイマー）
       └→ [プリセットモーダル]
```

---

## 画面詳細

### メトロノーム画面

`components/Metronome.tsx`

- インストール案内バナー → `components/InstallPrompt.tsx`
  - Android: `beforeinstallprompt` イベントでインストールボタン表示
  - iOS: Safari共有ボタンからの手順案内テキスト表示
  - 閉じるとlocalStorage（キー: `install-prompt-dismissed`）で非表示記憶
  - スタンドアロン起動時は非表示
- BPMコントロール: 数値表示（右横にBPMラベル） + スライダー + ±1/±5ボタン → `components/BPMControl.tsx`
- 再生/停止ボタン: 大型トグルボタン → `components/PlayButton.tsx`
- 拍パターン: 拍ごとのインジケーター、タップで強/通常/無音を切り替え → `components/BeatPattern.tsx`
- 設定ボタングリッド（2×3）: 各ボタンタップでモーダル表示
  - 拍子 / 音色 / 音量 / ミュート切替 / テンポ変更 / プリセット
  - ミュート切替・テンポ変更はON時にボタン色反転（bg-gray-900）
  - プリセットボタンはラベルのみ（sub表示なし）
- 練習タイマー（設定グリッド下）: 設定ボタン + 再生・時間表示・リセットをflex中央揃え → `components/PracticeTimer.tsx`
  - タイマーON時: ボタン色反転、サブラベルにモード名（カウントアップ/カウントダウン）表示
  - タイマーOFF時: サブラベル「OFF」、右側は `--:--` のグレー表示
  - 時間表示: MM:SS（1時間以上はH:MM:SS）
  - 連動ON時: 再生ボタン無効化（薄く表示）、「メトロノーム連動中」テキスト表示
  - 初期状態: タイマーON、カウントアップモード、メトロノーム連動ON

### 設定モーダル

`components/SettingModal.tsx`（汎用モーダル）

- 拍子選択: 8種類（2/4, 3/4, 4/4, 5/4, 3/8, 6/8, 9/8, 12/8） → `components/TimeSignatureSelect.tsx`
- 音色選択: 4種類（クリック/ウッド/ビープ/ハイハット）、2×2グリッド → `components/SoundSelect.tsx`
- 音量: スライダー（0-100%） → `components/VolumeControl.tsx`
- サイレント小節: ON/OFFトグル + 鳴る小節数(1-8) + 無音小節数(1-8)。OFF時は設定を非活性グレー表示 → `components/SilentControl.tsx`
- テンポランプ: ON/OFFトグル + UP/DOWN + 到達BPM + 変化量(±1-20) + 間隔(1-16小節)。OFF時は設定を非活性グレー表示 → `components/TempoRampControl.tsx`
- タイマー: ON/OFFトグル + モード切替（カウントアップ/カウントダウン） + カウントダウン時は目標時間(5/10/15/20/30/45/60分) + メトロノーム連動ON/OFF。OFF時は設定を非活性グレー表示 → `components/PracticeTimer.tsx`

### プリセットモーダル

`components/PresetModal.tsx`

- 保存済みプリセット一覧（最大10個）
- 各プリセット: 適用 / 名前変更 / 削除（内容表示: `100BPM · 4/4`）
- 保存: 現在の設定（BPM/拍子/拍パターン/音色/音量/サイレント/テンポランプ）を名前付きで保存
- 入力フィールドは `text-base`（16px）でiOS自動ズーム防止
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
| 音量 | 0-100%、MasterGainNodeで制御 |
| サイレント小節 | 鳴る小節数・無音小節数のサイクルで自動ミュート |
| テンポランプ | N小節ごとにBPMを自動で段階変化（UP/DOWN） |

### プリセット

ロジック: `hooks/usePresets.ts` / 型定義: `types/preset.ts`

| 機能 | 説明 |
|------|------|
| 保存 | 現在のMetronomeConfig全体（音量含む）を名前付きで保存（最大10個、localStorage） |
| 呼び出し | 保存済みプリセットの設定を適用（音量も復元） |
| 名前変更 | プリセット名を変更 |
| 削除 | プリセットを削除 |
| 後方互換 | 古いプリセット（sound/volumeなし）にデフォルト値を補完 |

### 練習タイマー

ロジック: `hooks/usePracticeTimer.ts` / 型定義: `types/timer.ts`

| 機能 | 説明 |
|------|------|
| カウントアップ | 経過時間を計測（MM:SS、1時間以上はH:MM:SS） |
| カウントダウン | 目標時間から逆算、0到達で完了 |
| 目標時間設定 | 5/10/15/20/30/45/60分から選択（カウントダウン時のみ） |
| メトロノーム連動 | ON時、メトロノーム再生/停止にタイマーを連動。停止→再開時は経過時間を加算継続。再生ボタン無効化 |
| 完了通知 | カウントダウン終了時にNotification APIでブラウザ通知 |
| リセット | 経過時間を0にリセット |

---

## 定数・初期値

### メトロノーム（`hooks/useMetronome.ts`）

| 定数 | 値 | 説明 |
|------|------|------|
| `SCHEDULE_AHEAD` | 0.1（秒） | 先読みスケジュール時間 |
| `TIMER_INTERVAL` | 25（ms） | スケジューラチェック間隔 |
| BPM初期値 | 100 | |
| BPM範囲 | 30-300 | |
| 拍子初期値 | 4/4 | |
| 音色初期値 | click | |
| 音量初期値 | 100（%） | |
| サイレント初期値 | OFF、鳴る2小節、無音1小節 | |
| テンポランプ初期値 | OFF、UP、目標100BPM、+5BPM、4小節ごと | |

### 練習タイマー（`hooks/usePracticeTimer.ts`）

| 定数 | 値 | 説明 |
|------|------|------|
| `MAX_SECONDS` | 35999（9:59:59） | 表示上限、超えたら0にリセット |
| モード初期値 | カウントアップ（stopwatch） | |
| 目標時間初期値 | 30（分） | |
| メトロノーム連動初期値 | ON | |

### プリセット（`hooks/usePresets.ts`、`types/preset.ts`）

| 定数 | 値 | 説明 |
|------|------|------|
| `MAX_PRESETS` | 10 | 保存上限 |
| `STORAGE_KEY` | `rhythmapp-presets` | localStorageキー |

### インストール案内（`components/InstallPrompt.tsx`）

| 定数 | 値 | 説明 |
|------|------|------|
| `DISMISS_KEY` | `install-prompt-dismissed` | localStorageキー |

---

## データ保存

- 保存先: localStorage
- プリセット: キー `rhythmapp-presets`
- インストール案内非表示: キー `install-prompt-dismissed`

---

## PWA

| 項目 | 値 |
|------|------|
| Service Worker | Serwist（`app/sw.ts`） |
| マニフェスト | `app/manifest.ts`（Next.js自動検出） |
| アプリ名 | Metronome |
| display | standalone |
| theme_color / background_color | #ffffff |
| アイコン | `public/icons/icon-192x192.png`, `icon-512x512.png`, `apple-touch-icon.png`（仮デザイン） |
| OG画像 | `public/og-image.png`（1200x630） |
| オフライン | プリキャッシュ（HTML/JS/CSS/音源）+ ランタイムキャッシュ |
| iOS対応 | AudioContext webkitフォールバック、無音バッファ再生によるアンロック |

---

## 技術構成

- Next.js 16 + Vercel（webpack モード、Serwist要件）
- React 19
- Tailwind CSS 4
- Web Audio API（メトロノーム音声）
- Serwist（Service Worker / PWA）
- Vitest（ユニットテスト、e2eフォルダは除外設定）
- Playwright（E2Eテスト）

### デプロイ

- ホスティング: Vercel
- URL: `https://metronome-app-online.vercel.app`
- GitHubリポジトリ: `kai-ai-123/metronome`
- 自動デプロイ: mainブランチへのpushでトリガー
