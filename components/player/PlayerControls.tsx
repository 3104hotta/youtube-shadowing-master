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
