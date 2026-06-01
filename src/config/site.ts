export const SITE = {
  name: 'Organic Food House',
  tagline: 'Seasonal organic produce, delivered fresh',
  description:
    'Shop seasonal organic fruits and farm-fresh produce online in Pakistan. Carbide-free, naturally ripened — pre-order in-season items with free delivery on qualifying orders.',
  url: import.meta.env.VITE_SITE_URL ?? 'https://organicfoods.pk',
  email: 'organicfoodhouse786@gmail.com',
  phone: '0339-6622020',
  phoneTel: '+923396622020',
  whatsapp: '923396622020',
  whatsappDisplay: '0339-6622020',
  deliveryArea: 'Pakistan',
  preOrderDiscount: '10%',
  freeShippingMin: 'Rs. 3,000',
} as const

export function whatsappLink(message?: string) {
  const text = encodeURIComponent(
    message ??
      `Hi ${SITE.name}! I would like to place an order for seasonal organic produce.`,
  )
  return `https://wa.me/${SITE.whatsapp}?text=${text}`
}

export function formatPricePKR(amount: number) {
  return `₨ ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
