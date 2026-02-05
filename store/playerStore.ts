import { create } from 'zustand';
import type { YTPlayer } from '@/types/youtube';
import type { Subtitle } from '@/types/subtitle';

interface PlayerState {
  // Player state
  player: YTPlayer | null;
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;

  // Repeat settings
  repeatEnabled: boolean;
  repeatStart: number | null;
  repeatEnd: number | null;

  // Subtitle state
  subtitles: Subtitle[];
  showSubtitles: boolean;
  currentSubtitle: Subtitle | null;

  // Actions
  setPlayer: (player: YTPlayer) => void;
  setVideoId: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setRepeat: (start: number, end: number) => void;
  toggleRepeat: () => void;
  clearRepeat: () => void;
  setSubtitles: (subtitles: Subtitle[]) => void;
  toggleSubtitles: () => void;
  updateCurrentSubtitle: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  videoId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1.0,

  repeatEnabled: false,
  repeatStart: null,
  repeatEnd: null,

  subtitles: [],
  showSubtitles: true,
  currentSubtitle: null,

  setPlayer: (player) => set({ player }),
  setVideoId: (id) => set({ videoId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setPlaybackSpeed: (speed) => {
    const { player } = get();
    if (player) {
      player.setPlaybackRate(speed);
    }
    set({ playbackSpeed: speed });
  },
  setRepeat: (start, end) => set({ repeatStart: start, repeatEnd: end }),
  toggleRepeat: () => set((state) => ({ repeatEnabled: !state.repeatEnabled })),
  clearRepeat: () => set({ repeatStart: null, repeatEnd: null, repeatEnabled: false }),
  setSubtitles: (subtitles) => set({ subtitles }),
  toggleSubtitles: () => set((state) => ({ showSubtitles: !state.showSubtitles })),
  updateCurrentSubtitle: () => {
    const { subtitles, currentTime } = get();
    const current = subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    set({ currentSubtitle: current || null });
  },
}));
