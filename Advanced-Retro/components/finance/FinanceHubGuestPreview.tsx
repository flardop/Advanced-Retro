import {
  CalendarDays,
  ChevronRight,
  LogIn,
  ShieldAlert,
  Sparkles,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

type FinanceHubGuestPreviewProps = {
  loading?: boolean;
};

export default function FinanceHubGuestPreview({
  loading = false,
}: FinanceHubGuestPreviewProps) {
  return (
    <section className="section">
      <div className="container">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass rounded-[2rem] p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkles className="h-4 w-4" />
              AdvancedRetro · Finanzas
            </div>
            <h1 className="title-display mt-6 text-4xl sm:text-5xl">
              Tu agenda diaria, tus finanzas y tu progreso en un solo sitio.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-textMuted">
              He preparado este apartado para que cada usuario tenga su propio
              tablero privado aunque la ruta sea pública: rutinas repetibles,
              notas diarias, gastos e ingresos, seguimiento de activos, racha
              sin apostar y un feed personal para Apple o Google Calendar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?next=/finanzas"
                className="button-primary inline-flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </Link>
              <Link
                href="/creator"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:text-primary"
              >
                Ver el resto del universo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-5 text-sm leading-7 text-textMuted">
              {loading
                ? 'Preparando tu centro privado y sincronizando la capa interactiva…'
                : 'Cuando inicies sesión, cada tarea, nota, movimiento y objetivo quedará separado por usuario dentro de AdvancedRetro.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="glass rounded-[1.6rem] p-5">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text">
                  Productividad real
                </h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-textMuted">
                Rutinas recurrentes, cierre del día, notas tipo agenda y
                recordatorios para no dejarlo todo a medias.
              </p>
            </div>
            <div className="glass rounded-[1.6rem] p-5">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text">
                  Finanzas claras
                </h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-textMuted">
                Ingresos, gastos, patrimonio, crypto, categorías y gráficas
                útiles para detectar dónde se te va el dinero.
              </p>
            </div>
            <div className="glass rounded-[1.6rem] p-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text">
                  Racha y autocontrol
                </h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-textMuted">
                Seguimiento de recaídas, días limpios, recompensas por
                constancia y un sistema sencillo para darte aire sin engañarte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
