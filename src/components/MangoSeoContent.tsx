import { Link } from 'react-router-dom'
import { SITE } from '../config/site'
import './MangoSeoContent.css'

interface MangoSeoContentProps {
  variant?: 'home' | 'category'
}

/** Keyword-rich, readable copy for crawlers and shoppers — mangoes / Lahore / varieties */
export default function MangoSeoContent({ variant = 'home' }: MangoSeoContentProps) {
  const isHome = variant === 'home'

  return (
    <section
      className={`mango-seo-content ${isHome ? 'mango-seo-content--home' : ''}`}
      aria-labelledby="mango-seo-heading"
    >
      <div className="container mango-seo-content-inner">
        <h2 id="mango-seo-heading">
          {isHome
            ? 'Order mangoes online in Lahore & across Pakistan'
            : 'Pakistani mangoes online — delivery in Lahore'}
        </h2>

        <p>
          {SITE.name} brings you <strong>organic mangoes online</strong> each
          season — carbide-free, tree-ripened, and packed for{' '}
          <strong>mango delivery</strong> to Lahore and cities nationwide.
          Whether you are searching for <strong>mangoes in Lahore</strong>,
          reliable <strong>online mangoes</strong>, or the{' '}
          <strong>best Chaunsa</strong>, <strong>best Sindhri</strong>,{' '}
          <strong>best Dasheri (Dusehri)</strong>, or{' '}
          <strong>Anwar Ratol (Ratool)</strong>, you can browse varieties and
          pre-order directly on our website or WhatsApp.
        </p>

        <div className="mango-seo-varieties">
          <h3>Popular mango varieties we stock</h3>
          <ul>
            <li>
              <strong>Chaunsa</strong> — rich, intensely sweet; often called the
              best Chaunsa mango in Pakistan
            </li>
            <li>
              <strong>Sindhri</strong> — large, honey-sweet; a favourite for
              Sindhri mango delivery in summer
            </li>
            <li>
              <strong>Dasheri / Dusehri</strong> — aromatic golden flesh; ideal
              for families who love classic Dasheri
            </li>
            <li>
              <strong>Anwar Ratol</strong> — premium small fruit with exceptional
              sweetness (also searched as Anwar Ratool)
            </li>
          </ul>
        </div>

        <p>
          Pre-order during the season — discounts shown on each product. Free
          delivery on qualifying orders above {SITE.freeShippingMin}. Delivery
          charges apply based on your address.{' '}
          <Link to="/category/fruits/mangoes">Shop all mangoes online →</Link>
        </p>
      </div>
    </section>
  )
}
