/** Short line for header / banners */
export const DELIVERY_CHARGES_SHORT =
  'Delivery charges apply based on your address.'

/** Full note on checkout / order forms */
export const DELIVERY_CHARGES_NOTE =
  'Delivery charges will be applicable based on your address. The exact amount depends on your city and delivery area — we will confirm the fee when we contact you.'

export function deliveryNoteForCity(city: string): string {
  const trimmed = city.trim()
  if (!trimmed) return DELIVERY_CHARGES_NOTE
  return `Delivery charges will be applicable based on your address (${trimmed}). The exact fee depends on your location — we will confirm the amount when we contact you.`
}
