import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { promoSlides } from '../config/promoSlides'
import { whatsappLink } from '../config/site'
import './HeroSlider.css'

const AUTOPLAY_MS = 6000

function HeroSlideCopy({
  badge,
  title,
  subtitle,
  ctaLabel,
  ctaLink,
}: (typeof promoSlides)[number]) {
  return (
    <>
      <span className="hero-slide-badge">{badge}</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="hero-slide-actions">
        <Link to={ctaLink} className="btn btn-hero-cta">
          {ctaLabel}
        </Link>
        <a
          href={whatsappLink('Hi! I saw your mango boxes on the website and would like to order.')}
          className="btn btn-hero-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Order on WhatsApp
        </a>
      </div>
      <ul className="hero-slide-trust" aria-label="Highlights">
        <li>Carbide-free</li>
        <li>Premium packing</li>
        <li>Pakistan-wide delivery</li>
      </ul>
    </>
  )
}

export default function HeroSlider() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(performance.now())

  const goTo = useCallback((index: number) => {
    setActive((index + promoSlides.length) % promoSlides.length)
    setProgress(0)
    startRef.current = performance.now()
  }, [])

  useEffect(() => {
    if (paused) return

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      setProgress(Math.min(elapsed / AUTOPLAY_MS, 1))
      if (elapsed >= AUTOPLAY_MS) {
        setActive((i) => (i + 1) % promoSlides.length)
        setProgress(0)
        startRef.current = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [paused, active])

  return (
    <section
      className="hero-slider"
      aria-label="Featured products and promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false)
        startRef.current = performance.now()
        setProgress(0)
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false)
          startRef.current = performance.now()
          setProgress(0)
        }
      }}
    >
      <div className="hero-slider-track">
        {promoSlides.map((slide, index) => (
          <article
            key={slide.id}
            className={`hero-slide hero-slide--${slide.layout} ${index === active ? 'active' : ''}`}
            aria-hidden={index !== active}
          >
            {slide.layout === 'portrait' ? (
              <div className="hero-slide-split">
                <div className="hero-slide-copy">
                  <div className="hero-slide-copy-inner">
                    <HeroSlideCopy {...slide} />
                  </div>
                </div>
                <div className="hero-slide-visual">
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    className="hero-slide-photo"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="hero-slide-media">
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    className="hero-slide-bg"
                    style={{ objectPosition: slide.imagePosition ?? 'center center' }}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                  />
                </div>
                <div className="hero-slide-overlay" />
                <div className="hero-slide-content hero-slide-content--overlay">
                  <HeroSlideCopy {...slide} />
                </div>
              </>
            )}
          </article>
        ))}
      </div>

      <button
        type="button"
        className="hero-slider-arrow hero-slider-prev"
        onClick={() => goTo(active - 1)}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-next"
        onClick={() => goTo(active + 1)}
        aria-label="Next slide"
      >
        ›
      </button>

      <div className="hero-slider-dots" role="tablist" aria-label="Slide navigation">
        {promoSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={index === active ? 'active' : ''}
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}: ${slide.badge}`}
          >
            <span
              className="hero-dot-progress"
              style={{ transform: `scaleX(${index === active ? progress : 0})` }}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
