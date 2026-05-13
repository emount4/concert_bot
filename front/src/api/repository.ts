import { adminRequest, apiRequest } from './client'
import { DATA_SOURCE_MODE } from './config'
import { apiEndpoints } from './endpoints'
import { MOCK_ADMIN_ACCOUNTS, MOCK_ADMIN_ARTISTS, MOCK_ADMIN_CONCERTS, MOCK_ADMIN_REVIEWS, MOCK_ADMIN_VENUES } from '../data/mockAdmin'
import { MOCK_ARTISTS } from '../data/mockArtists'
import { MOCK_CONCERTS } from '../data/mockConcerts'
import { MOCK_PROFILE } from '../data/mockProfile'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { MOCK_VENUES } from '../data/mockVenues'
import { applyProfileOverrides } from '../data/profileStore'
import type { AdminAccount, AdminArtist, AdminConcert, AdminReviewModerationItem, AdminVenue } from '../types/admin'
import type { Artist, ArtistCardItem, CreateArtistPayload, UpdateArtistPayload, AdminArtistResponse } from '../types/artist'
import type { City, CreateCityPayload, UpdateCityPayload } from '../types/city'
import type { Concert } from '../types/concert'
import type { UserProfile } from '../types/profile'
import type { ReviewCardItem } from '../types/review'
import type {
  VenueCardItem,
  VenueResponse,
  VenueResponseAdmin,
  ListVenuesResponse,
  ListVenuesAdminResponse,
  CreateVenueRequest,
  UpdateVenueRequest,
  AdminVenuesListParams,
  PublicVenuesListParams,
  VenueStatsResponse,
} from '../types/venue'
import { mapVenueResponseToCardItem, buildPublicVenuesQuery, buildAdminVenuesQuery, mapVenueResponseToAdminVenue, resolveVenueCityLabel } from '../types/venue'

type ListResponse<T> = { items: T[] }

function adminVenueFromApiRow(row: VenueResponseAdmin, cityNameById: Map<number, string>): AdminVenue {
  const cityLabel = resolveVenueCityLabel(row, cityNameById)
  return mapVenueResponseToAdminVenue(row, cityLabel)
}

async function loadVenuesForBootstrap(): Promise<VenueCardItem[]> {
  const venuesQuery = buildPublicVenuesQuery({ limit: 500 })
  const [vRes, cRes] = await Promise.allSettled([
    apiRequest<ListVenuesResponse>(`${apiEndpoints.venues.list}${venuesQuery}`),
    loadCities(),
  ])
  const items = vRes.status === 'fulfilled' ? vRes.value.items : []
  const cities = cRes.status === 'fulfilled' ? cRes.value : []
  const cityMap = new Map(cities.map((c) => [c.city_id, c.name]))
  return items.map((v) => mapVenueResponseToCardItem(v, cityMap))
}

async function loadAdminVenuesMapped(params?: AdminVenuesListParams): Promise<AdminVenue[]> {
  const q = buildAdminVenuesQuery(params ?? {})
  const [resp, cities] = await Promise.all([
    adminRequest<ListVenuesAdminResponse>(`${apiEndpoints.admin.venues}${q}`),
    loadCities().catch((): City[] => []),
  ])
  const cityMap = new Map(cities.map((c) => [c.city_id, c.name]))
  return resp.items.map((row) => adminVenueFromApiRow(row, cityMap))
}

export type AppBootstrapData = {
  concerts: Concert[]
  artists: ArtistCardItem[]
  venues: VenueCardItem[]
  reviews: ReviewCardItem[]
  profile: UserProfile
}

export type AdminSeedData = {
  reviews: AdminReviewModerationItem[]
  artists: AdminArtist[]
  venues: AdminVenue[]
  concerts: AdminConcert[]
  accounts: AdminAccount[]
}

function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase()
}

