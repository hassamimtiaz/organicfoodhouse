export interface PromoSlide {
  id: string
  image: string
  imageAlt: string
  badge: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaLink: string
}

/** Promo carousel slides — update images/links in admin later via config */
export const promoSlides: PromoSlide[] = [
  {
    id: 'mango-season',
    image:
      'https://images.unsplash.com/photo-1605027990121-cbae9e63ab02?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Fresh ripe mangoes on a wooden table',
    badge: 'In season now',
    title: 'Premium mango season is here',
    subtitle: 'Pre-order export-grade varieties with 10% off. Carbide-free & farm-fresh.',
    ctaLabel: 'Shop mangoes',
    ctaLink: '/category/fruits/mangoes',
  },
  {
    id: 'organic-fruits',
    image:
      'https://images.unsplash.com/photo-1619568428299-a69f8c8e64e0?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Assorted fresh organic fruits',
    badge: '100% organic',
    title: 'Seasonal fruits, straight from the farm',
    subtitle: 'Hand-picked produce delivered to your doorstep across Pakistan.',
    ctaLabel: 'Browse fruits',
    ctaLink: '/category/fruits',
  },
  {
    id: 'pre-order',
    image:
      'https://images.unsplash.com/photo-1553279768-8650adbb2896?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Golden mangoes in a harvest basket',
    badge: `Pre-order · Save 10%`,
    title: 'Reserve before the season sells out',
    subtitle: 'Order on the website, WhatsApp, or call — we deliver the best quality.',
    ctaLabel: 'Shop seasonal picks',
    ctaLink: '/#in-season',
  },
]
