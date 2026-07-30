import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          border: '6px solid #0D6B5B',
          color: '#8FE3D0',
          fontSize: 64,
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
