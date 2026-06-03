/** Shown on checkout / order forms */
export const DELIVERY_CHARGES_NOTE =
  'Standard delivery charges may apply depending on your area in Lahore or your city. The exact fee will be confirmed when we contact you.'

export function deliveryNoteForCity(city: string): string {
  const trimmed = city.trim()
  if (!trimmed) return DELIVERY_CHARGES_NOTE
  return `Standard delivery charges may apply for deliveries to ${trimmed} (and other areas in Lahore or across Pakistan). We will confirm the exact fee when we contact you.`
}
