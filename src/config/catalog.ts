import { SITE } from './site'

export type CatalogPresentationTag = 'gift' | 'delivery' | 'both'

export interface CatalogPresentationItem {
  id: string
  title: string
  description: string
  image: string
  imageAlt: string
  tag: CatalogPresentationTag
  orderNote: string
}

export const CATALOG = {
  hero: {
    eyebrow: 'What we offer',
    title: 'Our catalog',
    subtitle:
      'Browse how we pack and present organic fruit — gift boxes, baskets, and seasonal varieties from farms in Rahim Yar Khan and Multan.',
  },
  presentation: [
    {
      id: 'signature-boxes',
      title: 'Premium gift box collection',
      description:
        'Branded boxes in multiple sizes — export-grade presentation for home visits, Eid, and thank-you gifts.',
      image: '/images/hero/boxes-collection.png',
      imageAlt: 'Collection of Organic Fruit House premium mango gift boxes',
      tag: 'gift',
      orderNote: 'Choose a gift box size on any mango product, or message us on WhatsApp.',
    },
    {
      id: 'single-gift-box',
      title: 'Single gift box',
      description:
        'Foam-sleeved mangoes in a finished branded box — ready to hand over when you arrive.',
      image: '/images/hero/premium-gift-box.png',
      imageAlt: 'Fresh mangoes in a premium branded gift box with foam sleeves',
      tag: 'gift',
      orderNote: 'Look for “Host gift box” under box options when ordering online.',
    },
    {
      id: 'gift-basket',
      title: 'Gift buckets & baskets',
      description:
        'Ribbon, mesh wrap, and decorative finish — our most popular option instead of mithai or cake.',
      image: '/images/hero/gift-basket.png',
      imageAlt: 'Decorated mango gift basket with ribbon and thank-you card',
      tag: 'gift',
      orderNote: 'Order on WhatsApp — tell us the occasion and we’ll prepare the basket.',
    },
    {
      id: 'transit-box',
      title: 'Protected transit box',
      description:
        'Each mango individually foam-sleeved inside a sturdy box — safe for delivery across Pakistan.',
      image: '/images/hero/fresh-mangoes-box.png',
      imageAlt: 'Mangoes in foam sleeves inside a delivery box',
      tag: 'delivery',
      orderNote: 'Standard packing for all online orders — no extra step needed.',
    },
    {
      id: 'basket-close',
      title: 'Finished gift presentation',
      description:
        'Close-up of our basket styling — mesh, bow, and fruit arranged to impress on arrival.',
      image: '/images/hero/gift-basket-close.png',
      imageAlt: 'Close-up of mango gift basket with mesh and decorative bow',
      tag: 'gift',
      orderNote: 'Mention “pack as gift basket” in checkout notes or on WhatsApp.',
    },
    {
      id: 'seasonal-quality',
      title: 'Farm-fresh mangoes',
      description:
        'Carbide-free, tree-ripened Chaunsa, Sindhri, Dasheri, Anwar Ratol and more — when in season.',
      image: '/images/hero/mango-in-hand.png',
      imageAlt: 'Ripe mango held in hand beside gift basket',
      tag: 'both',
      orderNote: 'See varieties below — each product lists available box sizes and prices.',
    },
  ] satisfies CatalogPresentationItem[],
  tagLabels: {
    gift: 'Gift & visits',
    delivery: 'Home delivery',
    both: 'Gift or delivery',
  } as Record<CatalogPresentationTag, string>,
} as const

export function catalogWhatsAppLink(itemTitle?: string) {
  const detail = itemTitle
    ? ` I'm interested in: ${itemTitle}.`
    : ''
  const message = encodeURIComponent(
    `Hi ${SITE.name}! I was browsing your catalog and would like to place an order.${detail}`,
  )
  return `https://wa.me/${SITE.whatsapp}?text=${message}`
}
