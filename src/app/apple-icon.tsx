import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Brieffy Apple Icon'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          backgroundImage: 'radial-gradient(ellipse at top, #18181b 0%, #09090b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 120,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        B<span style={{ color: '#3b82f6', marginLeft: 4 }}>.</span>
      </div>
    ),
    { ...size }
  )
}
