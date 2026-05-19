import type {
  AdminAccountRole,
  AdminAuditLogEntry,
  AdminCity,
  AdminConcertSuggestion,
  AdminConcertSuggestionStatus,
  AdminProfileChangeRequest,
  AdminProfileChangeStatus,
  AdminVenue,
} from '../types/admin'
import {
  createCity,
  deleteCity,
  loadCities as loadCitiesFromApi,
  updateCity,
  createArtist,
  updateArtist,
  deleteArtistSoft,
  deleteArtistHard,
  loadAdminArtists as loadAdminArtistsFromApi,
  loadAdminVenues,
  createVenue,
  updateVenue,
  deleteVenueSoft,
} from '../api/repository'
import type { CreateCityPayload, UpdateCityPayload } from '../types/city'
import type { ArtistSocialLinks, CreateArtistPayload, UpdateArtistPayload, AdminArtistResponse } from '../types/artist'
import type { CreateVenueRequest, UpdateVenueRequest } from '../types/venue'
import { mapVenueResponseToAdminVenue } from '../types/venue'
import { resolveMediaKey } from '../utils/mediaUrl'

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

export async function ensureAdminStoreSeeded(): Promise<void> {
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

export async function loadCities(): Promise<AdminCity[]> {
  try {
    const cities = await loadCitiesFromApi()
    return cities.map((city) => ({
      id: city.city_id,
      name: city.name,
      slug: city.slug,
      timezone: city.timezone,
    }))
  } catch {
    // Fallback to localStorage if API fails
    return safeReadJson<AdminCity[]>(CITIES_KEY, [])
  }
}

export function saveCities(items: AdminCity[]): void {
  safeWriteJson(CITIES_KEY, items)
}

export async function upsertCity(nextCity: Omit<AdminCity, 'id'> & { id?: number }): Promise<AdminCity> {
  try {
    if (nextCity.id) {
      const payload: UpdateCityPayload = {
        name: nextCity.name,
        timezone: nextCity.timezone,
      }
      if (nextCity.slug?.trim()) payload.slug = nextCity.slug.trim()
      const updated = await updateCity(nextCity.id, payload)
      return {
        id: updated.city_id,
        name: updated.name,
        slug: updated.slug,
        timezone: updated.timezone,
      }
    }

    const payload: CreateCityPayload = {
      name: nextCity.name,
      timezone: nextCity.timezone,
    }
    if (nextCity.slug?.trim()) payload.slug = nextCity.slug.trim()
    const created = await createCity(payload)
    return {
      id: created.city_id,
      name: created.name,
      slug: created.slug,
      timezone: created.timezone,
    }
  } catch {
    // Fallback to localStorage if API fails
    const prev = safeReadJson<AdminCity[]>(CITIES_KEY, [])

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
    const result: AdminCity = {
      id: nextId,
      name: nextCity.name,
      slug: nextCity.slug,
      timezone: nextCity.timezone,
    }
    saveCities([result, ...prev])
    return result
  }
}

export async function removeCity(id: number): Promise<void> {
  try {
    await deleteCity(id)
  } catch {
    // Fallback to localStorage if API fails
    const prev = safeReadJson<AdminCity[]>(CITIES_KEY, [])
    saveCities(prev.filter((city) => city.id !== id))
  }
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

// ============ ARTISTS ============

const ARTISTS_KEY = 'concert_bot.admin.artists'

export async function loadArtists(): Promise<AdminArtistResponse[]> {
  try {
    const artists = await loadAdminArtistsFromApi()
    return artists
  } catch {
    // Fallback to localStorage if API fails
    return safeReadJson<AdminArtistResponse[]>(ARTISTS_KEY, [])
  }
}

export function saveArtists(items: AdminArtistResponse[]): void {
  safeWriteJson(ARTISTS_KEY, items)
}

type AdminArtistUpsertInput = {
  id?: number
  name: string
  description: string
  photo_url: string | null
  social_links?: ArtistSocialLinks | null
}

export async function upsertArtist(nextArtist: AdminArtistUpsertInput): Promise<AdminArtistResponse> {
  try {
    if (nextArtist.id) {
      const payload: UpdateArtistPayload = {
        name: nextArtist.name,
        description: nextArtist.description,
        photo_key: resolveMediaKey(nextArtist.photo_url) || undefined,
        social_links: nextArtist.social_links || undefined,
      }
      const updated = await updateArtist(nextArtist.id, payload)
      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        photo_url: updated.photo_url,
        social_links: updated.social_links,
        status: updated.status,
        created_at: updated.created_at,
      }
    }

    const payload: CreateArtistPayload = {
      name: nextArtist.name,
      description: nextArtist.description,
      photo_key: resolveMediaKey(nextArtist.photo_url) || undefined,
      social_links: nextArtist.social_links || undefined,
    }
    const created = await createArtist(payload)
    return {
      id: created.id,
      name: created.name,
      description: created.description,
      photo_url: created.photo_url,
      social_links: created.social_links,
      status: created.status,
      created_at: created.created_at,
    }
  } catch {
    // Fallback to localStorage if API fails
    const prev = safeReadJson<AdminArtistResponse[]>(ARTISTS_KEY, [])

    if (nextArtist.id) {
      const updated = prev.map((artist) =>
        artist.id === nextArtist.id
          ? {
              id: artist.id,
              name: nextArtist.name,
              description: nextArtist.description,
              photo_url: nextArtist.photo_url,
              social_links: nextArtist.social_links,
              status: artist.status,
              created_at: artist.created_at,
            }
          : artist,
      )
      saveArtists(updated)
      return updated.find((artist) => artist.id === nextArtist.id) as AdminArtistResponse
    }

    const nextId = prev.length > 0 ? Math.max(...prev.map((x) => x.id)) + 1 : 1
    const result: AdminArtistResponse = {
      id: nextId,
      name: nextArtist.name,
      description: nextArtist.description,
      photo_url: nextArtist.photo_url,
      social_links: nextArtist.social_links,
      status: 'active',
      created_at: nowIso(),
    }
    saveArtists([result, ...prev])
    return result
  }
}

export async function removeArtist(
  id: number,
  hardDelete: boolean = false,
): Promise<void> {
  try {
    if (hardDelete) {
      await deleteArtistHard(id)
    } else {
      await deleteArtistSoft(id)
    }
  } catch {
    // Fallback to localStorage if API fails
    const prev = safeReadJson<AdminArtistResponse[]>(ARTISTS_KEY, [])
    saveArtists(prev.filter((artist) => artist.id !== id))
  }
}

// ============ VENUES ============

const VENUES_KEY = 'concert_bot.admin.venues'

function resolveCityName(cities: AdminCity[], cityId: number): string {
  return cities.find((c) => c.id === cityId)?.name ?? ''
}

export async function loadVenues(): Promise<AdminVenue[]> {
  try {
    return await loadAdminVenues({ include_deleted: true })
  } catch {
    return safeReadJson<AdminVenue[]>(VENUES_KEY, [])
  }
}

export function saveVenues(items: AdminVenue[]): void {
  safeWriteJson(VENUES_KEY, items)
}

type AdminVenueUpsertInput = {
  id?: number
  city_id: number
  name: string
  address: string
  capacity: number
  photo_url: string | null
  description?: string
  social_links?: Record<string, string> | null
}

export async function upsertVenue(next: AdminVenueUpsertInput): Promise<AdminVenue> {
  const cities = await loadCities().catch(() => [] as AdminCity[])
  const cityLabel = resolveCityName(cities, next.city_id)

  try {
    if (next.id) {
      const payload: UpdateVenueRequest = {
        name: next.name,
        address: next.address,
        capacity: next.capacity,
        photo_key: resolveMediaKey(next.photo_url) || undefined,
        description: next.description ?? '',
        city_id: next.city_id,
        social_links: next.social_links ?? null,
      }
      const updated = await updateVenue(next.id, payload)
      const citiesAfter = await loadCities().catch(() => cities)
      return mapVenueResponseToAdminVenue(updated, resolveCityName(citiesAfter, updated.city_id ?? next.city_id))
    }

    const payload: CreateVenueRequest = {
      city_id: next.city_id,
      name: next.name,
      address: next.address,
      capacity: next.capacity,
      photo_key: resolveMediaKey(next.photo_url) || undefined,
      description: next.description?.trim() || '',
      social_links: next.social_links ?? null,
    }
    const created = await createVenue(payload)
    const citiesAfter = await loadCities().catch(() => cities)
    return mapVenueResponseToAdminVenue(created, resolveCityName(citiesAfter, created.city_id ?? next.city_id))
  } catch {
    const prev = safeReadJson<AdminVenue[]>(VENUES_KEY, [])

    if (next.id) {
      const updated = prev.map((v) =>
        v.id === next.id
          ? {
              ...v,
              name: next.name,
              city: cityLabel,
              city_id: next.city_id,
              address: next.address,
              capacity: next.capacity,
              photo_url: next.photo_url,
              social_links: next.social_links ?? null,
            }
          : v,
      )
      saveVenues(updated)
      return updated.find((x) => x.id === next.id) as AdminVenue
    }

    const nextId = prev.length > 0 ? Math.max(...prev.map((x) => x.id)) + 1 : 1
    const result: AdminVenue = {
      id: nextId,
      name: next.name,
      city: cityLabel,
      city_id: next.city_id,
      address: next.address,
      capacity: next.capacity,
      photo_url: next.photo_url,
      social_links: next.social_links ?? null,
    }
    saveVenues([result, ...prev])
    return result
  }
}

export async function removeVenue(id: number): Promise<void> {
  try {
    await deleteVenueSoft(id)
  } catch {
    const prev = safeReadJson<AdminVenue[]>(VENUES_KEY, [])
    saveVenues(prev.filter((v) => v.id !== id))
  }
}

