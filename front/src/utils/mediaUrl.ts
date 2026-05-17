import { API_BASE_URL, MEDIA_BASE_URL } from '../api/config'

export function resolveApiAssetUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value

  const apiOrigin = new URL(API_BASE_URL, globalThis.location?.origin).origin
  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  return `${apiOrigin}${normalizedPath}`
}

export function resolveMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value

  const normalizedKey = value.replace(/^\/+/, '')
  if (MEDIA_BASE_URL) {
    return `${MEDIA_BASE_URL.replace(/\/+$/, '')}/${normalizedKey}`
  }

  return resolveApiAssetUrl(value)
}

export function resolveMediaKey(value: string | null | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed || /^(?:data:|blob:)/i.test(trimmed)) return null

  if (MEDIA_BASE_URL && /^https?:/i.test(trimmed)) {
    const normalizedBase = MEDIA_BASE_URL.replace(/\/+$/, '')
    if (trimmed === normalizedBase) return null
    if (trimmed.startsWith(`${normalizedBase}/`)) {
      return trimmed.slice(normalizedBase.length + 1).replace(/^\/+/, '')
    }
  }

  return trimmed.replace(/^\/+/, '')
}
