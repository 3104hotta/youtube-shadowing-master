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
