import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 256,
  height: 256,
};
export const contentType = 'image/png';

export default function RetrovilleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 22% 20%, rgba(0,255,136,0.3), transparent 30%), radial-gradient(circle at 78% 18%, rgba(123,47,255,0.28), transparent 32%), linear-gradient(180deg, #06070d 0%, #11162a 100%)',
          borderRadius: 18,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 5,
            borderRadius: 16,
            border: '2px solid rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #ffd25d 0%, #ff9f1a 100%)',
            boxShadow: '0 10px 24px rgba(255,159,26,0.35)',
            border: '2px solid rgba(14,14,14,0.45)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 9,
              width: 5,
              height: 5,
              borderRadius: 999,
              background: '#1f1626',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 9,
              width: 5,
              height: 5,
              borderRadius: 999,
              background: '#1f1626',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              width: 14,
              height: 6,
              borderBottom: '3px solid #1f1626',
              borderRadius: 999,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            right: 7,
            bottom: 7,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            color: '#00ff88',
          }}
        >
          RV
        </div>
      </div>
    ),
    size
  );
}
