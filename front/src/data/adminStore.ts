import type {
  AdminAccountRole,
  AdminAuditLogEntry,
  AdminCity,
  AdminConcertSuggestion,
  AdminConcertSuggestionStatus,
  AdminProfileChangeRequest,
  AdminProfileChangeStatus,
} from '../types/admin'

// Задание 19.2: localStorage-store для админских очередей/городов/логов (mock-only), чтобы позже заменить на API.

const PROFILE_CHANGES_KEY = 'concert_bot.admin.profile_changes'
const CONCERT_SUGGESTIONS_KEY = 'concert_bot.admin.concert_suggestions'
const CITIES_KEY = 'concert_bot.admin.cities'
const AUDIT_LOGS_KEY = 'concert_bot.admin.audit_logs'

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function seededCities(): AdminCity[] {
  return [
    { id: 1, name: 'Москва', slug: 'moskva', timezone: 'Europe/Moscow' },
    { id: 2, name: 'Санкт-Петербург', slug: 'sankt-peterburg', timezone: 'Europe/Moscow' },
    { id: 3, name: 'Казань', slug: 'kazan', timezone: 'Europe/Moscow' },
    { id: 4, name: 'Екатеринбург', slug: 'ekaterinburg', timezone: 'Asia/Yekaterinburg' },
  ]
}

function seededConcertSuggestions(): AdminConcertSuggestion[] {
  return [
    {
      id: randomId('sugg'),
      created_at: nowIso(),
      status: 'pending',
      suggested_by_username: 'sonya_belkina',
      suggested_by_displayName: 'Соня Белкина',
      artist_name: 'Эхо Города',
      venue_name: 'Сцена 1905',
      city_name: 'Казань',
      date: '2026-05-14T19:30:00Z',
    },
    {
      id: randomId('sugg'),
      created_at: nowIso(),
      status: 'pending',
      suggested_by_username: 'igor_tumanov',
      suggested_by_displayName: 'Игорь Туманов',
      artist_name: 'Пыльца',
      venue_name: 'Парк Арена',
      city_name: 'Екатеринбург',
      date: '2026-05-22T20:00:00Z',
    },
  ]
}

