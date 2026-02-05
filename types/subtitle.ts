export interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleTrack {
  language: string;
  url: string;
  subtitles: Subtitle[];
}
