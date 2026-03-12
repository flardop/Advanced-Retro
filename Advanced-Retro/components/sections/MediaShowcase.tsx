'use client';

type LocalVideo = {
  label: string;
  src: string;
  poster?: string;
};

const INTRO_VIDEO_URL =
  'https://darrmonhygphreshbplz.supabase.co/storage/v1/object/public/public/media/advanced-retro-intro-v2.mp4';
const INTRO_POSTER_URL =
  'https://darrmonhygphreshbplz.supabase.co/storage/v1/object/public/public/media/intro-poster-v2.jpg';
const JINGLE_URL =
  'https://darrmonhygphreshbplz.supabase.co/storage/v1/object/public/public/media/advanced-retro-jingle.mp3';

const LOCAL_VIDEOS: LocalVideo[] = [
  {
    label: 'Intro Advanced Retro',
    src: INTRO_VIDEO_URL,
    poster: INTRO_POSTER_URL,
  },
];

export default function MediaShowcase() {
  return (
    <section className="section pt-2">
      <div className="container">
        <div className="glass p-4 sm:p-6 media-showcase-panel">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Media Experience</p>
              <h2 className="title-display mt-2 text-2xl sm:text-3xl">Intro y vídeos locales dentro de la tienda</h2>
              <p className="text-textMuted mt-2">
                Vídeo generado para la marca y reproducido localmente (sin YouTube).
              </p>
            </div>
          </div>

          <div className="grid gap-4">
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
                  poster={INTRO_POSTER_URL}
                >
                  <source src={INTRO_VIDEO_URL} type="video/mp4" />
                </video>
              </div>
              <div className="mt-3 rounded-lg border border-line bg-[rgba(6,14,24,0.7)] p-2">
                <p className="text-xs text-textMuted mb-1">Jingle retro (audio local)</p>
                <audio controls preload="metadata" className="w-full">
                  <source src={JINGLE_URL} type="audio/mpeg" />
                </audio>
              </div>
            </article>

            <article className="rounded-2xl border border-line bg-[rgba(8,16,28,0.82)] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold">Vídeos de catálogo (local)</p>
                <span className="chip text-[11px]">Local media</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {LOCAL_VIDEOS.map((video) => (
                  <div key={video.src} className="rounded-xl border border-line bg-[rgba(6,14,24,0.76)] p-2">
                    <p className="text-xs text-textMuted mb-2">{video.label}</p>
                    <video className="w-full rounded-lg border border-line" controls preload="metadata" poster={video.poster}>
                      <source src={video.src} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
