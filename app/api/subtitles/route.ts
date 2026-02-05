import { NextRequest, NextResponse } from 'next/server';

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
}

interface SubtitleEntry {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  try {
    // Fetch the YouTube video page to extract caption data
    const videoPageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      }
    );

    const html = await videoPageResponse.text();

    // Extract captions data from the page
    const captionsMatch = html.match(/"captions":\s*(\{[^}]+\})/);
    if (!captionsMatch) {
      // Try alternative method - look for timedtext URL
      const timedTextMatch = html.match(
        /"captionTracks":\s*\[([^\]]+)\]/
      );

      if (!timedTextMatch) {
        return NextResponse.json(
          { error: 'No captions available for this video', subtitles: [] },
          { status: 200 }
        );
      }
    }

    // Extract caption tracks
    const captionTracksMatch = html.match(
      /"captionTracks":\s*(\[[^\]]+\])/
    );

    if (!captionTracksMatch) {
      return NextResponse.json(
        { error: 'No caption tracks found', subtitles: [] },
        { status: 200 }
      );
    }

    let captionTracks: CaptionTrack[];
    try {
      // Clean up the JSON string
      const cleanJson = captionTracksMatch[1]
        .replace(/\\u0026/g, '&')
        .replace(/\\"/g, '"');
      captionTracks = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse caption tracks', subtitles: [] },
        { status: 200 }
      );
    }

    // Find English captions (prefer manual over auto-generated)
    let selectedTrack = captionTracks.find(
      (track) => track.languageCode === 'en'
    );

    // If no English, try any available track
    if (!selectedTrack && captionTracks.length > 0) {
      selectedTrack = captionTracks[0];
    }

    if (!selectedTrack) {
      return NextResponse.json(
        { error: 'No suitable caption track found', subtitles: [] },
        { status: 200 }
      );
    }

    // Fetch the actual captions
    const captionUrl = selectedTrack.baseUrl + '&fmt=json3';
    const captionResponse = await fetch(captionUrl);
    const captionData = await captionResponse.json();

    // Parse captions into our subtitle format
    const subtitles: SubtitleEntry[] = captionData.events
      ?.filter((event: { segs?: unknown[] }) => event.segs)
      .map((event: { tStartMs: number; dDurationMs: number; segs: { utf8: string }[] }, index: number) => ({
        id: index + 1,
        startTime: event.tStartMs / 1000,
        endTime: (event.tStartMs + event.dDurationMs) / 1000,
        text: event.segs
          .map((seg: { utf8: string }) => seg.utf8)
          .join('')
          .replace(/\n/g, ' ')
          .trim(),
      }))
      .filter((sub: SubtitleEntry) => sub.text.length > 0) || [];

    return NextResponse.json({ subtitles });
  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtitles', subtitles: [] },
      { status: 200 }
    );
  }
}
