# YouTube Shadowing Master

YouTube 動画を使った英語シャドーイング練習用 Web アプリ。プリセット動画もしくは任意の YouTube URL を読み込んで、A-B 区間リピート・速度調整・字幕同期表示・音声認識による発話比較が行える。

## Tech Stack

- Next.js 14 (App Router, Static Export)
- TypeScript
- Tailwind CSS
- Zustand
- react-youtube (YouTube IFrame Player API)
- Web Speech API (ブラウザネイティブの音声認識)

## セットアップ

```bash
npm install
npm run dev
# http://localhost:3000
```

ビルド・本番起動:

```bash
npm run build
npm start
```

## 字幕について

字幕は `public/subtitles/{videoId}.srt` を**事前同梱**する方式。クライアントが直接静的ファイルを fetch するため、Vercel Serverless ランタイムに依存しない (詳細は #8)。

プリセット動画 (`data/presetVideos.ts`) は全て SRT を同梱済み。URL 入力で渡された未登録動画は字幕なしで再生のみ可能。

### 新しい動画の字幕を追加する

```bash
npm run gen:subs VIDEO_ID [VIDEO_ID ...]
```

スクリプトは 2 段階のフォールバックで SRT を生成する:

1. **yt-dlp** で YouTube の公式/自動字幕を取得 (高速、第一優先)
2. 取得できなければ **whisper.cpp** で音声を文字起こし

オプション:

```bash
FORCE=1 npm run gen:subs <id>                 # 既存ファイルを上書き
WHISPER_MODEL=small.en npm run gen:subs <id>  # 精度の高いモデルを使用
```

#### 前提ツール

```bash
brew install yt-dlp ffmpeg whisper-cpp
```

Whisper モデル (`base.en` 既定) は初回実行時に `~/.cache/whisper-cpp/` へ自動ダウンロードされる。

## ディレクトリ構成 (抜粋)

```
app/                  # Next.js App Router pages
components/           # UI コンポーネント
data/presetVideos.ts  # プリセット動画リスト
hooks/                # カスタムフック
lib/youtube/          # 字幕パース等のユーティリティ
public/subtitles/     # 同梱 SRT ファイル
scripts/gen-subs.sh   # 字幕生成スクリプト
store/playerStore.ts  # Zustand ストア
```

## デプロイ

Vercel への自動デプロイを想定。`main` ブランチへのマージで本番反映、PR ブランチで Preview デプロイが作成される。

## 既知の制約

- 音声認識 (Web Speech API) は Chrome / Edge での動作を想定
- マイクアクセスのため本番では HTTPS が必須
- ad-hoc な YouTube URL 入力動画は字幕表示なし (再生・速度調整・リピートは可能)
