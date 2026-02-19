import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-[rgba(8,15,26,0.62)] backdrop-blur-sm">
      <div className="container py-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4 text-sm text-textMuted">
        <div className="space-y-4">
          <Link href="/" className="inline-block rounded-lg p-1 hover:bg-white/5">
            <Image
              src="/logo.png"
              alt="Advanced Retro"
              width={160}
              height={42}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <p>
            Tienda especializada en retro gaming, coleccionismo y restauración con enfoque profesional.
          </p>
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-primary font-semibold">Operación:</span> España
            </p>
            <p>
              <span className="text-primary font-semibold">Atención:</span> ticket privado comprador ↔ tienda
            </p>
          </div>
        </div>

        <div>
          <p className="text-text font-semibold">Tienda</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/tienda" className="hover:text-text">Catálogo completo</Link></li>
            <li><Link href="/tienda?category=platform:game-boy" className="hover:text-text">Game Boy</Link></li>
            <li><Link href="/tienda?category=platform:game-boy-color" className="hover:text-text">Game Boy Color</Link></li>
            <li><Link href="/tienda?category=platform:game-boy-advance" className="hover:text-text">Game Boy Advance</Link></li>
            <li><Link href="/tienda?category=platform:super-nintendo" className="hover:text-text">Super Nintendo</Link></li>
            <li><Link href="/tienda?category=platform:gamecube" className="hover:text-text">GameCube</Link></li>
            <li><Link href="/tienda?category=platform:consolas" className="hover:text-text">Consolas</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-text font-semibold">Servicios</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/tienda?category=cajas-misteriosas" className="hover:text-text">Mystery Box</Link></li>
            <li><Link href="/ruleta" className="hover:text-text">Ruleta</Link></li>
            <li><Link href="/servicio-compra" className="hover:text-text">Encargos 5€</Link></li>
            <li><Link href="/#comunidad" className="hover:text-text">Comunidad</Link></li>
            <li><Link href="/contacto" className="hover:text-text">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-text font-semibold">Legal</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/terminos" className="hover:text-text">Términos</Link></li>
            <li><Link href="/privacidad" className="hover:text-text">Privacidad</Link></li>
            <li><Link href="/cookies" className="hover:text-text">Cookies</Link></li>
          </ul>
          <div className="mt-5 rounded-xl border border-line p-3 text-xs leading-relaxed">
            <p className="text-text font-semibold">Compra segura</p>
            <p className="mt-1">Seguimiento de pedidos, soporte por ticket y estado de envío actualizado.</p>
            <p className="mt-1">
              Emails de contacto: <span className="text-text">admin@advancedretro.es</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line/80">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-textMuted">
          <p>© {new Date().getFullYear()} ADVANCED RETRO. Todos los derechos reservados.</p>
          <ul className="flex items-center gap-4">
            <li><Link href="/terminos" className="hover:text-text">Condiciones</Link></li>
            <li><Link href="/privacidad" className="hover:text-text">Privacidad</Link></li>
            <li><Link href="/cookies" className="hover:text-text">Cookies</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
