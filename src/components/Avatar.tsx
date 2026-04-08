import Image from "next/image"

type Props = {
  src: string | null | undefined
  alt: string
  size: number
  initials?: string
  style?: React.CSSProperties
}

// Detects if a URL is safe for Next/Image (must be absolute https or relative /)
// blob:// and data: URLs must use raw <img>
function isNextImageCompatible(src: string): boolean {
  return src.startsWith("https://") || src.startsWith("/")
}

export function Avatar({ src, alt, size, initials = "?", style }: Props) {
  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    background: "var(--accent-soft)",
    border: "1px solid var(--rule)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: Math.round(size * 0.3),
    fontWeight: 500,
    color: "var(--accent)",
    position: "relative",
    ...style,
  }

  if (!src) {
    return <div style={base}>{initials}</div>
  }

  if (!isNextImageCompatible(src)) {
    // blob:// preview or data: URL — Next/Image can't handle these
    return (
      <div style={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )
  }

  return (
    <div style={base}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        style={{ objectFit: "cover" }}
        priority={size >= 60} 
      />
    </div>
  )
}