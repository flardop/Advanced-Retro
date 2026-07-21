/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

const heroImage = new URL('../../public/images/retroville/retroville-cast-presentation.png', import.meta.url).toString();
const logoImage = new URL('../../public/images/retroville/retroville-logo.png', import.meta.url).toString();

export const runtime = 'edge';
export const alt = 'Retroville, serie animada original';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#04050b',
          color: '#f7f5ef',
          fontFamily: 'sans-serif',
        }}
      >
        <img
          src={heroImage}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(4,5,11,0.96) 0%, rgba(4,5,11,0.88) 42%, rgba(4,5,11,0.34) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '52px 58px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <img
                src={logoImage}
                alt=""
                style={{
                  width: '250px',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  letterSpacing: 6,
                  textTransform: 'uppercase',
                  color: '#8ad7ff',
                }}
              >
                Serie animada original
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: 'rgba(247,245,239,0.82)',
                textAlign: 'right',
              }}
            >
              advancedretro.es/retroville
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxWidth: '560px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 94,
                fontWeight: 900,
                letterSpacing: 4,
                lineHeight: 0.92,
                textTransform: 'uppercase',
              }}
            >
              RETROVILLE
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 36,
                lineHeight: 1.22,
                color: 'rgba(247,245,239,0.92)',
              }}
            >
              Humor oscuro, barrio, hardware olvidado y un reparto listo para presentarse como serie real.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {['NOX', 'Luna', 'Button Crew', 'Press Kit', 'Pitch'].map((item) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  padding: '12px 20px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.08)',
                  fontSize: 20,
                  color: '#f7f5ef',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
