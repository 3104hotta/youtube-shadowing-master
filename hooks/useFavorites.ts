'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const saveFavorites = useCallback((newFavorites: FavoriteVideo[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
  }, []);

  const addFavorite = useCallback(
    (video: Omit<FavoriteVideo, 'addedAt'>) => {
      const newFavorite: FavoriteVideo = {
        ...video,
        addedAt: new Date().toISOString(),
      };
      saveFavorites([...favorites, newFavorite]);
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    (videoId: string) => {
      saveFavorites(favorites.filter((f) => f.videoId !== videoId));
    },
    [favorites, saveFavorites]
  );

  const isFavorite = useCallback(
    (videoId: string) => {
      return favorites.some((f) => f.videoId === videoId);
    },
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
