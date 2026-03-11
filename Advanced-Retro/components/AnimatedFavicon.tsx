'use client';

import { useEffect } from 'react';

const FRAMES = ['/icons/favicon-frame-1.svg', '/icons/favicon-frame-2.svg', '/icons/favicon-frame-3.svg'];

function ensureFaviconLink(): HTMLLinkElement {
  let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export default function AnimatedFavicon() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;

    const link = ensureFaviconLink();
    let index = 0;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      link.href = `${FRAMES[index]}?v=${index}`;
      index = (index + 1) % FRAMES.length;
    };

    tick();
    const interval = window.setInterval(tick, 800);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
