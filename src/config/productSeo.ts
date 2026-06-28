/** Slug-specific SEO copy and metadata overrides for product pages. */
export type ProductSeoExtension = {
  metaTitle?: string
  metaDescription?: string
  blockHeading: string
  blockParagraphs: string[]
}

export const PRODUCT_SEO_BY_SLUG: Record<string, ProductSeoExtension> = {
  'premium-chaunsa-mango': {
    metaTitle: 'Chaunsa Mango Price Pakistan — Premium Organic Chaunsa',
    metaDescription:
      'Check Chaunsa mango price in Pakistan at Organic Fruit House — export-grade, carbide-free Premium Chaunsa from Rahim Yar Khan & Multan. Pre-order online with box pricing and delivery across Lahore and Pakistan.',
    blockHeading: 'Chaunsa mango price in Pakistan',
    blockParagraphs: [
      'Premium Chaunsa is one of the most sought-after varieties each summer — rich, honey-sweet, and naturally ripened without carbide. At Organic Fruit House, Chaunsa mango price in Pakistan is shown clearly on this page by box size and pack, so you know exactly what you pay before checkout.',
      'We source from partner orchards in Rahim Yar Khan and Multan, pack with foam sleeves for safe delivery, and ship to Lahore, Karachi, Islamabad, and cities nationwide. Pre-order during the season for the best selection — discounts appear on the product when available.',
    ],
  },
}

export function getProductSeoExtension(slug: string): ProductSeoExtension | null {
  return PRODUCT_SEO_BY_SLUG[slug] ?? null
}
