import { Globe, Camera, MessageCircle } from 'lucide-react';
import RetrovilleCountdown from '@/components/admin/RetrovilleCountdown';
import { RetrovilleWaitlistForm } from '@/components/admin/AdminForms';
import { getSettingsSnapshot } from '@/lib/admin/data';

export default async function RetrovillePage() {
  const settings = await getSettingsSnapshot();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.2),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,100%_4px] opacity-60" />
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.9), transparent), radial-gradient(2px 2px at 80% 20%, rgba(255,255,255,0.75), transparent), radial-gradient(3px 3px at 55% 80%, rgba(255,255,255,0.55), transparent), radial-gradient(2px 2px at 70% 60%, rgba(255,255,255,0.9), transparent)' }} />
      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center text-center">
          <p className="font-mono text-xs uppercase tracking-[0.5em] text-cyan-200/75">AdvancedRetro presenta</p>
          <h1 className="mt-6 font-mono text-4xl font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_0_26px_rgba(99,102,241,0.55)] sm:text-6xl">RETROVILLE</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">El universo retro que estás esperando.</p>
          <div className="mt-10 w-full">
            <RetrovilleCountdown target={settings.retrovilleLaunchDate} />
          </div>
          <RetrovilleWaitlistForm />
          <div className="mt-10 flex items-center gap-4 text-white/70">
            <a href="#" aria-label="Twitter/X" className="rounded-full border border-white/15 p-3 transition hover:bg-white/10"><Globe className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram" className="rounded-full border border-white/15 p-3 transition hover:bg-white/10"><Camera className="h-5 w-5" /></a>
            <a href="#" aria-label="Discord" className="rounded-full border border-white/15 p-3 transition hover:bg-white/10"><MessageCircle className="h-5 w-5" /></a>
          </div>
        </div>
        <p className="text-center text-xs uppercase tracking-[0.32em] text-white/45">© AdvancedRetro</p>
      </div>
    </main>
  );
}
