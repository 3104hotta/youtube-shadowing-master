'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import type { YTPlayer } from '@/types/youtube';

// YouTube Player event types
interface YouTubePlayerEvent {
  target: YTPlayer;
}

interface YouTubeStateChangeEvent {
  data: number;
}

export function useYouTubePlayer() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setPlayer,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    repeatEnabled,
    repeatStart,
    repeatEnd,
    updateCurrentSubtitle,
  } = usePlayerStore();

  const onReady = useCallback(
    (event: YouTubePlayerEvent) => {
      setPlayer(event.target);
      setDuration(event.target.getDuration());
    },
    [setPlayer, setDuration]
  );

  const onStateChange = useCallback(
    (event: YouTubeStateChangeEvent) => {
      const isPlaying = event.data === 1; // YT.PlayerState.PLAYING = 1
      setIsPlaying(isPlaying);
    },
    [setIsPlaying]
  );

  useEffect(() => {
    const { player } = usePlayerStore.getState();

    intervalRef.current = setInterval(() => {
      if (player) {
        const currentTime = player.getCurrentTime();
        setCurrentTime(currentTime);
        updateCurrentSubtitle();

        // Handle repeat
        if (repeatEnabled && repeatStart !== null && repeatEnd !== null) {
          if (currentTime >= repeatEnd) {
            player.seekTo(repeatStart, true);
          }
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [repeatEnabled, repeatStart, repeatEnd, setCurrentTime, updateCurrentSubtitle]);

  return { onReady, onStateChange };
}
