import localFont from 'next/font/local';

export const siteDisplayFont = localFont({
  src: '../public/fonts/site/sora-latin-var.woff2',
  weight: '600 800',
  style: 'normal',
  variable: '--font-display',
  display: 'swap',
});

export const siteBodyFont = localFont({
  src: '../public/fonts/site/manrope-latin-var.woff2',
  weight: '400 800',
  style: 'normal',
  variable: '--font-body',
  display: 'swap',
});

export const siteMonoFont = localFont({
  src: '../public/fonts/site/jetbrains-mono-latin-var.woff2',
  weight: '500 700',
  style: 'normal',
  variable: '--font-mono',
  display: 'swap',
});
