import { SITE } from './site'

export const GIFTING = {
  headline: 'Mango gift baskets Lahore & across Pakistan',
  subheadline:
    'When you visit someone’s home, skip the sweets and cake. Our gift buckets and boxes are packed to carry — organic, carbide-free, and ready to impress.',
  tagline: 'A thoughtful host gift from the farms of Rahim Yar Khan & Multan',
  compare: [
    {
      instead: 'Mithai & sweets',
      bring: 'Premium mango gift box',
      note: 'Share the season — something the whole family can enjoy',
    },
    {
      instead: 'Cake & bakery items',
      bring: 'Decorated fruit basket',
      note: 'Looks premium on the table, fresh when you arrive',
    },
    {
      instead: 'Last-minute shop run',
      bring: 'Pre-order online or WhatsApp',
      note: 'We pack and deliver — you pick up or send straight to their door',
    },
  ],
  occasions: [
    { icon: '🏠', title: 'Ghar aana & dawat', desc: 'Visiting friends or family' },
    { icon: '🌙', title: 'Eid & festive visits', desc: 'A fresh alternative to traditional sweets' },
    { icon: '🔑', title: 'Housewarming', desc: 'Welcome them with something memorable' },
    { icon: '🙏', title: 'Thank-you gifts', desc: 'After their hospitality' },
    { icon: '💼', title: 'Corporate visits', desc: 'Clients and colleagues' },
  ],
  packaging: [
    {
      title: 'Gift boxes',
      desc: 'Foam-sleeved mangoes in branded boxes — safe in transit and ready to hand over.',
      image: '/images/hero/premium-gift-box.png',
    },
    {
      title: 'Gift buckets & baskets',
      desc: 'Ribbon, mesh wrap, and a finished look — ideal when presentation matters.',
      image: '/images/hero/gift-basket.png',
    },
  ],
  reasons: [
    'Organic and carbide-free — safe for elders and children',
    'Farm-fresh from partner orchards we visit personally',
    'Packed with care so it travels well and opens beautifully',
    'Add a gift message at checkout or tell us on WhatsApp',
  ],
} as const

export function giftingWhatsAppLink() {
  const message = encodeURIComponent(
    `Hi ${SITE.name}! I'd like to order a fruit gift box or basket for a home visit.`,
  )
  return `https://wa.me/${SITE.whatsapp}?text=${message}`
}
