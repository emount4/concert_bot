import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Задание 17.4: минимальный useQuery-хук для мокового fetching без зависимости от react-query.

type UseQueryOptions<T> = {
  enabled?: boolean
  initialData?: T
}

export type UseQueryResult<T> = {
  data: T | undefined
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const queryCache = new Map<string, unknown>()

function keyToString(queryKey: unknown[]): string {
  try {
    return JSON.stringify(queryKey)
  } catch {
    return String(queryKey)
  }
}

export function useQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {},
): UseQueryResult<T> {
  const enabled = options.enabled ?? true
  const key = useMemo(() => keyToString(queryKey), [queryKey])

  const [data, setData] = useState<T | undefined>(() => {
    if (queryCache.has(key)) return queryCache.get(key) as T
    return options.initialData
  })
  const [isLoading, setIsLoading] = useState<boolean>(() => enabled && !queryCache.has(key) && options.initialData === undefined)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  const run = useCallback(async () => {
    if (!enabled) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      if (requestIdRef.current !== requestId) return

      queryCache.set(key, result)
      setData(result)
      setIsLoading(false)
    } catch (e) {
      if (requestIdRef.current !== requestId) return

      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
      setIsLoading(false)
    }
  }, [enabled, key, queryFn])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    if (queryCache.has(key)) {
      setData(queryCache.get(key) as T)
      setIsLoading(false)
      setError(null)
      return
    }

    void run()
  }, [enabled, key, run])

  return { data, isLoading, error, refetch: run }
}
