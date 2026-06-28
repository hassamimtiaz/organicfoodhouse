import Link from 'next/link'
import { NEWS_HIGHLIGHTS } from '../config/newsHighlights'
import './NewsHighlights.css'

export default function NewsHighlights() {
  const items = [...NEWS_HIGHLIGHTS, ...NEWS_HIGHLIGHTS]

  return (
    <div className="news-highlights" aria-label="Store highlights">
      <span className="news-highlights-label">Highlights</span>
      <div className="news-highlights-viewport">
        <div className="news-highlights-track">
          {items.map((text, index) => (
            <span key={`${text}-${index}`} className="news-highlights-item">
              {text}
              <span className="news-highlights-sep" aria-hidden="true">
                •
              </span>
            </span>
          ))}
        </div>
      </div>
      <Link href="/category/fruits/mangoes" className="news-highlights-cta">
        Shop mangoes
      </Link>
    </div>
  )
}
