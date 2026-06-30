'use client'

import Image from 'next/image'
import { useState, type CSSProperties } from 'react'
import './SiteImage.css'

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
  const [loaded, setLoaded] = useState(false)

  const imageClassName = [
    className,
    loaded ? 'site-image__img--loaded' : 'site-image__img--loading',
  ]
    .filter(Boolean)
    .join(' ')

  if (fill) {
    return (
      <span
        className={`site-image site-image--fill${loaded ? ' site-image--loaded' : ''}`}
      >
        {!loaded && <span className="site-image__placeholder skeleton" aria-hidden="true" />}
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? '100vw'}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          className={imageClassName}
          style={style}
          quality={quality}
          onLoad={() => setLoaded(true)}
        />
      </span>
    )
  }

  return (
    <span
      className={`site-image${loaded ? ' site-image--loaded' : ''}`}
      style={{ width, height }}
    >
      {!loaded && <span className="site-image__placeholder skeleton" aria-hidden="true" />}
      <Image
        src={src}
        alt={alt}
        width={width ?? 800}
        height={height ?? 600}
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        className={imageClassName}
        style={style}
        quality={quality}
        onLoad={() => setLoaded(true)}
      />
    </span>
  )
}
