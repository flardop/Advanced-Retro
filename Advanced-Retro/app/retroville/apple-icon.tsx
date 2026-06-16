import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function RetrovilleAppleIcon() {
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
            'radial-gradient(circle at 20% 20%, rgba(0,255,136,0.24), transparent 34%), radial-gradient(circle at 82% 18%, rgba(123,47,255,0.22), transparent 32%), linear-gradient(180deg, #06070d 0%, #11162a 100%)',
          borderRadius: 44,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: 36,
            border: '3px solid rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #ffd25d 0%, #ff9f1a 100%)',
            boxShadow: '0 14px 34px rgba(255,159,26,0.35)',
            border: '3px solid rgba(14,14,14,0.45)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 22,
              width: 12,
              height: 12,
              borderRadius: 999,
              background: '#1f1626',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 22,
              width: 12,
              height: 12,
              borderRadius: 999,
              background: '#1f1626',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 18,
              width: 36,
              height: 12,
              borderBottom: '6px solid #1f1626',
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