export async function loadAppBootstrapData(): Promise<AppBootstrapData> {
  if (DATA_SOURCE_MODE === 'mock') {
    const baseProfile = MOCK_PROFILE
    const profile = applyProfileOverrides(baseProfile)

    const baseUsername = normalizeUsername(baseProfile.handle)
    const currentUsername = normalizeUsername(profile.handle)

    const reviews: ReviewCardItem[] = MOCK_REVIEWS.map((review) => {
      const reviewUsername = normalizeUsername(review.author_username ?? '')
      if (!baseUsername || !currentUsername || reviewUsername !== baseUsername) return review

      return {
        ...review,
        author_username: currentUsername,
        author_avatar_url: profile.avatar_url,
      }
    })

    return {
      concerts: MOCK_CONCERTS,
      artists: MOCK_ARTISTS,
      venues: MOCK_VENUES,
      reviews,
      profile,
    }
  }

  const results = await Promise.allSettled([
    apiRequest<ListResponse<Concert>>(apiEndpoints.concerts.list).then((res) => res.items),
    apiRequest<ListResponse<ArtistCardItem>>(apiEndpoints.artists.list).then((res) => res.items),
    loadVenuesForBootstrap(),
    apiRequest<ListResponse<ReviewCardItem>>(apiEndpoints.reviews.list).then((res) => res.items),
    apiRequest<UserProfile>(apiEndpoints.users.me),
  ])

  // Extract values with fallbacks
  const concerts = results[0].status === 'fulfilled' ? results[0].value : []
  const artists = results[1].status === 'fulfilled' ? results[1].value : []
  const venues = results[2].status === 'fulfilled' ? results[2].value : []
  const reviews = results[3].status === 'fulfilled' ? results[3].value : []
  const profile = results[4].status === 'fulfilled' ? results[4].value : ({} as UserProfile)

  // Log any failures
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const names = ['concerts', 'artists', 'venues', 'reviews', 'profile']
      console.warn(`[loadAppBootstrapData] Failed to load ${names[idx]}:`, result.reason)
    }
  })

  return {
    concerts,
    artists,
    venues,
    reviews,
    profile,
  }
}

// Admin data - loaded lazily only when needed
export async function loadAdminData(): Promise<AdminSeedData> {
  if (DATA_SOURCE_MODE === 'mock') {
    const adminAccounts: AdminAccount[] = MOCK_ADMIN_ACCOUNTS

    return {
      reviews: MOCK_ADMIN_REVIEWS,
      artists: MOCK_ADMIN_ARTISTS,
      venues: MOCK_ADMIN_VENUES,
      concerts: MOCK_ADMIN_CONCERTS,
      accounts: adminAccounts,
    }
  }

  const results = await Promise.allSettled([
    adminRequest<ListResponse<AdminReviewModerationItem>>(apiEndpoints.admin.pendingReviews).then((res) => res.items),
    adminRequest<ListResponse<AdminArtist>>(apiEndpoints.admin.artists).then((res) => res.items),
    loadAdminVenuesMapped({ include_deleted: true }),
    adminRequest<ListResponse<AdminConcert>>(apiEndpoints.admin.concerts).then((res) => res.items),
    adminRequest<ListResponse<AdminAccount>>(apiEndpoints.admin.users).then((res) => res.items),
  ])

  const adminReviews = results[0].status === 'fulfilled' ? results[0].value : []
  const adminArtists = results[1].status === 'fulfilled' ? results[1].value : []
  const adminVenues = results[2].status === 'fulfilled' ? results[2].value : []
  const adminConcerts = results[3].status === 'fulfilled' ? results[3].value : []
  const adminAccounts = results[4].status === 'fulfilled' ? results[4].value : []

  // Log any failures
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const names = ['adminReviews', 'adminArtists', 'adminVenues', 'adminConcerts', 'adminAccounts']
      console.warn(`[loadAdminData] Failed to load ${names[idx]}:`, result.reason)
    }
  })

  return {
    reviews: adminReviews,
    artists: adminArtists,
    venues: adminVenues,
    concerts: adminConcerts,
    accounts: adminAccounts,
  }
}

export async function loadAdminReviews(): Promise<AdminReviewModerationItem[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return MOCK_ADMIN_REVIEWS
  }

  const response = await adminRequest<ListResponse<AdminReviewModerationItem>>(apiEndpoints.admin.pendingReviews)
  return response.items
}

export async function loadAdminVenues(params?: AdminVenuesListParams): Promise<AdminVenue[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return MOCK_ADMIN_VENUES
  }

  return loadAdminVenuesMapped(params ?? { include_deleted: true })
}

export async function loadAdminConcerts(): Promise<AdminConcert[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return MOCK_ADMIN_CONCERTS
  }

  const response = await adminRequest<ListResponse<AdminConcert>>(apiEndpoints.admin.concerts)
  return response.items
}

export async function loadAdminAccounts(): Promise<AdminAccount[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return MOCK_ADMIN_ACCOUNTS
  }

  const response = await adminRequest<ListResponse<AdminAccount>>(apiEndpoints.admin.users)
  return response.items
}

