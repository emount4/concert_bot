import type { AdminVenue } from './admin'
import { resolveMediaUrl } from '../utils/mediaUrl'

// Задание 4.1: тип карточки площадки для витрины.
export type VenueCardItem = {
  venue_id?: string
  id: number
  name: string
  city: string
  capacity: number
  photo_url: string | null
  photo_source?: string | null
  avg_rating_total: number | null
  favorites_count?: number
  social_links?: VenueSocialLinks | null
}

// ——— API (Venues resource) ———

export type VenueStatsResponse = {
  reviews_count: number
  sum_rating_total: number
  concerts_count: number
  favorites_count: number
  updated_at: string
}

export type VenueSocialLinks = Record<string, string>

/** Вложенный город в ответе GET /admin/venues (и др.). */
export type VenueCityBrief = {
  id: number
  name: string
  slug: string
}

export type VenueResponse = {
  id: number
  /** Публичный список часто отдаёт только city_id. */
  city_id?: number
  /** Админский список может отдавать вложенный объект city вместо city_id. */
  city?: VenueCityBrief | null
  name: string
  address: string
  capacity: number
  photo_url?: string | null
  description?: string
  social_links?: VenueSocialLinks | null
  stats?: VenueStatsResponse
  status: string
  created_at: string
}

export type VenueResponseAdmin = VenueResponse & {
  is_deleted?: boolean
  deleted_at?: string | null
}

/** Город для карточки / админки: из embed или из справочника по city_id. */
export function resolveVenueCityLabel(
  venue: Pick<VenueResponse, 'city' | 'city_id'>,
  cityNameById: Map<number, string>,
): string {
  const embedded = venue.city
  if (embedded && typeof embedded.name === 'string' && embedded.name.trim()) {
    return embedded.name.trim()
  }
  const cid = venue.city_id
  return typeof cid === 'number' ? cityNameById.get(cid) ?? '' : ''
}

export function resolveVenueCityId(venue: Pick<VenueResponse, 'city' | 'city_id'>): number | undefined {
  const embedded = venue.city
  if (embedded && typeof embedded.id === 'number') return embedded.id
  const cid = venue.city_id
  return typeof cid === 'number' ? cid : undefined
}

export type CreateVenueRequest = {
  city_id: number
  name: string
  address: string
  capacity: number
  photo_key?: string | null
  description: string
  social_links?: VenueSocialLinks | null
}

export type UpdateVenueRequest = {
  city_id?: number
  name?: string
  address?: string
  capacity?: number
  photo_key?: string | null
  description?: string
  social_links?: VenueSocialLinks | null
}

export type ListVenuesResponse = {
  items: VenueResponse[]
  page_count: number
}

export type ListVenuesAdminResponse = {
  items: VenueResponseAdmin[]
  page_count: number
}

/** Query for GET /venues (public). */
export type PublicVenuesListParams = {
  limit?: number
  offset?: number
  city_id?: number
  search?: string
  capacity_from?: number
  capacity_to?: number
  sort?: 'name' | 'rating' | 'capacity' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | string
  direction?: 'ASC' | 'DESC'
}

/** Query for GET /admin/venues. */
export type AdminVenuesListParams = {
  limit?: number
  offset?: number
  city_id?: number
  search?: string
  sort?: 'name' | 'rating' | 'capacity' | string
  direction?: 'ASC' | 'DESC'
  capacity_from?: number
  capacity_to?: number
  include_deleted?: boolean
  status?: string
}

export function buildPublicVenuesQuery(params: PublicVenuesListParams): string {
  const q = new URLSearchParams()
  if (params.limit !== undefined) q.set('limit', String(params.limit))
  if (params.offset !== undefined) q.set('offset', String(params.offset))
  if (params.city_id !== undefined) q.set('city_id', String(params.city_id))
  if (params.search !== undefined && params.search.trim()) q.set('search', params.search.trim())
  if (params.capacity_from !== undefined) q.set('capacity_from', String(params.capacity_from))
  if (params.capacity_to !== undefined) q.set('capacity_to', String(params.capacity_to))
  if (params.sort) q.set('sort', params.sort)
  if (params.direction) q.set('direction', params.direction)
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function buildAdminVenuesQuery(params: AdminVenuesListParams): string {
  const q = new URLSearchParams()
  if (params.limit !== undefined) q.set('limit', String(params.limit))
  if (params.offset !== undefined) q.set('offset', String(params.offset))
  if (params.city_id !== undefined) q.set('city_id', String(params.city_id))
  if (params.search !== undefined && params.search.trim()) q.set('search', params.search.trim())
  if (params.sort) q.set('sort', params.sort)
  if (params.direction) q.set('direction', params.direction)
  if (params.capacity_from !== undefined) q.set('capacity_from', String(params.capacity_from))
  if (params.capacity_to !== undefined) q.set('capacity_to', String(params.capacity_to))
  if (params.include_deleted !== undefined) q.set('include_deleted', String(params.include_deleted))
  if (params.status) q.set('status', params.status)
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** Map public venue + city directory to карточку витрины. */
export function mapVenueResponseToCardItem(venue: VenueResponse, cityNameById: Map<number, string>): VenueCardItem {
  const stats = venue.stats
  let avg_rating_total: number | null = null
  if (stats && stats.reviews_count > 0) {
    avg_rating_total = stats.sum_rating_total / stats.reviews_count
  }
  const cityLabel = resolveVenueCityLabel(venue, cityNameById)
  return {
    id: venue.id,
    name: venue.name,
    city: cityLabel,
    capacity: venue.capacity,
    photo_url: resolveMediaUrl(venue.photo_url),
    avg_rating_total,
    favorites_count: stats?.favorites_count ?? 0,
    social_links: venue.social_links ?? null,
  }
}

export function mapVenueResponseToAdminVenue(venue: VenueResponseAdmin, cityLabel: string): AdminVenue {
  const city_id = resolveVenueCityId(venue)
  return {
    id: venue.id,
    name: venue.name,
    city: cityLabel,
    city_id,
    address: venue.address,
    capacity: venue.capacity,
    photo_url: resolveMediaUrl(venue.photo_url),
    description: venue.description,
    social_links: venue.social_links ?? null,
    stats: venue.stats,
    status: venue.status,
    created_at: venue.created_at,
    is_deleted: venue.is_deleted ?? false,
    deleted_at: venue.deleted_at ?? null,
  }
}
