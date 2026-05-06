import { ShieldCheck } from 'lucide-react';
import { AdminLoginForm } from '@/components/admin/AdminForms';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { redirectedFrom?: string };
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(108,99,255,0.16)] text-[var(--admin-accent)]">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.32em] text-[var(--admin-text-muted)]">AdvancedRetro</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--admin-text)]">Admin Login</h1>
          <p className="mt-2 text-sm text-[var(--admin-text-muted)]">Acceso restringido al equipo gestor.</p>
        </div>
        <AdminLoginForm redirectedFrom={searchParams?.redirectedFrom} />
      </div>
    </main>
  );
}
