import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="section">
      <div className="container glass p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="title-display text-3xl">¿Listo para tu próxima pieza retro?</h2>
          <p className="text-textMuted mt-2">Explora la colección premium de ADVANCED RETRO.</p>
        </div>
        <Link href="/tienda" className="button-primary">Entrar a la tienda</Link>
      </div>
    </section>
  );
}
