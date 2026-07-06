import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import RetrovilleAdminLoginForm from '@/components/retroville/admin/RetrovilleAdminLoginForm';

export default function RetrovilleAdminAccessScreen({
  redirectedFrom,
}: {
  redirectedFrom?: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-[var(--admin-border)] bg-[rgba(192,57,43,0.12)]">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
              <Image
                src="/images/retroville/retroville-logo.png"
                alt="Retroville"
                fill
                className="object-contain"
                sizes="56px"
              />
            </div>
          </div>
          <p className="mt-5 text-[11px] uppercase tracking-[0.34em] text-[var(--admin-text-muted)]">
            Retroville Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">
            Acceso privado del creador
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--admin-text-muted)]">
            Panel exclusivo para controlar usuarios, analíticas, SEO, errores y contenido del universo.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-2 text-xs text-[var(--admin-text-muted)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sesión privada con cookie segura y expiración de 24 horas
          </div>
        </div>

        <RetrovilleAdminLoginForm redirectedFrom={redirectedFrom} />
      </div>
    </main>
  );
}
