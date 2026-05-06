import Link from 'next/link';
import { Bolt, Brush, LockKeyhole, Package, CreditCard, BarChart3, ChevronDown } from 'lucide-react';
import { StoreCreatorLeadForm } from '@/components/admin/AdminForms';

const features = [
  ['Rápido de configurar', 'Tu tienda lista en menos de 10 minutos', Bolt],
  ['Totalmente personalizable', 'Colores, fuentes, logo y más', Brush],
  ['Seguro y confiable', 'Powered by Supabase + Vercel', LockKeyhole],
  ['Gestión de productos', 'Añade, edita y organiza tu catálogo fácilmente', Package],
  ['Pagos integrados', 'Acepta pagos con Stripe desde el día uno', CreditCard],
  ['Analytics incluido', 'Entiende a tus clientes con datos en tiempo real', BarChart3],
] as const;

const pricing = [
  { name: 'Free', price: '€0/mes', detail: 'hasta 10 productos, soporte email' },
  { name: 'Pro', price: '€19/mes', detail: 'productos ilimitados, analytics, email marketing' },
  { name: 'Business', price: '€49/mes', detail: 'multi-usuario, API access, soporte prioritario' },
] as const;

const faq = [
  '¿Necesito saber programar?',
  '¿Puedo conectar Stripe desde el primer día?',
  '¿Se puede migrar desde otra plataforma?',
  '¿Incluye hosting y seguridad?',
  '¿Puedo personalizar la marca al 100%?',
];

export default function StoreCreatorPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-700">ShopBuilder by AdvancedRetro</p>
          <a href="#lead-form" className="rounded-full bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(79,70,229,0.24)]">Empieza gratis</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_560px] lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">Lanzamiento anticipado</p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">Crea tu tienda online en minutos</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">Sin código. Sin complicaciones. Con todo lo que necesitas para vender.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#lead-form" className="rounded-full bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_48px_rgba(79,70,229,0.24)]">Empieza gratis</a>
            <a href="#pricing" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700">Ver demo</a>
          </div>
        </div>

        <div className="rounded-[2.4rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.18),transparent_35%),white] p-6 shadow-[0_40px_90px_rgba(15,23,42,0.08)]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-3 rounded-[1.4rem] bg-slate-900 p-4 text-white">
                <div className="h-10 rounded-2xl bg-white/10" />
                <div className="h-10 rounded-2xl bg-white/10" />
                <div className="h-10 rounded-2xl bg-white/10" />
                <div className="h-24 rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(129,140,248,0.5),rgba(167,139,250,0.28))]" />
              </div>
              <div className="space-y-4 rounded-[1.6rem] bg-white p-4 shadow-[0_18px_34px_rgba(15,23,42,0.06)]">
                <div className="h-12 rounded-2xl bg-slate-100" />
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="h-24 rounded-[1.2rem] bg-indigo-100" />
                  <div className="h-24 rounded-[1.2rem] bg-violet-100" />
                  <div className="h-24 rounded-[1.2rem] bg-sky-100" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-44 rounded-[1.2rem] bg-slate-100" />
                  <div className="h-44 rounded-[1.2rem] bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([title, description, Icon]) => (
            <article key={title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
              <div className="inline-flex rounded-2xl bg-indigo-50 p-3 text-indigo-700"><Icon className="h-6 w-6" /></div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700">Pricing</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Planes claros para crecer sin fricción</h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricing.map((item) => (
            <article key={item.name} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_26px_60px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{item.name}</p>
              <p className="mt-6 text-5xl font-black text-slate-950">{item.price}</p>
              <p className="mt-4 text-sm text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-[2.4rem] border border-slate-200 bg-slate-50 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-700">FAQ</p>
          <div className="mt-6 divide-y divide-slate-200">
            {faq.map((question) => (
              <details key={question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-slate-950">
                  {question}
                  <ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-slate-600">Contenido de ejemplo para explicar este punto con calma, claridad y foco comercial.</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="lead-form" className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700">Sé el primero en saberlo</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Pide acceso anticipado</h2>
        </div>
        <StoreCreatorLeadForm />
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
        <p>© AdvancedRetro · <Link href="/" className="font-semibold text-slate-700">Volver a advancedretro.es</Link></p>
      </footer>
    </main>
  );
}
