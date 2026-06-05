import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { OUR_VALUES } from '../config/values'
import { SITE, whatsappLink } from '../config/site'
import './OurValues.css'

export default function OurValues() {
  const { hero, story, pillars, farmSpotlight } = OUR_VALUES

  return (
    <div className="our-values-page">
      <Seo
        title="Our Values"
        description={`${SITE.name} — mango lovers bringing farm-fresh organic produce from Rahim Yar Khan to homes across Pakistan. Taste, quality, and honesty in every season.`}
        path="/our-values"
        keywords="organic mangoes Rahim Yar Khan, farm fresh mangoes Pakistan, carbide free mangoes, organic food values, mango lovers Lahore"
      />

      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Our values' },
          ]}
        />
      </div>

      <section className="values-hero">
        <div className="container values-hero-inner">
          <span className="values-hero-eyebrow">{hero.eyebrow}</span>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
        </div>
      </section>

      <section className="section values-story">
        <div className="container values-story-inner">
          <div className="values-story-text">
            <h2>{story.title}</h2>
            {story.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          <aside className="values-story-aside" aria-label="Our commitment">
            <span className="values-story-emoji" aria-hidden="true">
              🥭
            </span>
            <p>
              &ldquo;We started this venture because we wanted everyone to taste
              what we love from the farms of Rahim Yar Khan — nothing less.&rdquo;
            </p>
          </aside>
        </div>
      </section>

      <section className="section values-pillars">
        <div className="container">
          <div className="section-header">
            <h2>What we believe</h2>
            <p>Principles that guide every harvest, every pack, and every order</p>
          </div>
          <ul className="values-pillars-grid">
            {pillars.map((pillar) => (
              <li key={pillar.title} className="values-pillar-card">
                <span className="values-pillar-icon" aria-hidden="true">
                  {pillar.icon}
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section values-farm">
        <div className="container values-farm-inner">
          <div className="values-farm-content">
            <h2>{farmSpotlight.title}</h2>
            <p>{farmSpotlight.description}</p>
            <ul className="values-farm-list">
              {farmSpotlight.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="values-farm-visual" aria-hidden="true">
            <span>🌾</span>
            <strong>Rahim Yar Khan</strong>
            <small>Southern Punjab · Mango belt</small>
          </div>
        </div>
      </section>

      <section className="section values-cta">
        <div className="container values-cta-inner">
          <h2>Taste the difference this season</h2>
          <p>
            Browse in-season mangoes, pre-order early for seasonal discounts,
            or message us on WhatsApp — we are happy to help you choose.
          </p>
          <div className="values-cta-actions">
            <Link to="/category/fruits/mangoes" className="btn btn-primary">
              Shop mangoes
            </Link>
            <a
              href={whatsappLink()}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