function seededProfileChanges(): AdminProfileChangeRequest[] {
  // Задание 19.4: seed-моки заявок на модерацию профиля (для демо админ-очереди).
  return [
    {
      id: randomId('pch'),
      created_at: '2026-04-13T09:40:00Z',
      requested_by_username: 'mark_reviews',
      requested_by_displayName: 'Марк Колосов',
      type: 'username',
      status: 'pending',
      old_username: 'mark_reviews',
      new_username: 'mark_kolosov',
    },
    {
      id: randomId('pch'),
      created_at: '2026-04-12T18:10:00Z',
      requested_by_username: 'mark_reviews',
      requested_by_displayName: 'Марк Колосов',
      type: 'bio',
      status: 'pending',
      old_bio: 'Хожу на живые концерты с 2017 года. Пишу рецензии без спойлеров и стараюсь отмечать сильные стороны сета.',
      new_bio: 'Пишу рецензии про звук, подачу и зал. Люблю честные лайвы без лишнего пафоса.',
    },
    {
      id: randomId('pch'),
      created_at: '2026-04-11T12:25:00Z',
      requested_by_username: 'mark_reviews',
      requested_by_displayName: 'Марк Колосов',
      type: 'banner',
      status: 'pending',
      old_banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      new_banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: randomId('pch'),
      created_at: '2026-04-10T08:15:00Z',
      requested_by_username: 'mark_reviews',
      requested_by_displayName: 'Марк Колосов',
      type: 'avatar',
      status: 'pending',
      old_avatar_url: null,
      new_avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  ]
}

export function ensureAdminStoreSeeded(): void {
  const currentCities = loadCities()
  if (currentCities.length === 0) {
    saveCities(seededCities())
  }

  const currentSuggestions = loadConcertSuggestions()
  if (currentSuggestions.length === 0) {
    saveConcertSuggestions(seededConcertSuggestions())
  }

  const currentLogs = loadAuditLogs()
  if (currentLogs.length === 0) {
    saveAuditLogs([])
  }

  const currentProfileChanges = loadProfileChangeRequests()
  if (currentProfileChanges.length === 0) {
    saveProfileChangeRequests(seededProfileChanges())
  }
}

export function loadProfileChangeRequests(): AdminProfileChangeRequest[] {
  return safeReadJson<AdminProfileChangeRequest[]>(PROFILE_CHANGES_KEY, [])
}

export function saveProfileChangeRequests(items: AdminProfileChangeRequest[]): void {
  safeWriteJson(PROFILE_CHANGES_KEY, items)
}

export function enqueueProfileChangeRequest(
  req: Omit<AdminProfileChangeRequest, 'id' | 'created_at' | 'status'>,
): AdminProfileChangeRequest {
  const next: AdminProfileChangeRequest = {
    id: randomId('pch'),
    created_at: nowIso(),
    status: 'pending',
    ...req,
  }

  const prev = loadProfileChangeRequests()
  saveProfileChangeRequests([next, ...prev])
  return next
}

export function setProfileChangeStatus(id: string, status: AdminProfileChangeStatus): void {
  const prev = loadProfileChangeRequests()
  const next = prev.map((item) => (item.id === id ? { ...item, status } : item))
  saveProfileChangeRequests(next)
}

export function loadConcertSuggestions(): AdminConcertSuggestion[] {
  return safeReadJson<AdminConcertSuggestion[]>(CONCERT_SUGGESTIONS_KEY, [])
}

export function saveConcertSuggestions(items: AdminConcertSuggestion[]): void {
  safeWriteJson(CONCERT_SUGGESTIONS_KEY, items)
}

export function setConcertSuggestionStatus(id: string, status: AdminConcertSuggestionStatus): void {
  const prev = loadConcertSuggestions()
  const next = prev.map((item) => (item.id === id ? { ...item, status } : item))
  saveConcertSuggestions(next)
}

export function loadCities(): AdminCity[] {
  return safeReadJson<AdminCity[]>(CITIES_KEY, [])
}

export function saveCities(items: AdminCity[]): void {
  safeWriteJson(CITIES_KEY, items)
}

export function upsertCity(nextCity: Omit<AdminCity, 'id'> & { id?: number }): AdminCity {
  const prev = loadCities()

  if (nextCity.id) {
    const updated = prev.map((city) =>
      city.id === nextCity.id
        ? { id: city.id, name: nextCity.name, slug: nextCity.slug, timezone: nextCity.timezone }
        : city,
    )
    saveCities(updated)
    return updated.find((city) => city.id === nextCity.id) as AdminCity
  }

  const nextId = prev.length > 0 ? Math.max(...prev.map((x) => x.id)) + 1 : 1
  const created: AdminCity = {
    id: nextId,
    name: nextCity.name,
    slug: nextCity.slug,
    timezone: nextCity.timezone,
  }
  saveCities([created, ...prev])
  return created
}

export function removeCity(id: number): void {
  const prev = loadCities()
  saveCities(prev.filter((city) => city.id !== id))
}

export function loadAuditLogs(): AdminAuditLogEntry[] {
  return safeReadJson<AdminAuditLogEntry[]>(AUDIT_LOGS_KEY, [])
}

export function saveAuditLogs(items: AdminAuditLogEntry[]): void {
  safeWriteJson(AUDIT_LOGS_KEY, items)
}

export function appendAuditLog(params: {
  actor_displayName: string
  actor_role: AdminAccountRole
  message: string
}): AdminAuditLogEntry {
  const entry: AdminAuditLogEntry = {
    id: randomId('log'),
    created_at: nowIso(),
    actor_displayName: params.actor_displayName,
    actor_role: params.actor_role,
    message: params.message,
  }

  const prev = loadAuditLogs()
  saveAuditLogs([entry, ...prev])
  return entry
}
