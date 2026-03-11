'use client';

import { useMemo, useState } from 'react';
import { parseVideoEmbed } from '@/lib/videoEmbed';

type FeaturedVideo = {
  label: string;
  url: string;
};

const FEATURED_VIDEOS: FeaturedVideo[] = [
  { label: 'Game Boy Collection Trailer', url: 'https://www.youtube.com/watch?v=e7wP0f4vT3Q' },
  { label: 'Nintendo GameCube Promo', url: 'https://www.youtube.com/watch?v=6M6samPEMpM' },
  { label: 'Super Nintendo Classics', url: 'https://www.youtube.com/watch?v=Gmpx4MjQxU4' },
];

export default function MediaShowcase() {
  const parsedVideos = useMemo(
    () =>
      FEATURED_VIDEOS.map((entry) => ({
        ...entry,
        embed: parseVideoEmbed(entry.url),
      })).filter((entry): entry is FeaturedVideo & { embed: NonNullable<ReturnType<typeof parseVideoEmbed>> } => Boolean(entry.embed)),
    []
  );
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const activeVideo = parsedVideos[activeVideoIndex] || null;

  return (
    <section className="section pt-2">
      <div className="container">
        <div className="glass p-4 sm:p-6 media-showcase-panel">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Media Experience</p>
              <h2 className="title-display mt-2 text-2xl sm:text-3xl">Intro y vídeos retro dentro de la tienda</h2>
              <p className="text-textMuted mt-2">
                Vídeo de apertura de marca + reproductor de tráilers sin sacar al usuario de la página.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-line bg-[rgba(8,16,28,0.82)] p-3">
              <p className="text-sm font-semibold mb-2">Intro Advanced Retro</p>
              <div className="overflow-hidden rounded-xl border border-line bg-black">
                <video
                  className="w-full h-auto"
                  autoPlay
                  muted
                  loop
                  controls
                  playsInline
                  preload="metadata"
                  poster="/images/hero/intro-poster.jpg"
                >
                  <source src="/media/advanced-retro-intro.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="mt-3 rounded-lg border border-line bg-[rgba(6,14,24,0.7)] p-2">
                <p className="text-xs text-textMuted mb-1">Jingle retro (audio local)</p>
                <audio controls preload="metadata" className="w-full">
                  <source src="/media/advanced-retro-jingle.mp3" type="audio/mpeg" />
                </audio>
              </div>
            </article>

            <article className="rounded-2xl border border-line bg-[rgba(8,16,28,0.82)] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold">Trailers destacados</p>
                <span className="chip text-[11px]">YouTube embed</span>
              </div>

              {parsedVideos.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-xl border border-line">
                    <div className="aspect-video w-full">
                      <iframe
                        src={activeVideo?.embed.embedUrl}
                        title={activeVideo?.label || 'Video destacado'}
                        className="h-full w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  <div className="mt-3 mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                    {parsedVideos.map((video, index) => {
                      const selected = index === activeVideoIndex;
                      return (
                        <button
                          key={`${video.embed.id}-${index}`}
                          type="button"
                          onClick={() => setActiveVideoIndex(index)}
                          className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition-colors ${
                            selected
                              ? 'border-primary bg-[rgba(75,228,214,0.14)] text-text'
                              : 'border-line bg-[rgba(9,16,28,0.8)] text-textMuted hover:border-primary/35'
                          }`}
                        >
                          {video.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-textMuted">No hay trailers configurados todavía.</p>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
