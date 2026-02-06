import { getFeaturedProducts } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import { getProductImageUrl } from '@/lib/imageUrl';

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts(8);

  return (
    <section className="section">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="title-display text-3xl">Productos destacados</h2>
            <p className="text-textMuted">Curados para una experiencia premium.</p>
          </div>
          <Link href="/tienda" className="button-secondary">Ver todo</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product: any) => (
            <Link key={product.id} href={`/producto/${product.id}`} className="glass p-4 hover:shadow-glow transition-shadow">
              <div className="relative w-full h-48 bg-surface border border-line overflow-hidden">
                <Image
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-3 left-3 chip text-xs">{product.status}</span>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-text">{product.name}</h3>
                <p className="text-textMuted text-sm line-clamp-2">{product.description}</p>
                <p className="text-primary font-semibold mt-2">
                  {(product.price / 100).toFixed(2)} €
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
