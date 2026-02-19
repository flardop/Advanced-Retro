export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container glass p-10 max-w-4xl space-y-6">
        <h1 className="title-display text-3xl">Política de privacidad</h1>
        <p className="text-textMuted">
          En ADVANCED RETRO tratamos tus datos para gestionar compras, soporte y seguridad de transacciones.
        </p>

        <div>
          <h2 className="text-xl font-semibold">1. Datos que recogemos</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Datos de cuenta: email, nombre, avatar y bio si los completas.</li>
            <li>Datos de pedido: productos, importes, estado y fechas.</li>
            <li>Datos de soporte: tickets, mensajes y publicaciones que envíes.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Finalidad</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Ejecutar el contrato de compra y envío.</li>
            <li>Prevenir fraude y abuso en pagos o publicaciones.</li>
            <li>Prestar soporte postventa y atención personalizada.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Conservación</h2>
          <p className="text-textMuted mt-2">
            Conservamos datos mientras exista relación comercial o durante los plazos legales exigibles.
            Puedes solicitar acceso, rectificación o supresión de tus datos cuando proceda.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Derechos</h2>
          <p className="text-textMuted mt-2">
            Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición y limitación
            escribiendo a soporte. Responderemos en el plazo legal aplicable.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Responsable y contacto</h2>
          <p className="text-textMuted mt-2">
            Responsable: ADVANCED RETRO. Contacto de privacidad: admin@advancedretro.es y
            atencionalcliente@advancedretro.es.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">6. Encargados del tratamiento</h2>
          <p className="text-textMuted mt-2">
            Utilizamos proveedores técnicos para operar la tienda (hosting, base de datos, pagos y correo).
            Solo tratamos datos necesarios para prestar el servicio.
          </p>
        </div>
      </div>
    </section>
  );
}
