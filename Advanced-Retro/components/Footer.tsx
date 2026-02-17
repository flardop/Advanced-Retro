import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-line mt-20">
      <div className="container py-10 grid gap-8 md:grid-cols-4 text-sm text-textMuted">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="Advanced Retro"
              width={160}
              height={42}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="mt-2">
            Tienda premium de retro gaming y coleccionismo.
          </p>
        </div>
        <div>
          <p className="text-text">Tienda</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/tienda">Catálogo</Link></li>
            <li><Link href="/tienda?category=cajas-misteriosas">Mystery</Link></li>
            <li><Link href="/servicio-compra">Encargos 5€</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-text">Legal</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/terminos">Términos</Link></li>
            <li><Link href="/privacidad">Privacidad</Link></li>
            <li><Link href="/cookies">Cookies</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-text">Redes</p>
          <ul className="mt-2 space-y-1">
            <li>Instagram</li>
            <li>Twitter</li>
            <li>YouTube</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line text-xs text-textMuted py-4 text-center">
        © {new Date().getFullYear()} ADVANCED RETRO. Todos los derechos reservados.
      </div>
    </footer>
  );
}
