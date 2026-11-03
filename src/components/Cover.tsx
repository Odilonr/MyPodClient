import { cx } from '@/utils/cx'

const PALETTES = [
  { ground: '#2b48d4', shape: '#ffe27a', detail: '#94a6f0', text: '#ffffff' },
  { ground: '#ffe27a', shape: '#131a3a', detail: '#ff4f2e', text: '#131a3a' },
  { ground: '#131a3a', shape: '#94a6f0', detail: '#ffe27a', text: '#ffffff' },
  { ground: '#ff4f2e', shape: '#fff6d6', detail: '#131a3a', text: '#131a3a' },
  { ground: '#bac6f6', shape: '#2b48d4', detail: '#131a3a', text: '#131a3a' }
]

function hash (text: string) {
  let value = 0
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0
  return value
}

function Waves ({ shape, detail }: { shape: string, detail: string }) {
  return (
    <>
      {[58, 44, 30, 16].map((radius) => (
        <circle key={radius} cx="20" cy="80" r={radius} fill="none" stroke={shape} strokeWidth="6" />
      ))}
      <circle cx="20" cy="80" r="6" fill={detail} />
    </>
  )
}

function Bars ({ shape, detail }: { shape: string, detail: string }) {
  return (
    <>
      {[34, 58, 26, 72, 46, 62].map((height, index) => (
        <rect key={index} x={13 + index * 13} y={84 - height} width="8" height={height} fill={index === 3 ? detail : shape} />
      ))}
    </>
  )
}

function Dial ({ shape, detail }: { shape: string, detail: string }) {
  return (
    <>
      <circle cx="50" cy="50" r="32" fill="none" stroke={shape} strokeWidth="6" />
      {Array.from({ length: 12 }, (_, index) => (
        <rect key={index} x="49" y="8" width="2" height="6" fill={shape} transform={`rotate(${index * 30} 50 50)`} />
      ))}
      <rect x="48" y="24" width="4" height="28" fill={detail} transform="rotate(38 50 50)" />
    </>
  )
}

function Hills ({ shape, detail }: { shape: string, detail: string }) {
  return (
    <>
      <circle cx="70" cy="30" r="13" fill={detail} />
      <path d="M0 74 Q 26 36 52 72 T 100 60 V 100 H 0 Z" fill={shape} />
    </>
  )
}

const MOTIFS = [Waves, Bars, Dial, Hills]

export const coverPalette = (seed: string) => PALETTES[hash(seed) % PALETTES.length]

// Draws original cover art from the show's ID. A show with its own image link,
// such as an imported feed, shows that image instead.
export function Cover ({ seed, image, className }: { seed: string, image?: string, className?: string }) {
  if (image && /^https?:\/\//i.test(image)) {
    return <img src={image} alt="" loading="lazy" className={cx('aspect-square object-cover', className)} />
  }
  const value = hash(seed)
  const palette = PALETTES[value % PALETTES.length]
  const Motif = MOTIFS[(value >>> 4) % MOTIFS.length]
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cx('aspect-square block', className)} style={{ background: palette.ground }}>
      <Motif shape={palette.shape} detail={palette.detail} />
    </svg>
  )
}
