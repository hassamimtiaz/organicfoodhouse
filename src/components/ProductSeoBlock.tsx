import './ProductSeoBlock.css'

type ProductSeoBlockProps = {
  heading: string
  paragraphs: string[]
}

export default function ProductSeoBlock({
  heading,
  paragraphs,
}: ProductSeoBlockProps) {
  return (
    <section
      className="product-seo-block"
      aria-labelledby="product-seo-heading"
    >
      <div className="container product-seo-block-inner">
        <h2 id="product-seo-heading">{heading}</h2>
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}
