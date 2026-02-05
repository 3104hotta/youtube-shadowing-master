'use client';

import Link from 'next/link';
import { FavoriteList } from '@/components/favorites/FavoriteList';

export default function FavoritesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
      </div>
      <FavoriteList />
    </main>
  );
}
