import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            'radial-gradient(circle at 20% 20%, rgba(0,255,136,0.18), transparent 26%), radial-gradient(circle at 80% 18%, rgba(123,47,255,0.3), transparent 30%), linear-gradient(180deg, #030303 0%, #0a0d16 100%)',
          color: '#f0f0f0',
          padding: '56px 68px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 28, letterSpacing: 6, textTransform: 'uppercase', color: '#00ff88' }}>
            AdvancedRetro Original Universe
          </div>
          <div style={{ fontSize: 24, color: '#d2d5df' }}>Launch Window · 10 Nov 2026</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 122, fontWeight: 800, letterSpacing: 6, textTransform: 'uppercase' }}>
            RETROVILLE
          </div>
          <div style={{ fontSize: 42, width: '76%', lineHeight: 1.2 }}>
            Una ciudad donde el hardware olvidado nunca se apagó del todo.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ padding: '14px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', fontSize: 24 }}>NOX</div>
            <div style={{ padding: '14px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', fontSize: 24 }}>BUTTON CREW</div>
          </div>
          <div style={{ fontSize: 24, color: '#d2d5df' }}>advancedretro.es/retroville</div>
        </div>
      </div>
    ),
    size
  );
}
