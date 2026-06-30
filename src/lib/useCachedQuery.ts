'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_STALE_MS,
  fetchQuery,
  getQueryCache,
  isQueryStale,
} from './queryCache'

type UseCachedQueryOptions = {
  enabled?: boolean
  staleTime?: number
}

export function useCachedQuery<T>(
  key: string | null | undefined,
  queryFn: () => Promise<T>,
  options: UseCachedQueryOptions = {},
) {
  const { enabled = true, staleTime = DEFAULT_STALE_MS } = options
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const initialCached =
    key && enabled ? getQueryCache<T>(key) : undefined

  const [data, setData] = useState<T | undefined>(initialCached)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(
    Boolean(enabled && key && !initialCached),
  )
  const [isValidating, setIsValidating] = useState(false)

  const run = useCallback(
    async (background: boolean) => {
      if (!key || !enabled) return

      if (!background) setIsLoading(true)
      else setIsValidating(true)

      try {
        const result = await fetchQuery(key, () => queryFnRef.current())
        setData(result)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Request failed'))
      } finally {
        setIsLoading(false)
        setIsValidating(false)
      }
    },
    [enabled, key],
  )

  useEffect(() => {
    if (!key || !enabled) {
      setIsLoading(false)
      return
    }

    const cached = getQueryCache<T>(key)
    if (cached !== undefined) {
      setData(cached)
      setIsLoading(false)
      if (isQueryStale(key, staleTime)) {
        void run(true)
      }
      return
    }

    void run(false)
  }, [enabled, key, run, staleTime])

  const refetch = useCallback(() => run(false), [run])

  return { data, error, isLoading, isValidating, refetch }
}
