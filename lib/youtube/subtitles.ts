import type { Subtitle } from '@/types/subtitle';

export function parseSRT(srtContent: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const blocks = srtContent.trim().split('\n\n');

  blocks.forEach((block) => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const id = parseInt(lines[0], 10);
      const timeMatch = lines[1].match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/
      );

      if (timeMatch) {
        const startTime =
          parseInt(timeMatch[1]) * 3600 +
          parseInt(timeMatch[2]) * 60 +
          parseInt(timeMatch[3]) +
          parseInt(timeMatch[4]) / 1000;

        const endTime =
          parseInt(timeMatch[5]) * 3600 +
          parseInt(timeMatch[6]) * 60 +
          parseInt(timeMatch[7]) +
          parseInt(timeMatch[8]) / 1000;

        const text = lines.slice(2).join(' ');

        subtitles.push({ id, startTime, endTime, text });
      }
    }
  });

  return subtitles;
}

export async function loadSubtitlesFromYouTube(videoId: string): Promise<Subtitle[]> {
  try {
    const response = await fetch(`/api/subtitles?videoId=${videoId}`);
    const data = await response.json();
    console.log('API response:', data);

    if (data.subtitles && data.subtitles.length > 0) {
      return data.subtitles;
    }

    console.log('No subtitles in API response:', data.error || 'empty array');
    return [];
  } catch (error) {
    console.error('Failed to load subtitles from YouTube:', error);
    return [];
  }
}

export async function loadSubtitles(videoId: string): Promise<Subtitle[]> {
  // First try to load from local SRT file
  try {
    const response = await fetch(`/subtitles/${videoId}.srt`);
    if (response.ok) {
      const srtContent = await response.text();
      const subtitles = parseSRT(srtContent);
      if (subtitles.length > 0) {
        return subtitles;
      }
    }
  } catch {
    // Local file not found, continue to YouTube API
  }

  // Fall back to YouTube API
  return loadSubtitlesFromYouTube(videoId);
}
