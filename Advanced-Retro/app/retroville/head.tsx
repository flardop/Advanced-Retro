export default function Head() {
  return (
    <>
      <meta name="theme-color" content="#06070d" />
      <link rel="preload" as="image" href="/images/retroville/retroville-logo.webp" />
      <link rel="preload" as="image" href="/videos/retroville/retroville-city-approach-poster.jpg" />
      <link rel="preload" as="image" href="/images/retroville/nox-character-large.webp" />
      <link rel="preload" as="image" href="/images/retroville/luna-character-large.webp" />
      <link rel="preload" as="image" href="/images/retroville/button-crew-character-large.webp" />
      <style>{`
        :root { color-scheme: dark; }
        html, body { background: #06070d; }
        body { color: #f5f7ff; }
      `}</style>
    </>
  );
}
