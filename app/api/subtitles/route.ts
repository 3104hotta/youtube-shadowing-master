import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

interface SubtitleEntry {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

function parseVTT(vttContent: string): SubtitleEntry[] {
  const subtitles: SubtitleEntry[] = [];
  const lines = vttContent.split('\n');

  let id = 1;
  let i = 0;

  // Skip header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp line
    if (line.includes('-->')) {
      // Parse timestamp: 00:00:01.570 --> 00:00:07.510
      const match = line.match(
        /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
      );

      if (match) {
        const startTime =
          parseInt(match[1]) * 3600 +
          parseInt(match[2]) * 60 +
          parseInt(match[3]) +
          parseInt(match[4]) / 1000;

        const endTime =
          parseInt(match[5]) * 3600 +
          parseInt(match[6]) * 60 +
          parseInt(match[7]) +
          parseInt(match[8]) / 1000;

        // Collect text lines until empty line or next timestamp
        i++;
        const textLines: string[] = [];
        while (i < lines.length && lines[i].trim() && !lines[i].includes('-->')) {
          // Remove VTT tags like <00:00:07.720><c> and </c>
          let cleanText = lines[i]
            .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '')
            .replace(/<\/?c>/g, '')
            .replace(/align:start position:\d+%/g, '')
            .trim();

          if (cleanText && !cleanText.startsWith('[') && cleanText !== ' ') {
            textLines.push(cleanText);
          }
          i++;
        }

        const text = textLines.join(' ').trim();
        if (text && text.length > 0) {
          // Avoid duplicate consecutive entries
          const lastSubtitle = subtitles[subtitles.length - 1];
          if (!lastSubtitle || lastSubtitle.text !== text) {
            subtitles.push({
              id: id++,
              startTime,
              endTime,
              text,
            });
          }
        }
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return subtitles;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  // Validate videoId format to prevent command injection
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId format' }, { status: 400 });
  }

  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `yt-sub-${videoId}`);

  try {
    // Use yt-dlp to download subtitles
    const command = `yt-dlp --write-sub --write-auto-sub --sub-lang en --skip-download -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`;

    await execAsync(command, { timeout: 30000 });

    // Try to find the subtitle file
    const possibleFiles = [
      `${outputPath}.en.vtt`,
      `${outputPath}.en-orig.vtt`,
    ];

    let vttContent = '';
    for (const filePath of possibleFiles) {
      try {
        vttContent = await fs.readFile(filePath, 'utf-8');
        // Clean up the file
        await fs.unlink(filePath).catch(() => {});
        break;
      } catch {
        continue;
      }
    }

    if (!vttContent) {
      return NextResponse.json(
        { error: 'No subtitles found for this video', subtitles: [] },
        { status: 200 }
      );
    }

    const subtitles = parseVTT(vttContent);
    console.log('Fetched subtitles via yt-dlp:', subtitles.length, 'items');

    return NextResponse.json({ subtitles });
  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtitles', subtitles: [] },
      { status: 200 }
    );
  }
}
