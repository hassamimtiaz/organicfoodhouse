export const SITE = {
  name: 'Organic Fruit House',
  tagline: 'Seasonal organic produce, delivered fresh',
  description:
    'Buy mangoes online in Lahore and all over Pakistan — carbide-free organic Chaunsa, Sindhri, Dasheri & Anwar Ratol from Organic Fruit House. Farm-fresh delivery nationwide.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VITE_SITE_URL ??
    'https://www.organicfruithouse.com',
  phone: '0339-6622020',
  phoneTel: '+923396622020',
  whatsapp: '923396622020',
  whatsappDisplay: '0339-6622020',
  deliveryArea: 'Pakistan',
  freeShippingMin: 'Rs. 5,000',
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
