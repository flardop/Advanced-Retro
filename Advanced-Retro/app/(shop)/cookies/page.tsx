export default function CookiesPage() {
  return (
    <section className="section">
      <div className="container glass p-10 max-w-4xl space-y-6">
        <h1 className="title-display text-3xl">Política de cookies</h1>
        <p className="text-textMuted">
          Esta web utiliza cookies técnicas para el funcionamiento de la sesión y cookies de medición
          para mejorar la experiencia de compra.
        </p>

        <div>
          <h2 className="text-xl font-semibold">1. Tipos de cookies</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Cookies técnicas: inicio de sesión, carrito y seguridad.</li>
            <li>Cookies de preferencia: recordar ajustes del usuario.</li>
            <li>Cookies analíticas: entender uso y rendimiento del sitio.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Gestión</h2>
          <p className="text-textMuted mt-2">
            Puedes bloquear o eliminar cookies desde la configuración de tu navegador. Algunas funciones
            como login, carrito o seguimiento de pedidos pueden dejar de funcionar si desactivas cookies técnicas.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Contacto</h2>
          <p className="text-textMuted mt-2">Para dudas sobre cookies y privacidad, contacta a soporte desde la página de contacto.</p>
        </div>
      </div>
    </section>
  );
}
