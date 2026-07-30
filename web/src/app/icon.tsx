import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: '#141C29',
          border: '2px solid #0D6B5B',
          color: '#8FE3D0',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'ui-monospace, Menlo, monospace',
          letterSpacing: '0.04em',
        }}
      >
        NT
      </div>
    ),
    { ...size },
  );
}
