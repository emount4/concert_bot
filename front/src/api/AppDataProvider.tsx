import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadMyProfile } from './repository'
import { useAuthStore } from '../store/useAuthStore'
import type { UserProfile } from '../types/profile'

type AppShellData = {
  profile: UserProfile
}

type AppDataContextValue = {
  data: AppShellData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppShellData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAuth = useAuthStore((state) => state.isAuth)
  const isInitializing = useAuthStore((state) => state.isInitializing)
  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  const refresh = async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    const task = (async () => {
    setIsLoading(true)
    setError(null)
    try {
      const profile = await loadMyProfile()
      setData({ profile })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
      refreshInFlightRef.current = null
    }
    })()

    refreshInFlightRef.current = task
    return task
  }

  useEffect(() => {
    if (isInitializing) return

    if (!isAuth) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    void refresh()
  }, [isAuth, isInitializing])

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      isLoading,
      error,
      refresh,
    }),
    [data, isLoading, error],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider')
  }
  return ctx
}
