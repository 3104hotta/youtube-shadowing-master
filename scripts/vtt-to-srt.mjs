#!/usr/bin/env node
// Convert a WebVTT file (YouTube auto-captions style) to SRT.
// Removes inline timing tags and merges the rolling-window duplicates
// that YouTube auto-captions emit.
//
// Usage: node scripts/vtt-to-srt.mjs <input.vtt> <output.srt>

import { readFileSync, writeFileSync } from 'fs';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('Usage: vtt-to-srt.mjs <input.vtt> <output.srt>');
  process.exit(1);
}

function clean(line) {
  return line
    .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '')
    .replace(/<\/?c[^>]*>/g, '')
    .replace(/align:start position:\d+%/g, '')
    .trim();
}

const vtt = readFileSync(inPath, 'utf8');
const lines = vtt.split('\n');

const cues = [];
let i = 0;
while (i < lines.length && !lines[i].includes('-->')) i++;
while (i < lines.length) {
  const m = lines[i].match(
    /(\d{2}:\d{2}:\d{2})\.(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2})\.(\d{3})/
  );
  if (!m) {
    i++;
    continue;
  }
  const start = `${m[1]},${m[2]}`;
  const end = `${m[3]},${m[4]}`;
  i++;
  const textLines = [];
  while (
    i < lines.length &&
    lines[i].trim() !== '' &&
    !lines[i].includes('-->')
  ) {
    const t = clean(lines[i]);
    if (t) textLines.push(t);
    i++;
  }
  const text = textLines.length ? textLines[textLines.length - 1] : '';
  if (text) cues.push({ start, end, text });
}

// Merge consecutive duplicate-text cues by extending end time.
const merged = [];
for (const c of cues) {
  const last = merged[merged.length - 1];
  if (last && last.text === c.text) {
    last.end = c.end;
  } else {
    merged.push({ ...c });
  }
}

const srt = merged
  .map((c, idx) => `${idx + 1}\n${c.start} --> ${c.end}\n${c.text}\n`)
  .join('\n');
writeFileSync(outPath, srt);
console.log(`${outPath}: ${merged.length} cues`);
