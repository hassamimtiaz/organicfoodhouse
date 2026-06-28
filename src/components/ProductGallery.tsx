'use client'

import { useCallback, useEffect, useState } from 'react'
import { IMAGE_SIZES } from '../lib/imageSizes'
import SiteImage from './SiteImage'
import './ProductGallery.css'

interface ProductGalleryProps {
  images: string[]
  alt: string
  fallbackEmoji?: string
  badge?: string | null
  badgeVariant?: 'default' | 'soon'
}

export default function ProductGallery({
  images,
  alt,
  fallbackEmoji = '🥭',
  badge = null,
  badgeVariant = 'default',
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const count = images.length
  const hasMultiple = count > 1
  const safeIndex = count > 0 ? Math.min(activeIndex, count - 1) : 0
  const imageKey = images.join('|')

  useEffect(() => {
    setActiveIndex(0)
  }, [imageKey])

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setActiveIndex((index + count) % count)
    },
    [count],
  )

  const goPrev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex])
  const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex])

  useEffect(() => {
    if (!hasMultiple) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hasMultiple, goPrev, goNext])

  if (count === 0) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-stage">
          <span className="product-gallery-fallback" aria-hidden="true">
            {fallbackEmoji}
          </span>
          {badge && (
            <span
              className={`product-gallery-badge product-gallery-badge--${badgeVariant}`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`product-gallery${hasMultiple ? ' product-gallery--multi' : ''}`}
    >
      <div className="product-gallery-stage">
        <SiteImage
          src={images[safeIndex]}
          alt={
            hasMultiple ? `${alt} — image ${safeIndex + 1} of ${count}` : alt
          }
          className="product-gallery-main"
          fill
          sizes={IMAGE_SIZES.productGallery}
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              className="product-gallery-nav product-gallery-nav--prev"
              onClick={goPrev}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="product-gallery-nav product-gallery-nav--next"
              onClick={goNext}
              aria-label="Next image"
            >
              ›
            </button>
            <span className="product-gallery-counter" aria-live="polite">
              {safeIndex + 1} / {count}
            </span>
          </>
        )}

        {badge && (
          <span
            className={`product-gallery-badge product-gallery-badge--${badgeVariant}`}
          >
            {badge}
          </span>
        )}
      </div>

      {hasMultiple && (
        <div
          className="product-gallery-thumbs"
          role="tablist"
          aria-label={`${alt} images`}
        >
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === safeIndex}
              aria-label={`Show image ${index + 1}`}
              className={`product-gallery-thumb${
                index === safeIndex ? ' is-active' : ''
              }`}
              onClick={() => setActiveIndex(index)}
            >
              <SiteImage
                src={url}
                alt=""
                fill
                sizes="64px"
                className="product-gallery-thumb-img"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
