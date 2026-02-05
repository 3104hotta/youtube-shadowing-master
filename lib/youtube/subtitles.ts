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

export async function loadSubtitlesFromFile(videoId: string): Promise<Subtitle[]> {
  try {
    const response = await fetch(`/subtitles/${videoId}.srt`);
    if (!response.ok) throw new Error('Subtitles not found');
    const srtContent = await response.text();
    return parseSRT(srtContent);
  } catch (error) {
    console.error('Failed to load subtitles:', error);
    return [];
  }
}
