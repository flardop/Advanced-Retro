export default function ContactPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="glass p-10">
            <h1 className="title-display text-3xl">Contacto</h1>
            <p className="text-textMuted mt-2">Escríbenos y respondemos en menos de 24h.</p>
            <div className="grid gap-4 mt-6">
              <input className="bg-transparent border border-line px-4 py-3" placeholder="Nombre" />
              <input className="bg-transparent border border-line px-4 py-3" placeholder="Email" />
              <textarea className="bg-transparent border border-line px-4 py-3" rows={5} placeholder="Mensaje" />
              <button className="button-primary">Enviar</button>
            </div>
          </div>
          <div className="glass p-10">
            <h2 className="title-display text-2xl">ADVANCED RETRO Studio</h2>
            <p className="text-textMuted mt-2">Atención especializada para coleccionistas.</p>
            <div className="mt-6 space-y-3 text-textMuted">
              <p>Email: hola@advancedretro.com</p>
              <p>Horario: Lun - Vie / 10:00 - 19:00</p>
              <p>Soporte: Envíos, autenticidad, garantías.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
