/** Responsive `sizes` hints for next/image — smaller files on mobile. */
export const IMAGE_SIZES = {
  heroLandscape: '100vw',
  heroPortrait: '(max-width: 900px) 100vw, 50vw',
  productCard: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px',
  productGallery: '(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 560px',
  categoryCard: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px',
  catalogPresentation: '(max-width: 768px) 100vw, (max-width: 1180px) 40vw, 480px',
} as const
