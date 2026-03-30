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
          background: '#09090b',
          backgroundImage: 'radial-gradient(ellipse at top, #18181b 0%, #09090b 100%)',
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
        B<span style={{ color: '#3b82f6', marginLeft: 8 }}>.</span>
      </div>
    ),
    { ...size }
  )
}
