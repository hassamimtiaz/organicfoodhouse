'use client'

import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { OUR_VALUES } from '../config/values'
import { SITE } from '../config/site'
import './CompanyPages.css'

export default function OurValues() {
  const { hero, intro, pillars, commitments, crossLink } = OUR_VALUES

  return (
    <div className="company-page">
      <Seo
        title="Our Values"
        description={`The values behind ${SITE.name} — quality, transparency, organic growing, and fresh mangoes from Rahim Yar Khan and Multan.`}
        path="/our-values"
        keywords="organic food values, carbide free commitment, Rahim Yar Khan Multan mangoes, farm fresh quality Pakistan, seasonal organic principles"
      />

      <section className="company-hero company-hero--values">
        <div className="container company-hero-inner">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Our Values' },
            ]}
          />
          <span className="company-hero-eyebrow">{hero.eyebrow}</span>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
        </div>
      </section>

      <section className="section company-intro">
        <div className="container company-intro-inner">
          <p>{intro}</p>
        </div>
      </section>

      <section className="section company-pillars">
        <div className="container">
          <div className="section-header">
            <h2>What guides us</h2>
            <p>Six principles behind every product we list and every order we fulfil</p>
          </div>
          <ul className="company-pillars-grid">
            {pillars.map((pillar) => (
              <li key={pillar.title} className="company-pillar-card">
                <span className="company-pillar-icon" aria-hidden="true">
                  {pillar.icon}
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section company-commitments">
        <div className="container company-commitments-inner">
          <h2>{commitments.title}</h2>
          <ul className="company-commitments-list">
            {commitments.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section company-crosslink">
        <div className="container company-crosslink-inner">
          <p>{crossLink.text}</p>
          <Link href={crossLink.linkPath} className="btn btn-outline">
            {crossLink.linkLabel}
          </Link>
        </div>
      </section>
    </div>
  )
}
