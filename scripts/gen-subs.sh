#!/usr/bin/env bash
# Generate SRT subtitles for YouTube videos.
#
# Strategy:
#   1. Try yt-dlp's official/auto captions (fast, no transcription needed).
#   2. Fall back to whisper.cpp transcription from the audio.
#
# Output: public/subtitles/{videoId}.srt
#
# Prerequisites (macOS):
#   brew install yt-dlp ffmpeg whisper-cpp
#
# Whisper model (default: base.en) is auto-downloaded to ~/.cache/whisper-cpp/.
# Override via WHISPER_MODEL env var (e.g. small.en, medium.en, large-v3).
#
# Usage:
#   scripts/gen-subs.sh VIDEO_ID [VIDEO_ID ...]
#   FORCE=1 scripts/gen-subs.sh VIDEO_ID            # overwrite existing
#   WHISPER_MODEL=small.en scripts/gen-subs.sh ...

set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: $0 VIDEO_ID [VIDEO_ID ...]" >&2
  exit 1
fi

for cmd in yt-dlp ffmpeg whisper-cli; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' not found. Install with: brew install yt-dlp ffmpeg whisper-cpp" >&2
    exit 1
  fi
done

MODEL="${WHISPER_MODEL:-base.en}"
MODEL_DIR="${HOME}/.cache/whisper-cpp"
MODEL_FILE="${MODEL_DIR}/ggml-${MODEL}.bin"

if [ ! -f "$MODEL_FILE" ]; then
  echo "Downloading whisper model: ${MODEL}"
  mkdir -p "$MODEL_DIR"
  curl -L --fail -o "$MODEL_FILE" \
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${MODEL}.bin"
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${REPO_ROOT}/public/subtitles"
mkdir -p "$OUT_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

for id in "$@"; do
  echo ""
  echo "=== $id ==="
  OUT_SRT="${OUT_DIR}/${id}.srt"
  if [ -f "$OUT_SRT" ] && [ "${FORCE:-0}" != "1" ]; then
    echo "skip: ${OUT_SRT} already exists (FORCE=1 to overwrite)"
    continue
  fi

  URL="https://www.youtube.com/watch?v=${id}"

  # --- Step 1: try official/auto captions via yt-dlp ---
  CAP_DIR="${TMP_DIR}/${id}-cap"
  mkdir -p "$CAP_DIR"
  if yt-dlp --write-sub --write-auto-sub --sub-lang en --skip-download \
      -o "${CAP_DIR}/%(id)s.%(ext)s" "$URL" >/dev/null 2>&1; then
    VTT=$(ls "${CAP_DIR}/${id}".en*.vtt 2>/dev/null | head -1 || true)
    if [ -n "$VTT" ]; then
      echo "Using YouTube captions: $(basename "$VTT")"
      node "${REPO_ROOT}/scripts/vtt-to-srt.mjs" "$VTT" "$OUT_SRT"
      echo "✓ wrote $OUT_SRT"
      continue
    fi
  fi

  # --- Step 2: whisper.cpp transcription ---
  echo "No captions found — transcribing audio with whisper (${MODEL})..."
  WAV="${TMP_DIR}/${id}.wav"
  yt-dlp -x --audio-format wav \
    --postprocessor-args "ffmpeg:-ar 16000 -ac 1" \
    -o "${TMP_DIR}/%(id)s.%(ext)s" "$URL" >/dev/null

  whisper-cli -m "$MODEL_FILE" -f "$WAV" -l en -osrt -of "${OUT_DIR}/${id}" >/dev/null
  rm -f "$WAV"
  echo "✓ wrote $OUT_SRT"
done

echo ""
echo "Done."
