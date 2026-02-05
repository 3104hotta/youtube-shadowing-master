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
