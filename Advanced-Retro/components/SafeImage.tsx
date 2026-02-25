'use client';

import { useEffect, useMemo, useState } from 'react';
import Image, { type ImageProps } from 'next/image';

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string;
  fallbackSrc?: string;
};

function isSvgSource(value: string): boolean {
  const lower = String(value || '').toLowerCase();
  return lower.endsWith('.svg') || lower.includes('.svg?');
}

export default function SafeImage({
  src,
  fallbackSrc = '/placeholder.svg',
  alt,
  onError,
  unoptimized,
  ...props
}: SafeImageProps) {
  const initialSrc = useMemo(() => {
    const safeSrc = String(src || '').trim();
    return safeSrc || fallbackSrc;
  }, [src, fallbackSrc]);

  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
  }, [initialSrc]);

  const shouldBeUnoptimized = typeof unoptimized === 'boolean' ? unoptimized : isSvgSource(currentSrc);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={shouldBeUnoptimized}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
