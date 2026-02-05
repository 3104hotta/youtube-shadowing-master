'use client';

import YouTube from 'react-youtube';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';

interface YouTubePlayerProps {
  videoId: string;
}

export function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const { onReady, onStateChange } = useYouTubePlayer();

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
