import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Brieffy - Smart Briefing AI'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a', // fallback
          backgroundImage: 'radial-gradient(ellipse at top, #141414 0%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 140, fontWeight: 800, letterSpacing: '-0.05em' }}>
          Brieffy<span style={{ color: '#ff6029' }}>.</span>
        </div>
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 500, color: '#a1a1aa', marginTop: 24, letterSpacing: '-0.02em' }}>
          Smart Briefing AI
        </div>
      </div>
    ),
    { ...size }
  )
}
