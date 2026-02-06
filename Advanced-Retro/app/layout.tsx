import type { Metadata } from 'next';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'ADVANCED RETRO — Premium Retro E-commerce',
  description: 'Tienda premium de retro gaming y coleccionismo.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'ADVANCED RETRO',
    description: 'Experiencia premium retro gaming.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#11131a',
              color: '#f5f7ff',
              border: '1px solid #24283a',
            },
          }}
        />
      </body>
    </html>
  );
}
