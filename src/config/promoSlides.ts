export interface PromoSlide {
  id: string
  image: string
  imageAlt: string
  /** Landscape = full-bleed cover; portrait = split panel with full image visible */
  layout: 'landscape' | 'portrait'
  /** CSS object-position when layout is landscape */
  imagePosition?: string
  badge: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaLink: string
}

export const promoSlides: PromoSlide[] = [
  {
    id: 'signature-boxes',
    image: '/images/hero/boxes-collection.png',
    imageAlt: 'Organic Fruit House premium mango gift boxes and packaging',
    layout: 'landscape',
    imagePosition: 'center center',
    badge: 'Our signature packaging',
    title: 'Premium mango boxes, made to impress',
    subtitle:
      'Export-grade mangoes in gift-ready boxes — perfect for family, friends, and corporate gifting across Pakistan.',
    ctaLabel: 'Shop mango boxes',
    ctaLink: '/category/fruits/mangoes',
  },
  {
    id: 'fresh-mangoes-box',
    image: '/images/hero/premium-gift-box.png',
    imageAlt: 'Fresh mangoes in a premium branded gift box with protective foam sleeves',
    layout: 'landscape',
    imagePosition: 'center center',
    badge: 'Premium quality',
    title: 'Fresh mangoes, carefully packed',
    subtitle:
      'Each mango is sleeved and boxed for safe delivery — carbide-free, naturally ripened, farm-fresh.',
    ctaLabel: 'Order now',
    ctaLink: '/category/fruits/mangoes',
  },
  {
    id: 'gift-basket',
    image: '/images/hero/gift-basket.png',
    imageAlt: 'Decorated mango gift basket with green ribbon and thank-you card',
    layout: 'portrait',
    badge: 'Perfect for gifting',
    title: 'Gift baskets that delight',
    subtitle:
      'Hand-finished baskets with ribbon, mesh wrap, and a personal touch — ideal for Eid, weddings, and thank-yous.',
    ctaLabel: 'Browse gift options',
    ctaLink: '/category/fruits/mangoes',
  },
  {
    id: 'farm-fresh',
    image: '/images/hero/fresh-mangoes-box.png',
    imageAlt: 'Green mangoes individually wrapped in protective foam inside a cardboard box',
    layout: 'portrait',
    badge: 'Farm to doorstep',
    title: 'Every mango, protected',
    subtitle:
      'Foam-sleeved and boxed the moment they are picked — so your order arrives as fresh as the orchard.',
    ctaLabel: 'See what’s in season',
    ctaLink: '/#in-season',
  },
  {
    id: 'taste-nature',
    image: '/images/hero/mango-in-hand.png',
    imageAlt: 'Hand holding a ripe yellow mango in front of a decorated gift basket',
    layout: 'portrait',
    badge: 'Taste the goodness',
    title: 'Ripe, sweet, and unforgettable',
    subtitle:
      'The same quality our customers love — juicy mangoes you can see, hold, and taste the difference.',
    ctaLabel: 'Shop seasonal picks',
    ctaLink: '/category/fruits/mangoes',
  },
  {
    id: 'gift-ready',
    image: '/images/hero/gift-basket-close.png',
    imageAlt: 'Close-up of a mango gift basket with green mesh and decorative bow',
    layout: 'portrait',
    badge: 'Ready to gift',
    title: 'Beautiful presentation, every time',
    subtitle:
      'Order online or on WhatsApp — we deliver premium organic fruit with packaging you will be proud to give.',
    ctaLabel: 'Start your order',
    ctaLink: '/category/fruits/mangoes',
  },
]
