const DEV_ADMIN_KEY = 'concert_bot.dev_admin'

function isTrue(value: unknown): boolean {
  return String(value).toLowerCase() === 'true'
}

export function resolveIsAdmin(): boolean {
  // TODO: заменить на /api/me и серверный флаг is_admin.
  let fromStorage = false

  if (typeof window !== 'undefined') {
    try {
      const query = new URLSearchParams(window.location.search)
      if (query.get('devAdmin') === '1') {
        window.localStorage.setItem(DEV_ADMIN_KEY, '1')
      }
      if (query.get('devAdmin') === '0') {
        window.localStorage.removeItem(DEV_ADMIN_KEY)
      }

      fromStorage = window.localStorage.getItem(DEV_ADMIN_KEY) === '1'
    } catch {
      fromStorage = false
    }
  }

  const fromEnv = isTrue(import.meta.env.VITE_DEV_ADMIN)
  return fromStorage || fromEnv
}

export function setDevAdmin(enabled: boolean): void {
  if (typeof window === 'undefined') return

  if (enabled) {
    window.localStorage.setItem(DEV_ADMIN_KEY, '1')
    return
  }

  window.localStorage.removeItem(DEV_ADMIN_KEY)
}
