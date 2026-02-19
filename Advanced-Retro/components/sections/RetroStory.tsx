export default function RetroStory() {
  return (
    <section className="section">
      <div className="container">
        <div className="glass p-8 sm:p-10 lg:p-12">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr] lg:items-center">
            <div>
              <p className="text-primary font-mono text-xs uppercase tracking-[0.14em]">Nuestra propuesta</p>
              <h2 className="title-display text-3xl mt-3">Cada cartucho tiene historia, y cada compra debe inspirar confianza.</h2>
              <p className="text-textMuted mt-4">
                ADVANCED RETRO está pensada para compra y reventa seria de videojuegos retro:
                transparencia en estado real, opciones para completar piezas y soporte cercano en todo el proceso.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-[rgba(10,19,31,0.74)] p-5 sm:p-6">
              <p className="text-xs text-textMuted uppercase tracking-[0.12em]">Compromiso de tienda</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex gap-2"><span className="text-primary">•</span><span>Inventario con stock visible y filtros útiles.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span>Gestión de encargos con chat privado verificado.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span>Marketplace comunidad con revisión antes de publicar.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
