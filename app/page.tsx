import Link from 'next/link';
import { presetVideos } from '@/data/presetVideos';
import { URLInputForm } from '@/components/home/URLInputForm';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          YouTube Shadowing Master
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Practice English shadowing with your favorite YouTube videos. Improve
          your pronunciation, listening, and speaking skills.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Try with YouTube URL
        </h2>
        <URLInputForm />
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Videos</h2>
          <Link
            href="/favorites"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Favorites →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presetVideos.map((video) => (
            <Link key={video.id} href={`/player?v=${video.videoId}`} className="group">
              <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {video.difficulty}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
