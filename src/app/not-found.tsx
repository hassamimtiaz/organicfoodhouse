import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p className="status-msg">The page you requested does not exist.</p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        Back to home
      </Link>
    </div>
  )
}
