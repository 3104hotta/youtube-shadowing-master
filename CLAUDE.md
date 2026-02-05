# YouTube Shadowing Master - Development Guide for Claude Code

## Project Overview

**App Name**: YouTube Shadowing Master  
**Purpose**: Web application for English shadowing practice using YouTube videos  
**Target Users**: Intermediate to advanced English learners  
**Development Approach**: MVP (Minimum Viable Product) - frontend only

---

## Tech Stack

### Core
- **Framework**: Next.js 14.x (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand 4.x
- **YouTube Integration**: react-youtube 10.x
- **Icons**: lucide-react

### External APIs
- **YouTube IFrame Player API**: Video playback control
- **YouTube Data API v3**: Subtitle fetching (optional)
- **Web Speech API**: Browser-native speech recognition

### Deployment
- **Platform**: Vercel
- **Auto-deploy**: From main branch

---

## Project Structure

```
youtube-shadowing-app/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── player/
│   │   └── page.tsx            # Player page
│   └── favorites/
│       └── page.tsx            # Favorites list
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── player/
│   │   ├── YouTubePlayer.tsx
│   │   ├── PlayerControls.tsx
│   │   ├── SpeedControl.tsx
│   │   ├── RepeatControl.tsx
│   │   └── SubtitleDisplay.tsx
│   ├── shadowing/
│   │   ├── RecordButton.tsx
│   │   ├── SpeechRecognition.tsx
│   │   └── ComparisonView.tsx
│   ├── favorites/
│   │   ├── FavoriteButton.tsx
│   │   └── FavoriteList.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── lib/
│   ├── youtube/
│   │   ├── player.ts
│   │   └── subtitles.ts
│   ├── speech/
│   │   └── recognition.ts
│   └── storage/
│       └── localStorage.ts
├── hooks/
│   ├── useYouTubePlayer.ts
│   ├── useSpeechRecognition.ts
│   └── useFavorites.ts
├── store/
│   └── playerStore.ts
├── types/
│   ├── youtube.ts
│   ├── subtitle.ts
│   └── favorite.ts
├── data/
│   └── presetVideos.ts
└── public/
    └── subtitles/
```

---

## Type Definitions

### types/youtube.ts
```typescript
export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
}

export interface PresetVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnail: string;
}
```

### types/subtitle.ts
```typescript
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
```

### types/favorite.ts
```typescript
export interface FavoriteVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  addedAt: string;
}
```

---

## State Management (Zustand)

### store/playerStore.ts
```typescript
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
```

---

## Feature Implementation Details

### 1. YouTube Player Integration

#### hooks/useYouTubePlayer.ts
```typescript
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';

export function useYouTubePlayer(videoId: string) {
  const playerRef = useRef<YT.Player | null>(null);
  const { 
    setPlayer, 
    setIsPlaying, 
    setCurrentTime, 
    setDuration,
    repeatEnabled,
    repeatStart,
    repeatEnd,
    updateCurrentSubtitle
  } = usePlayerStore();

  useEffect(() => {
    // Time update interval
    const interval = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        setCurrentTime(currentTime);
        updateCurrentSubtitle();
        
        // Handle repeat
        if (repeatEnabled && repeatStart !== null && repeatEnd !== null) {
          if (currentTime >= repeatEnd) {
            playerRef.current.seekTo(repeatStart, true);
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [repeatEnabled, repeatStart, repeatEnd, setCurrentTime, updateCurrentSubtitle]);

  const onReady = (event: YT.PlayerEvent) => {
    playerRef.current = event.target;
    setPlayer(event.target);
    setDuration(event.target.getDuration());
  };

  const onStateChange = (event: YT.OnStateChangeEvent) => {
    const isPlaying = event.data === window.YT.PlayerState.PLAYING;
    setIsPlaying(isPlaying);
  };

  return { onReady, onStateChange, playerRef };
}
```

#### components/player/YouTubePlayer.tsx
```typescript
'use client';

import YouTube from 'react-youtube';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';

interface YouTubePlayerProps {
  videoId: string;
}

export function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const { onReady, onStateChange } = useYouTubePlayer(videoId);

  const opts = {
    height: '480',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="aspect-video w-full max-w-4xl mx-auto">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full"
      />
    </div>
  );
}
```

---

### 2. Player Controls

#### components/player/PlayerControls.tsx
```typescript
'use client';

import { usePlayerStore } from '@/store/playerStore';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export function PlayerControls() {
  const { player, isPlaying, currentTime, duration } = usePlayerStore();

  const handlePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleSkip = (seconds: number) => {
    if (!player) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    player.seekTo(newTime, true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg">
      {/* Progress bar */}
      <div className="w-full">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => {
            if (player) {
              player.seekTo(parseFloat(e.target.value), true);
            }
          }}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleSkip(-10)}
          className="p-2 hover:bg-gray-200 rounded-full"
          aria-label="Skip back 10 seconds"
        >
          <SkipBack size={24} />
        </button>
        
        <button
          onClick={handlePlayPause}
          className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>
        
        <button
          onClick={() => handleSkip(10)}
          className="p-2 hover:bg-gray-200 rounded-full"
          aria-label="Skip forward 10 seconds"
        >
          <SkipForward size={24} />
        </button>
      </div>
    </div>
  );
}
```

---

### 3. Speed Control

#### components/player/SpeedControl.tsx
```typescript
'use client';

import { usePlayerStore } from '@/store/playerStore';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export function SpeedControl() {
  const { playbackSpeed, setPlaybackSpeed } = usePlayerStore();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Speed:</label>
      <select
        value={playbackSpeed}
        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SPEED_OPTIONS.map((speed) => (
          <option key={speed} value={speed}>
            {speed}x
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

### 4. Repeat Control

#### components/player/RepeatControl.tsx
```typescript
'use client';

import { usePlayerStore } from '@/store/playerStore';
import { Repeat } from 'lucide-react';

export function RepeatControl() {
  const {
    currentTime,
    repeatEnabled,
    repeatStart,
    repeatEnd,
    setRepeat,
    toggleRepeat,
    clearRepeat,
  } = usePlayerStore();

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-100 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Repeat Section</h3>
        <button
          onClick={toggleRepeat}
          className={`p-2 rounded-full ${
            repeatEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
          disabled={repeatStart === null || repeatEnd === null}
        >
          <Repeat size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">Start</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{formatTime(repeatStart)}</span>
            <button
              onClick={() => setRepeat(currentTime, repeatEnd || currentTime + 10)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set A
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-600">End</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{formatTime(repeatEnd)}</span>
            <button
              onClick={() => setRepeat(repeatStart || currentTime - 10, currentTime)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set B
            </button>
          </div>
        </div>
      </div>

      {(repeatStart !== null || repeatEnd !== null) && (
        <button
          onClick={clearRepeat}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}
```

---

### 5. Subtitle Display

#### lib/youtube/subtitles.ts
```typescript
import type { Subtitle } from '@/types/subtitle';

export function parseSRT(srtContent: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const blocks = srtContent.trim().split('\n\n');

  blocks.forEach((block) => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const id = parseInt(lines[0], 10);
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      
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
```

#### components/player/SubtitleDisplay.tsx
```typescript
'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { Eye, EyeOff } from 'lucide-react';

export function SubtitleDisplay() {
  const { 
    subtitles, 
    currentSubtitle, 
    showSubtitles, 
    toggleSubtitles,
    player 
  } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentSubtitle && containerRef.current) {
      const element = containerRef.current.querySelector(`[data-id="${currentSubtitle.id}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSubtitle]);

  if (subtitles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No subtitles available for this video
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Subtitles</h3>
        <button
          onClick={toggleSubtitles}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Toggle subtitles"
        >
          {showSubtitles ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>

      {showSubtitles && (
        <div
          ref={containerRef}
          className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-2"
        >
          {subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              data-id={subtitle.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                currentSubtitle?.id === subtitle.id
                  ? 'bg-blue-100 border-l-4 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                if (player) {
                  player.seekTo(subtitle.startTime, true);
                }
              }}
            >
              <div className="text-xs text-gray-500 mb-1">
                {Math.floor(subtitle.startTime / 60)}:{(Math.floor(subtitle.startTime % 60)).toString().padStart(2, '0')}
              </div>
              <div className="text-sm">{subtitle.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 6. Speech Recognition

#### hooks/useSpeechRecognition.ts
```typescript
import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }
      
      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    isSupported 
  };
}
```

#### components/shadowing/RecordButton.tsx
```typescript
'use client';

import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface RecordButtonProps {
  onTranscript: (text: string) => void;
}

export function RecordButton({ onTranscript }: RecordButtonProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        onTranscript(transcript);
      }
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-red-600">
        Speech recognition is not supported in this browser. Please use Chrome or Edge.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleToggle}
        className={`p-6 rounded-full transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? <MicOff size={32} /> : <Mic size={32} />}
      </button>
      <span className="text-sm text-gray-600">
        {isListening ? 'Recording...' : 'Click to record'}
      </span>
    </div>
  );
}
```

#### components/shadowing/ComparisonView.tsx
```typescript
'use client';

interface ComparisonViewProps {
  originalText: string;
  recognizedText: string;
}

export function ComparisonView({ originalText, recognizedText }: ComparisonViewProps) {
  const calculateAccuracy = () => {
    if (!recognizedText) return 0;
    
    const originalWords = originalText.toLowerCase().split(/\s+/);
    const recognizedWords = recognizedText.toLowerCase().split(/\s+/);
    
    const matchedWords = originalWords.filter((word) =>
      recognizedWords.includes(word)
    );
    
    return Math.round((matchedWords.length / originalWords.length) * 100);
  };

  const accuracy = calculateAccuracy();

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Comparison</h3>
        <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Text</h4>
          <div className="p-3 bg-white border border-gray-300 rounded min-h-[100px]">
            {originalText || 'No subtitle selected'}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Speech</h4>
          <div className="p-3 bg-white border border-gray-300 rounded min-h-[100px]">
            {recognizedText || 'Start recording to see your speech'}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 7. Favorites Feature

#### hooks/useFavorites.ts
```typescript
import { useState, useEffect } from 'react';
import type { FavoriteVideo } from '@/types/favorite';

const STORAGE_KEY = 'shadowingApp_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse favorites:', error);
      }
    }
  }, []);

  const saveFavorites = (newFavorites: FavoriteVideo[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
  };

  const addFavorite = (video: Omit<FavoriteVideo, 'addedAt'>) => {
    const newFavorite: FavoriteVideo = {
      ...video,
      addedAt: new Date().toISOString(),
    };
    saveFavorites([...favorites, newFavorite]);
  };

  const removeFavorite = (videoId: string) => {
    saveFavorites(favorites.filter((f) => f.videoId !== videoId));
  };

  const isFavorite = (videoId: string) => {
    return favorites.some((f) => f.videoId === videoId);
  };

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
```

#### components/favorites/FavoriteButton.tsx
```typescript
'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  videoId: string;
  videoTitle: string;
  thumbnail: string;
}

export function FavoriteButton({ videoId, videoTitle, thumbnail }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorited = isFavorite(videoId);

  const handleToggle = () => {
    if (favorited) {
      removeFavorite(videoId);
    } else {
      addFavorite({ videoId, title: videoTitle, thumbnail });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors ${
        favorited
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart size={24} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
```

---

### 8. Preset Videos Data

#### data/presetVideos.ts
```typescript
import type { PresetVideo } from '@/types/youtube';

export const presetVideos: PresetVideo[] = [
  {
    id: '1',
    videoId: 'rLwn1NceBec',
    title: 'Friends - Pivot Scene',
    description: 'Classic sitcom scene for practicing casual English',
    category: 'sitcom',
    difficulty: 'intermediate',
    thumbnail: 'https://img.youtube.com/vi/rLwn1NceBec/mqdefault.jpg',
  },
  {
    id: '2',
    videoId: 'jNQXAC9IVRw',
    title: 'Steve Jobs Stanford Speech',
    description: 'Inspirational speech with clear pronunciation',
    category: 'speech',
    difficulty: 'intermediate',
    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg',
  },
  {
    id: '3',
    videoId: 'WPPPFqsECz0',
    title: 'The Social Network - Opening Scene',
    description: 'Fast-paced dialogue for advanced learners',
    category: 'movie',
    difficulty: 'advanced',
    thumbnail: 'https://img.youtube.com/vi/WPPPFqsECz0/mqdefault.jpg',
  },
  // Add more preset videos as needed
];
```

---

## Page Implementation

### app/page.tsx
```typescript
import Link from 'next/link';
import { presetVideos } from '@/data/presetVideos';
import { URLInputForm } from '@/components/home/URLInputForm';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          YouTube Shadowing Master
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Practice English shadowing with your favorite YouTube videos. 
          Improve your pronunciation, listening, and speaking skills.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Try with YouTube URL
        </h2>
        <URLInputForm />
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Videos
          </h2>
          <Link
            href="/favorites"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Favorites →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presetVideos.map((video) => (
            <Link
              key={video.id}
              href={`/player?v=${video.videoId}`}
              className="group"
            >
              <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {video.description}
                  </p>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {video.difficulty}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
```

### app/player/page.tsx
```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { YouTubePlayer } from '@/components/player/YouTubePlayer';
import { PlayerControls } from '@/components/player/PlayerControls';
import { SpeedControl } from '@/components/player/SpeedControl';
import { RepeatControl } from '@/components/player/RepeatControl';
import { SubtitleDisplay } from '@/components/player/SubtitleDisplay';
import { RecordButton } from '@/components/shadowing/RecordButton';
import { ComparisonView } from '@/components/shadowing/ComparisonView';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { usePlayerStore } from '@/store/playerStore';
import { loadSubtitlesFromFile } from '@/lib/youtube/subtitles';

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');
  const [recognizedText, setRecognizedText] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  
  const { setSubtitles, currentSubtitle } = usePlayerStore();

  useEffect(() => {
    if (videoId) {
      // Load subtitles
      loadSubtitlesFromFile(videoId).then((subs) => {
        setSubtitles(subs);
      });

      // Fetch video info
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        .then((res) => res.json())
        .then((data) => setVideoTitle(data.title))
        .catch(() => setVideoTitle('Unknown Video'));
    }
  }, [videoId, setSubtitles]);

  if (!videoId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">No video selected</h1>
        <p className="text-gray-600 mt-2">Please select a video from the home page.</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{videoTitle}</h1>
          <FavoriteButton
            videoId={videoId}
            videoTitle={videoTitle}
            thumbnail={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Player and controls */}
          <div className="lg:col-span-2 space-y-4">
            <YouTubePlayer videoId={videoId} />
            <PlayerControls />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SpeedControl />
              <RepeatControl />
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Shadowing Practice
              </h2>
              <div className="flex flex-col items-center gap-4">
                <RecordButton onTranscript={setRecognizedText} />
                <ComparisonView
                  originalText={currentSubtitle?.text || ''}
                  recognizedText={recognizedText}
                />
              </div>
            </div>
          </div>

          {/* Right column: Subtitles */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg border border-gray-200 sticky top-4">
              <SubtitleDisplay />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

## Development Instructions for Claude Code

### Initial Setup
```bash
# Create Next.js project
npx create-next-app@latest youtube-shadowing-app \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd youtube-shadowing-app

# Install dependencies
npm install react-youtube zustand lucide-react

# Create .env.local
echo "NEXT_PUBLIC_YOUTUBE_API_KEY=YOUR_API_KEY_HERE" > .env.local
```

### Implementation Order

1. **Setup type definitions** (`types/`)
2. **Create Zustand store** (`store/playerStore.ts`)
3. **Implement utilities** (`lib/`)
4. **Build custom hooks** (`hooks/`)
5. **Create components** (in order: common → player → shadowing → favorites)
6. **Build pages** (`app/`)
7. **Add preset data** (`data/presetVideos.ts`)
8. **Test all features**
9. **Deploy to Vercel**

### Important Notes

- Use `'use client'` directive for all interactive components
- Handle SSR carefully with browser-only APIs (Web Speech API)
- Implement proper error boundaries
- Add loading states for async operations
- Test on Chrome/Edge (best Web Speech API support)
- Ensure HTTPS for production (required for microphone access)

### Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Environment Variables on Vercel
Set in Project Settings → Environment Variables:
- `NEXT_PUBLIC_YOUTUBE_API_KEY`

---

## Testing Checklist

- [ ] YouTube player loads and plays correctly
- [ ] Play/pause/seek controls work
- [ ] Speed adjustment changes playback rate
- [ ] Repeat A-B loop functions properly
- [ ] Subtitles sync with video
- [ ] Subtitle click seeks to correct time
- [ ] Microphone permission requested
- [ ] Speech recognition captures audio
- [ ] Comparison shows accuracy score
- [ ] Favorites can be added/removed
- [ ] Favorites persist after page reload
- [ ] Responsive design on mobile
- [ ] Error handling for missing videos
- [ ] Error handling for missing subtitles

---

## Future Enhancements (Post-MVP)

- Backend integration (user authentication)
- Database for persistent user data
- Advanced speech analysis with AI
- Social features (sharing, leaderboards)
- Offline mode with cached videos
- Multiple language support
- Custom subtitle editing
- Progress tracking dashboard
