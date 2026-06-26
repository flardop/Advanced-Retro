export default function Head() {
  return (
    <>
      <meta name="theme-color" content="#06070d" />
      <style>{`
        :root { color-scheme: dark; }
        html, body { background: #06070d; }
        body { color: #f5f7ff; }
        .retroville-shell-initial {
          min-height: 100vh;
          background:
            radial-gradient(circle at 14% 12%, rgba(0,255,136,0.14), transparent 28%),
            radial-gradient(circle at 86% 18%, rgba(123,47,255,0.15), transparent 32%),
            linear-gradient(180deg, #06070d 0%, #11162a 100%);
        }
      `}</style>
    </>
  );
}
