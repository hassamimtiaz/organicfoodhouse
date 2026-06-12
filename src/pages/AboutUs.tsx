import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { ABOUT_US } from '../config/about'
import { SITE, whatsappLink } from '../config/site'
import './CompanyPages.css'

export default function AboutUs() {
  const { hero, story, mission, farmSpotlight, howWeWork } = ABOUT_US

  return (
    <div className="company-page">
      <Seo
        title="About Us"
        description={`Learn about ${SITE.name} — mango lovers bringing farm-fresh organic produce from Rahim Yar Khan to homes across Pakistan.`}
        path="/about-us"
        keywords="about organic food house, Rahim Yar Khan mangoes, farm fresh organic Pakistan, mango lovers Lahore"
      />

      <section className="company-hero">
        <div className="container company-hero-inner">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'About us' },
            ]}
          />
          <span className="company-hero-eyebrow">{hero.eyebrow}</span>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
        </div>
      </section>

      <section className="section company-story">
        <div className="container company-story-inner">
          <div className="company-story-text">
            <h2>{story.title}</h2>
            {story.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          <aside className="company-story-aside" aria-label="Our commitment">
            <span className="company-story-emoji" aria-hidden="true">
              🥭
            </span>
            <p>&ldquo;{story.quote}&rdquo;</p>
          </aside>
        </div>
      </section>

      <section className="section company-mission">
        <div className="container company-mission-inner">
          <h2>{mission.title}</h2>
          <p>{mission.text}</p>
        </div>
      </section>

      <section className="section company-farm">
        <div className="container company-farm-inner">
          <div className="company-farm-content">
            <h2>{farmSpotlight.title}</h2>
            <p>{farmSpotlight.description}</p>
            <ul className="company-check-list">
              {farmSpotlight.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="company-farm-visual" aria-hidden="true">
            <span>🌾</span>
            <strong>Rahim Yar Khan</strong>
            <small>Southern Punjab · Mango belt</small>
          </div>
        </div>
      </section>

      <section className="section company-steps">
        <div className="container">
          <div className="section-header">
            <h2>{howWeWork.title}</h2>
          </div>
          <ul className="company-steps-grid">
            {howWeWork.items.map((item) => (
              <li key={item.title} className="company-step-card">
                <span className="company-step-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section company-crosslink">
        <div className="container company-crosslink-inner">
          <p>Curious about the principles behind how we operate?</p>
          <Link to="/our-values" className="btn btn-outline">
            Read our values
          </Link>
        </div>
      </section>

      <section className="section company-cta">
        <div className="container company-cta-inner">
          <h2>Taste the difference this season</h2>
          <p>
            Browse in-season mangoes, pre-order early for seasonal discounts,
            or message us on WhatsApp — we are happy to help you choose.
          </p>
          <div className="company-cta-actions">
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
