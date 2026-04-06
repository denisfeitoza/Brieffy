import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Brieffy Icon'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          backgroundImage: 'radial-gradient(ellipse at top, #141414 0%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 320,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        b<span style={{ color: '#ff6029', marginLeft: 8 }}>.</span>
      </div>
    ),
    { ...size }
  )
}
