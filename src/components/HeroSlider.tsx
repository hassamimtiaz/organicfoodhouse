import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { promoSlides } from '../config/promoSlides'
import './HeroSlider.css'

export default function HeroSlider() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % promoSlides.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  function goTo(index: number) {
    setActive((index + promoSlides.length) % promoSlides.length)
  }

  return (
    <section className="hero-slider" aria-label="Promotions">
      <div className="hero-slider-track">
        {promoSlides.map((slide, index) => (
          <article
            key={slide.id}
            className={`hero-slide ${index === active ? 'active' : ''}`}
            aria-hidden={index !== active}
          >
            <img
              src={slide.image}
              alt={slide.imageAlt}
              className="hero-slide-bg"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="hero-slide-overlay" />
            <div className="container hero-slide-content">
              <span className="hero-slide-badge">{slide.badge}</span>
              <h2>{slide.title}</h2>
              <p>{slide.subtitle}</p>
              <Link to={slide.ctaLink} className="btn btn-hero-cta">
                {slide.ctaLabel}
              </Link>
            </div>
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

      <div className="hero-slider-dots">
        {promoSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={index === active ? 'active' : ''}
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
