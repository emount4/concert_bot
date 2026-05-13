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

/** Matches typical API messages when the access JWT is invalid/expired (case-insensitive). */
const ACCESS_TOKEN_RENEW_MESSAGE =
  /invalid\s+or\s+expired\s+token|invalid\s+token|expired\s+token|token\s+expired|jwt\s+expired/i

function extractApiErrorText(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as { message?: unknown; error?: unknown }
  const parts = [o.message, o.error].filter((x): x is string => typeof x === 'string')
  return parts.join(' ').trim()
}

/** Whether we should try a single refresh + retry for this response (non-auth routes only). */
export function shouldRenewSessionAfterError(status: number | undefined, body: unknown): boolean {
  if (status === 401) return true
  if (status !== 403 && status !== 400) return false
  return ACCESS_TOKEN_RENEW_MESSAGE.test(extractApiErrorText(body))
}

let refreshInFlight: Promise<AuthResponse> | null = null
let lastRefreshFailure = 0
const REFRESH_FAILURE_COOLDOWN_MS = 10_000 // don't attempt refresh more than once per 10s after a failure

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

export async function purgeSessionAndRedirectToLogin(): Promise<never> {
  useAuthStore.getState().purge()
  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
  throw new Error('Unauthenticated')
}

export async function refreshAuthSession(): Promise<AuthResponse> {
  const now = Date.now()
  if (now - lastRefreshFailure < REFRESH_FAILURE_COOLDOWN_MS) {
    throw new Error('refresh_cooldown')
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await authClient.post<AuthResponse>(apiEndpoints.auth.refresh)
        return response.data
      } catch (err) {
        lastRefreshFailure = Date.now()
        throw err
      } finally {
        refreshInFlight = null
      }
    })()
  }

  return refreshInFlight
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

    const body = error.response?.data
    if (
      !originalConfig ||
      !shouldRenewSessionAfterError(status, body) ||
      originalConfig._retry ||
      isAuthRoute(originalConfig.url)
    ) {
      console.warn(`[apiClient] Not retrying: retry=${originalConfig?._retry}, authRoute=${isAuthRoute(originalConfig?.url)}`)
      return Promise.reject(error)
    }

    console.log(`[apiClient] Attempting token refresh after ${status} from ${url}`)
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
      await purgeSessionAndRedirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)
