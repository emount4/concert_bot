import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { apiEndpoints } from './endpoints'
import { API_BASE_URL } from './config'
import { removeRefreshToken } from './tokenService'
import { useAuthStore } from '../store/useAuthStore'
import type { AuthResponse } from '../types/auth'

const jsonHeaders = { 'Content-Type': 'application/json' }

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: jsonHeaders,
  timeout: 5000, // 5 second timeout for regular API calls
})

export const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: jsonHeaders,
  timeout: 5000, // 5 second timeout for auth API calls
})

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshInFlight: Promise<AuthResponse> | null = null

function isAuthRoute(pathname: string | undefined): boolean {
  if (!pathname) return false
  return (
    pathname.includes(apiEndpoints.auth.login) ||
    pathname.includes(apiEndpoints.auth.register) ||
    pathname.includes(apiEndpoints.auth.tgLogin) ||
    pathname.includes(apiEndpoints.auth.refresh) ||
    pathname.includes(apiEndpoints.auth.logout)
  )
}

async function redirectToLogin(): Promise<never> {
  useAuthStore.getState().purge()
  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
  throw new Error('Unauthenticated')
}

async function refreshAuthSession(): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>(apiEndpoints.auth.refresh)

  return response.data
}

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalConfig = error.config as RetryableRequestConfig | undefined
    const url = originalConfig?.url || 'unknown'

    console.warn(`[apiClient] Error response: ${status} from ${url}`)

    if (!originalConfig || status !== 401 || originalConfig._retry || isAuthRoute(originalConfig.url)) {
      console.warn(`[apiClient] Not retrying: retry=${originalConfig?._retry}, authRoute=${isAuthRoute(originalConfig?.url)}`)
      return Promise.reject(error)
    }

    console.log(`[apiClient] Attempting token refresh after 401 from ${url}`)
    originalConfig._retry = true

    try {
      refreshInFlight ??= refreshAuthSession().finally(() => {
        refreshInFlight = null
      })

      const nextAuth = await refreshInFlight
      console.log('[apiClient] Token refresh successful, retrying original request')
      useAuthStore.getState().setCredentials(nextAuth)

      originalConfig.headers = originalConfig.headers ?? {}
      originalConfig.headers.Authorization = `Bearer ${nextAuth.access_token}`

      return apiClient.request(originalConfig)
    } catch (refreshError) {
      console.error('[apiClient] Token refresh failed, redirecting to login')
      removeRefreshToken()
      await redirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)
