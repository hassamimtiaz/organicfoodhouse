'use client'

import { useEffect } from 'react'

interface JsonLdScriptProps {
  id: string
  data: Record<string, unknown>
}

export default function JsonLdScript({ id, data }: JsonLdScriptProps) {
  const json = JSON.stringify(data)

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = id
    script.textContent = json
    document.head.appendChild(script)

    return () => {
      document.getElementById(id)?.remove()
    }
  }, [id, json])

  return null
}