// Cities API functions
export async function loadCities(limit?: number, offset?: number): Promise<City[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    console.log('[loadCities] Mock mode - returning empty array')
    // Return empty for mock since we don't have MOCK_CITIES
    return []
  }

  console.log('[loadCities] Loading cities from API...', { limit, offset, mode: DATA_SOURCE_MODE })
  
  const params = new URLSearchParams()
  if (limit !== undefined) params.append('limit', limit.toString())
  if (offset !== undefined) params.append('offset', offset.toString())

  const query = params.toString()
  const url = query ? `${apiEndpoints.cities.list}?${query}` : apiEndpoints.cities.list

  try {
    const result = await apiRequest<City[]>(url)
    console.log('[loadCities] Success! Loaded', result.length, 'cities')
    return result
  } catch (error) {
    console.error('[loadCities] Failed to load cities:', error)
    throw error
  }
}

export async function createCity(payload: CreateCityPayload): Promise<City> {
  if (DATA_SOURCE_MODE === 'mock') {
    // Return mock city for mock mode
    return {
      city_id: Math.floor(Math.random() * 1000),
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase(),
      timezone: payload.timezone,
      created_at: new Date().toISOString(),
    }
  }

  return adminRequest<City>(apiEndpoints.cities.create, 'POST', payload)
}

export async function getCityById(cityId: number): Promise<City> {
  if (DATA_SOURCE_MODE === 'mock') {
    throw new Error('Mock mode does not support getting individual cities')
  }

  return apiRequest<City>(apiEndpoints.cities.byId(cityId.toString()))
}

export async function updateCity(cityId: number, payload: UpdateCityPayload): Promise<City> {
  if (DATA_SOURCE_MODE === 'mock') {
    // Return updated mock city
    return {
      city_id: cityId,
      name: payload.name || 'Moscow',
      slug: payload.slug || 'moscow',
      timezone: payload.timezone || 'Europe/Moscow',
      created_at: new Date().toISOString(),
    }
  }

  return adminRequest<City>(apiEndpoints.cities.update(cityId.toString()), 'PATCH', payload)
}

export async function deleteCity(cityId: number): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') {
    // No-op for mock mode
    return
  }

  await adminRequest<void>(apiEndpoints.cities.delete(cityId.toString()), 'DELETE')
}

// ============ VENUES API ============

function mockEmptyVenueStats(): VenueStatsResponse {
  return {
    reviews_count: 0,
    sum_rating_total: 0,
    concerts_count: 0,
    favorites_count: 0,
    updated_at: new Date().toISOString(),
  }
}

export async function loadVenuesList(params?: PublicVenuesListParams): Promise<ListVenuesResponse> {
  if (DATA_SOURCE_MODE === 'mock') {
    return { items: [], page_count: 0 }
  }
  const q = buildPublicVenuesQuery(params ?? {})
  return apiRequest<ListVenuesResponse>(`${apiEndpoints.venues.list}${q}`)
}

