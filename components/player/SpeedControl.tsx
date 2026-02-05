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
