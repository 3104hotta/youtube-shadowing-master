'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { Eye, EyeOff } from 'lucide-react';

export function SubtitleDisplay() {
  const { subtitles, currentSubtitle, showSubtitles, toggleSubtitles, player } =
    usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentSubtitle && containerRef.current) {
      const element = containerRef.current.querySelector(
        `[data-id="${currentSubtitle.id}"]`
      );
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
                {Math.floor(subtitle.startTime / 60)}:
                {Math.floor(subtitle.startTime % 60)
                  .toString()
                  .padStart(2, '0')}
              </div>
              <div className="text-sm">{subtitle.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
