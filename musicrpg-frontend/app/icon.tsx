import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: 'linear-gradient(135deg, #b06ee0, #ff7eb3)',
          borderRadius: 112,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontSize: 220, lineHeight: 1 }}>🎵</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            letterSpacing: 2,
            fontFamily: 'sans-serif',
          }}
        >
          RPG
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
