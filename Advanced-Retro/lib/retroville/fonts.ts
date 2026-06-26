import localFont from 'next/font/local';

export const retrovilleDisplayFont = localFont({
  src: [
    {
      path: '../../public/fonts/retroville/bebas-neue-latin.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
});

export const retrovilleMobileDisplayFont = localFont({
  src: [
    {
      path: '../../public/fonts/retroville/bebas-neue-latin.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
});

export const retrovilleBodyFont = localFont({
  src: [
    {
      path: '../../public/fonts/retroville/dm-sans-latin-var.woff2',
      weight: '100 1000',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
});

export const retrovilleMonoFont = localFont({
  src: [
    {
      path: '../../public/fonts/retroville/jetbrains-mono-latin.woff2',
      weight: '400 700',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
});
