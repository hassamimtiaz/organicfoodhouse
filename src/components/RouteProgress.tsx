'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import './RouteProgress.css'

export default function RouteProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a[href]')
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      const nextPath = href.split(/[?#]/)[0]
      if (nextPath && nextPath !== pathname) {
        setActive(true)
      }
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname])

  useEffect(() => {
    setActive(false)
  }, [pathname])

  if (!active) return null

  return (
    <div className="route-progress" role="progressbar" aria-label="Loading page">
      <div className="route-progress-bar" />
    </div>
  )
}
