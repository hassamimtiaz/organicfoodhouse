import Image from 'next/image'
import type { CSSProperties } from 'react'

type SiteImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  width?: number
  height?: number
  style?: CSSProperties
  quality?: number
}

export default function SiteImage({
  src,
  alt,
  className,
  priority = false,
  sizes,
  fill = false,
  width,
  height,
  style,
  quality = 80,
}: SiteImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '100vw'}
        priority={priority}
        className={className}
        style={style}
        quality={quality}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 600}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
      quality={quality}
    />
  )
}
