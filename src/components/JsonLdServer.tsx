/** JSON-LD for crawlers — render inside `<head>` when possible. */
export default function JsonLdServer({
  id,
  data,
}: {
  id: string
  data: Record<string, unknown>
}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
