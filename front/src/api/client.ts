import { API_BASE_URL } from './config'
import { useAuthStore } from '../store/useAuthStore'
import { purgeSessionAndRedirectToLogin, refreshAuthSession, shouldRenewSessionAfterError } from './apiClient'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
const ACCESS_TOKEN_KEY = 'concert_bot.access_token'

function getAccessToken(): string | null {
  const storedToken = useAuthStore.getState().accessToken
  if (storedToken) return storedToken

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

function buildHeaders(body?: unknown, extraHeaders: Record<string, string> = {}): Record<string, string> | undefined {
  const headers: Record<string, string> = { ...extraHeaders }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const accessToken = getAccessToken()
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  return Object.keys(headers).length > 0 ? headers : undefined
}

async function fetchJsonOnce(path: string, method: HttpMethod, body?: unknown): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(body),
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })
}

function errorMessageFromPayload(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message: unknown }).message === 'string') {
    return (payload as { message: string }).message
  }
  return `API request failed (${status})`
}

async function requestJsonWithSingleSessionRenewal<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const run = async (allowRenewal: boolean): Promise<T> => {
    const response = await fetchJsonOnce(path, method, body)

    if (response.ok) {
      if (response.status === 204) {
        return null as T
      }
      return (await response.json()) as T
    }

    const payload = await safeJson(response)

    if (allowRenewal && shouldRenewSessionAfterError(response.status, payload)) {
      try {
        const nextAuth = await refreshAuthSession()
        useAuthStore.getState().setCredentials(nextAuth)
        return run(false)
      } catch {
        await purgeSessionAndRedirectToLogin()
      }
    }

    throw new Error(errorMessageFromPayload(payload, response.status))
  }

  return run(true)
}

export async function apiRequest<T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
  return requestJsonWithSingleSessionRenewal<T>(path, method, body)
}

export async function adminRequest<T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
  return requestJsonWithSingleSessionRenewal<T>(path, method, body)
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}
