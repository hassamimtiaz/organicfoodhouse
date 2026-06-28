import Link from 'next/link'
import { HOME_FAQ } from '../config/faq'
import './HomeFaq.css'

export default function HomeFaq() {
  return (
    <section className="section home-faq" id="faq" aria-labelledby="home-faq-heading">
      <div className="container home-faq-inner">
        <div className="section-header">
          <h2 id="home-faq-heading">Frequently asked questions</h2>
          <p>Quick answers about our organic fruit, delivery, and pre-orders</p>
        </div>
        <dl className="home-faq-list">
          {HOME_FAQ.map((item) => (
            <div key={item.question} className="home-faq-item">
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
          <p className="home-faq-more">
            Shop seasonal mangoes in{' '}
            <Link href="/category/fruits/mangoes">our mangoes collection</Link>
            {' '}or{' '}
            <Link href="/catalog">view the full catalog</Link>.
          </p>
      </div>
    </section>
  )
}