export async function loadVenueById(venueId: number | string): Promise<VenueResponse> {
  if (DATA_SOURCE_MODE === 'mock') {
    const v = MOCK_VENUES.find((x) => x.id === Number(venueId))
    if (!v) throw new Error('Venue not found')
    return {
      id: v.id,
      city_id: 0,
      name: v.name,
      address: '',
      capacity: v.capacity,
      photo_url: v.photo_url,
      description: '',
      stats: mockEmptyVenueStats(),
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  return apiRequest<VenueResponse>(apiEndpoints.venues.byId(venueId))
}

export async function createVenue(payload: CreateVenueRequest): Promise<VenueResponse> {
  if (DATA_SOURCE_MODE === 'mock') {
    const nextId = Math.max(0, ...MOCK_VENUES.map((x) => x.id)) + 1
    return {
      id: nextId,
      city_id: payload.city_id,
      name: payload.name,
      address: payload.address,
      capacity: payload.capacity,
      photo_url: null,
      description: payload.description,
      social_links: payload.social_links ?? null,
      stats: mockEmptyVenueStats(),
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  return adminRequest<VenueResponse>(apiEndpoints.venues.create, 'POST', payload)
}

export async function updateVenue(venueId: number | string, payload: UpdateVenueRequest): Promise<VenueResponse> {
  if (DATA_SOURCE_MODE === 'mock') {
    const v = MOCK_VENUES.find((x) => x.id === Number(venueId))
    if (!v) throw new Error('Venue not found')
    return {
      id: v.id,
      city_id: payload.city_id ?? 0,
      name: payload.name ?? v.name,
      address: payload.address ?? '',
      capacity: payload.capacity ?? v.capacity,
      photo_url: v.photo_url,
      description: payload.description ?? '',
      social_links: payload.social_links ?? null,
      stats: mockEmptyVenueStats(),
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  return adminRequest<VenueResponse>(apiEndpoints.venues.update(venueId), 'PATCH', payload)
}

export async function deleteVenueSoft(venueId: number | string): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') {
    return
  }
  await adminRequest<void>(apiEndpoints.venues.deleteSoft(venueId), 'DELETE')
}

export async function deleteVenueHard(venueId: number | string): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') {
    return
  }
  await adminRequest<void>(apiEndpoints.venues.deleteHard(venueId), 'DELETE')
}

export async function restoreVenue(venueId: number | string): Promise<VenueResponse> {
  if (DATA_SOURCE_MODE === 'mock') {
    return loadVenueById(venueId)
  }
  return adminRequest<VenueResponse>(apiEndpoints.venues.restore(venueId), 'POST')
}

// ============ ARTISTS API ============

export async function loadArtists(): Promise<Artist[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    console.log('[loadArtists] Mock mode - returning MOCK_ARTISTS')
    return MOCK_ARTISTS.map((artist) => ({
      id: artist.id,
      name: artist.name,
      description: '',
      photo_url: artist.photo_url,
      status: 'active',
      created_at: new Date().toISOString(),
    })) as Artist[]
  }

  console.log('[loadArtists] Loading artists from API...')
  const response = await apiRequest<ListResponse<Artist>>(apiEndpoints.artists.list)
  return response.items
}

export async function getArtistById(artistId: number | string): Promise<Artist> {
  if (DATA_SOURCE_MODE === 'mock') {
    const artist = MOCK_ARTISTS.find((a) => a.id === Number(artistId))
    if (!artist) throw new Error('Artist not found')
    return {
      id: artist.id,
      name: artist.name,
      description: '',
      photo_url: artist.photo_url,
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  return apiRequest<Artist>(apiEndpoints.artists.byId(artistId))
}

export async function createArtist(payload: CreateArtistPayload): Promise<Artist> {
  if (DATA_SOURCE_MODE === 'mock') {
    const nextId = Math.max(...MOCK_ARTISTS.map((a) => a.id), 0) + 1
    const newArtist: Artist = {
      id: nextId,
      name: payload.name,
      description: payload.description || '',
      photo_url: null,
      social_links: payload.social_links,
      status: 'active',
      created_at: new Date().toISOString(),
    }
    return newArtist
  }

  return apiRequest<Artist>(apiEndpoints.artists.create, 'POST', payload)
}

export async function updateArtist(artistId: number | string, payload: UpdateArtistPayload): Promise<Artist> {
  if (DATA_SOURCE_MODE === 'mock') {
    const artist = MOCK_ARTISTS.find((a) => a.id === Number(artistId))
    if (!artist) throw new Error('Artist not found')
    return {
      id: artist.id,
      name: payload.name || artist.name,
      description: payload.description || '',
      photo_url: artist.photo_url,
      social_links: payload.social_links,
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  return apiRequest<Artist>(apiEndpoints.artists.update(artistId), 'PATCH', payload)
}

export async function deleteArtistSoft(artistId: number | string): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') {
    // No-op for mock mode
    return
  }

  await apiRequest<void>(apiEndpoints.artists.deleteSoft(artistId), 'DELETE')
}

export async function deleteArtistHard(artistId: number | string): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') {
    // No-op for mock mode
    return
  }

  await apiRequest<void>(apiEndpoints.artists.deleteHard(artistId), 'DELETE')
}

export async function restoreArtist(artistId: number | string): Promise<Artist> {
  if (DATA_SOURCE_MODE === 'mock') {
    const artist = MOCK_ARTISTS.find((a) => a.id === Number(artistId))
    if (!artist) throw new Error('Artist not found')
    return {
      id: artist.id,
      name: artist.name,
      description: '',
      photo_url: artist.photo_url,
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  return apiRequest<Artist>(apiEndpoints.artists.restore(artistId), 'POST')
}

export async function loadAdminArtists(
  params?: { include_deleted?: boolean; status?: string; limit?: number; offset?: number },
): Promise<AdminArtistResponse[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    console.log('[loadAdminArtists] Mock mode - returning MOCK_ADMIN_ARTISTS')
    return MOCK_ADMIN_ARTISTS as AdminArtistResponse[]
  }

  console.log('[loadAdminArtists] Loading admin artists from API...', params)
  const queryParams = new URLSearchParams()
  if (params?.include_deleted !== undefined) queryParams.append('include_deleted', String(params.include_deleted))
  if (params?.status) queryParams.append('status', params.status)
  if (params?.limit) queryParams.append('limit', String(params.limit))
  if (params?.offset) queryParams.append('offset', String(params.offset))

  const query = queryParams.toString()
  const url = query ? `${apiEndpoints.admin.artists}?${query}` : apiEndpoints.admin.artists
  const response = await adminRequest<ListResponse<AdminArtistResponse>>(url)
  return response.items
}

