import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadAppBootstrapData, type AppBootstrapData } from './repository'
import { useAuthStore } from '../store/useAuthStore'

type AppDataContextValue = {
  data: AppBootstrapData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppBootstrapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAuth = useAuthStore((state) => state.isAuth)
  const isInitializing = useAuthStore((state) => state.isInitializing)

  const refresh = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const nextData = await loadAppBootstrapData()
      setData(nextData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
    }
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
