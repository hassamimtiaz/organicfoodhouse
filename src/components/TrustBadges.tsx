import './TrustBadges.css'

const badges = [
  { icon: '🌿', title: '100% Organic', desc: 'Certified natural growing' },
  { icon: '🚫', title: 'Carbide Free', desc: 'Safe ripening only' },
  { icon: '📅', title: 'Seasonal picks', desc: 'Fresh each harvest' },
  {
    icon: '🚚',
    title: 'Home delivery',
    desc: 'Charges based on your address',
  },
  { icon: '✅', title: 'Best quality', desc: 'Export-grade care' },
  {
    icon: '🎁',
    title: 'Ready to gift',
    desc: 'Boxes & baskets for home visits',
  },
  { icon: '💬', title: 'Pre-order savings', desc: 'Discounts on select items' },
]

export default function TrustBadges() {
  return (
    <section className="trust-badges" aria-label="Why choose us">
      <div className="container trust-badges-grid">
        {badges.map((b) => (
          <article key={b.title} className="trust-badge">
            <span className="trust-icon" aria-hidden="true">
              {b.icon}
            </span>
            <h3>{b.title}</h3>
            <p>{b.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
