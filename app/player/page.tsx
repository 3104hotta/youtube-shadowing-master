'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { YouTubePlayer } from '@/components/player/YouTubePlayer';
import { PlayerControls } from '@/components/player/PlayerControls';
import { SpeedControl } from '@/components/player/SpeedControl';
import { RepeatControl } from '@/components/player/RepeatControl';
import { SubtitleDisplay } from '@/components/player/SubtitleDisplay';
import { RecordButton } from '@/components/shadowing/RecordButton';
import { ComparisonView } from '@/components/shadowing/ComparisonView';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { usePlayerStore } from '@/store/playerStore';
import { loadSubtitles } from '@/lib/youtube/subtitles';
import Link from 'next/link';

function PlayerContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');
  const [recognizedText, setRecognizedText] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const { setSubtitles, currentSubtitle } = usePlayerStore();

  useEffect(() => {
    if (videoId) {
      // Load subtitles from YouTube
      loadSubtitles(videoId).then((subs) => {
        setSubtitles(subs);
      });

      // Fetch video info
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        .then((res) => res.json())
        .then((data) => setVideoTitle(data.title || 'Unknown Video'))
        .catch(() => setVideoTitle('Unknown Video'));
    }
  }, [videoId, setSubtitles]);

  if (!videoId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">No video selected</h1>
        <p className="text-gray-600 mt-2">Please select a video from the home page.</p>
        <Link href="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{videoTitle}</h1>
          </div>
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

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}>
      <PlayerContent />
    </Suspense>
  );
}
