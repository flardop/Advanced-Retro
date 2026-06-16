import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: '404 Retroville | Señal perdida en el universo',
  description: 'Ruta perdida dentro de Retroville. Vuelve a la landing oficial, explora personajes o sigue el proceso vivo del sketchbook.',
  robots: {
    index: false,
    follow: true,
  },
  category: 'entertainment',
  alternates: {
    canonical: '/retroville',
  },
  openGraph: {
    title: '404 Retroville | Señal perdida en el universo',
    description:
      'Ruta perdida dentro de Retroville. Vuelve a la landing oficial, explora personajes o sigue el proceso vivo del sketchbook.',
    images: [
      {
        url: '/images/retroville/retroville-street.png',
        width: 1200,
        height: 630,
        alt: 'Ruta perdida dentro del universo Retroville',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '404 Retroville | Señal perdida en el universo',
    description:
      'Ruta perdida dentro de Retroville. Vuelve a la landing oficial, explora personajes o sigue el proceso vivo del sketchbook.',
    images: ['/images/retroville/retroville-street.png'],
  },
};

export default function RetrovilleCatchAllPage() {
  notFound();
}
