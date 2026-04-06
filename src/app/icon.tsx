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
          background: '#ff6029',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 320,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          borderRadius: 120,
        }}
      >
        B<span style={{ color: 'white', marginLeft: 8 }}>.</span>
      </div>
    ),
    { ...size }
  )
}
