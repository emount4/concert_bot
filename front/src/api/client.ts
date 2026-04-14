import { API_BASE_URL } from './config'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export async function apiRequest<T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = (await safeJson(response)) as { message?: string } | null
    throw new Error(payload?.message ?? `API request failed (${response.status})`)
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}
