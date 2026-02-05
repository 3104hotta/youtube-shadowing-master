'use client';

import Link from 'next/link';
import { useFavorites } from '@/hooks/useFavorites';
import { Trash2 } from 'lucide-react';

export function FavoriteList() {
  const { favorites, removeFavorite } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No favorites yet.</p>
        <Link href="/" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Browse videos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((video) => (
        <div
          key={video.videoId}
          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <Link href={`/player?v=${video.videoId}`}>
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
          </Link>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/player?v=${video.videoId}`}
                className="font-semibold text-gray-900 hover:text-blue-600 flex-1"
              >
                {video.title}
              </Link>
              <button
                onClick={() => removeFavorite(video.videoId)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Remove from favorites"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Added {new Date(video.addedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
