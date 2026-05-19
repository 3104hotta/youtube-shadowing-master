import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
// @ts-expect-error -- youtube-captions-scraper has no type definitions
import { getSubtitles } from 'youtube-captions-scraper';

interface SubtitleEntry {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

// youtube-transcript returns text with HTML entities encoded
// (e.g. "don&amp;#39;t" instead of "don't"). Decode the common cases.
function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&'); // ampersand LAST to avoid double-decoding
}

// Primary: youtube-transcript
// Strict language matching but simple API.
async function fetchViaYoutubeTranscript(
  videoId: string
): Promise<SubtitleEntry[]> {
  const items = await YoutubeTranscript.fetchTranscript(videoId, {
    lang: 'en',
  });
  return items
    .map((it, i) => ({
      id: i + 1,
      startTime: it.offset,
      endTime: it.offset + it.duration,
      text: decodeHtmlEntities(it.text).trim(),
    }))
    .filter((s) => s.text.length > 0);
}

// Fallback: youtube-captions-scraper
// More lenient language matching (matches en-US, en-GB, a.en, etc.)
// and already decodes HTML entities internally via `he`.
interface RawCaption {
  start: string;
  dur: string;
  text: string;
}

async function fetchViaCaptionsScraper(
  videoId: string
): Promise<SubtitleEntry[]> {
  const items: RawCaption[] = await getSubtitles({
    videoID: videoId,
    lang: 'en',
  });
  return items
    .map((it, i) => {
      const start = parseFloat(it.start);
      const dur = parseFloat(it.dur);
      return {
        id: i + 1,
        startTime: start,
        endTime: start + dur,
        text: it.text.trim(),
      };
    })
    .filter((s) => s.text.length > 0);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  // Validate format (defense in depth, even though we no longer shell out).
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId format' }, { status: 400 });
  }

  // A: youtube-transcript
  try {
    const subtitles = await fetchViaYoutubeTranscript(videoId);
    if (subtitles.length > 0) {
      console.log(
        `[subtitles] youtube-transcript: ${subtitles.length} items for ${videoId}`
      );
      return NextResponse.json({ subtitles });
    }
  } catch (err) {
    console.warn(
      `[subtitles] youtube-transcript failed for ${videoId}:`,
      errorMessage(err)
    );
  }

  // B: youtube-captions-scraper (fallback)
  try {
    const subtitles = await fetchViaCaptionsScraper(videoId);
    if (subtitles.length > 0) {
      console.log(
        `[subtitles] youtube-captions-scraper: ${subtitles.length} items for ${videoId}`
      );
      return NextResponse.json({ subtitles });
    }
  } catch (err) {
    console.warn(
      `[subtitles] youtube-captions-scraper failed for ${videoId}:`,
      errorMessage(err)
    );
  }

  // Both providers failed or returned empty. Keep existing contract:
  // 200 + empty subtitles array so the client can show "no subtitles" UI.
  return NextResponse.json(
    { error: 'No subtitles found for this video', subtitles: [] },
    { status: 200 }
  );
}
