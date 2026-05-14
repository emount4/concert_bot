import { adminRequest, apiRequest } from './client'
import { API_BASE_URL, DATA_SOURCE_MODE } from './config'
import { apiEndpoints } from './endpoints'
import { MOCK_ADMIN_ACCOUNTS, MOCK_ADMIN_ARTISTS, MOCK_ADMIN_CONCERTS, MOCK_ADMIN_REVIEWS, MOCK_ADMIN_VENUES } from '../data/mockAdmin'
import { MOCK_ARTISTS } from '../data/mockArtists'
import { MOCK_CONCERTS } from '../data/mockConcerts'
import { MOCK_PROFILE } from '../data/mockProfile'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { MOCK_VENUES } from '../data/mockVenues'
import { applyProfileOverrides } from '../data/profileStore'
import type { AdminAccount, AdminArtist, AdminConcert, AdminConcertSuggestion, AdminReviewModerationItem, AdminVenue } from '../types/admin'
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
type PagedListResponse<T> = ListResponse<T> & { page_count?: number }
type AdminConcertListParams = {
  limit?: number
  offset?: number
  sort?: string
  direction?: string
  include_deleted?: boolean
}
type PublicConcertListParams = {
  limit?: number
  offset?: number
  sort?: string
  direction?: string
}
type PublicReviewsListParams = {
  limit?: number
  offset?: number
  sort?: string
  direction?: string
}
type AdminConcertSuggestionsParams = {
  limit?: number
  offset?: number
  status?: string
}
type AdminReviewsListParams = {
  limit?: number
  offset?: number
}
export type AdminConcertArtistPayload = {
  artist_id: number
  is_main: boolean
}
export type CreateAdminConcertPayload = {
  venue_id: number
  title: string
  date: string
  poster_key?: string
  artists: AdminConcertArtistPayload[]
}
export type UpdateAdminConcertPayload = Partial<{
  venue_id: number
  title: string
  date: string
  poster_key: string
  is_verified: boolean
}>
export type ApproveReviewPayload = {
  final_title: string
  final_text: string
  allowed_media_ids: string[]
}
export type CreateConcertSuggestionPayload = {
  artist_name?: string
  venue_name?: string
  date: string
  info?: string
}
export type ConcertSuggestionResponse = {
  id: string
  user_id: string
  artist_name: string
  venue_name: string
  date: string
  info?: string
  created_at: string
}
export type CreateReviewPayload = {
  concert_id: string
  title: string
  text: string
  p1: number
  p2: number
  p3: number
  p4: number
  p5: number
  media_keys?: string[]
}
type ReviewApiResponse = {
  review_id: string
  user_id?: string
  concert_id: string
  title?: string | null
  text?: string | null
  p1: number
  p2: number
  p3: number
  p4: number
  p5: number
  rating_total?: number | null
  status?: string
  rejection_reason?: string | null
  created_at?: string
  author?: {
    id?: string
    username?: string
    avatar_url?: string | null
  } | null
  concert_title?: string | null
  media?: Array<{
    media_id: string
    review_id?: string
    media_url: string
    media_type: 'image' | 'video'
    file_size?: number | null
    status?: string
    created_at?: string
  }>
  likes_count?: number
  is_liked_by_me?: boolean
}
type BatchUploadResponse = {
  items: Array<{
    file_key: string
    upload_url: string
    upload_form?: Record<string, string> | null
  }>
}

function resolveApiAssetUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value

  const apiOrigin = new URL(API_BASE_URL, globalThis.location?.origin).origin
  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  return `${apiOrigin}${normalizedPath}`
}

function mapConcertResponseToConcert(concert: Concert): Concert {
  return {
    ...concert,
    concert_id: concert.concert_id ?? String(concert.id),
    poster_url: resolveApiAssetUrl(concert.poster_url),
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    q.set(key, String(value))
  })
  const query = q.toString()
  return query ? `?${query}` : ''
}

function mapAdminConcertResponseToAdminConcert(concert: AdminConcert): AdminConcert {
  const artists = concert.artists ?? []

  return {
    ...concert,
    concert_id: concert.concert_id ?? String(concert.id),
    poster_url: resolveApiAssetUrl(concert.poster_url),
    venue_id: concert.venue_id ?? concert.venue?.id ?? 0,
    artist_ids: Array.isArray(concert.artist_ids) ? concert.artist_ids : artists.map((artist) => artist.id),
    stats: concert.stats ?? null,
  }
}

function mapAdminConcertSuggestionResponse(suggestion: AdminConcertSuggestion): AdminConcertSuggestion {
  return {
    ...suggestion,
    status: suggestion.status ?? 'pending',
    suggested_by_username: suggestion.suggested_by_username ?? suggestion.user_id ?? 'unknown',
    suggested_by_displayName: suggestion.suggested_by_displayName ?? suggestion.user_id ?? 'Неизвестный пользователь',
  }
}

function numericIdFromString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function mapReviewResponseToCardItem(review: ReviewApiResponse, concerts: Concert[] = []): ReviewCardItem {
  const concert = concerts.find((item) => String(item.concert_id ?? item.id) === String(review.concert_id))
  const authorName = review.author?.username ?? 'unknown'
  return {
    id: numericIdFromString(review.review_id),
    review_id: review.review_id,
    concert_id: review.concert_id,
    concertId: review.concert_id,
    author_name: authorName,
    author_username: review.author?.username,
    author_avatar_url: resolveApiAssetUrl(review.author?.avatar_url),
    concert_title: review.concert_title ?? concert?.title ?? 'Концерт',
    concert_artist: concert?.artists.map((artist) => artist.name).join(', ') ?? '',
    concert_poster_url: concert?.poster_url ?? null,
    rating_total: review.rating_total ?? undefined,
    scores: {
      performance: Number(review.p1) || 0,
      setlist: Number(review.p2) || 0,
      crowd: Number(review.p3) || 0,
      sound: Number(review.p4) || 0,
      vibe: Number(review.p5) || 0,
    },
    text: review.text ?? '',
    media: (review.media ?? []).map((media) => ({
      id: media.media_id,
      type: media.media_type,
      url: resolveApiAssetUrl(media.media_url) ?? media.media_url,
      file_size: media.file_size,
      status: media.status,
    })),
    likes_count: review.likes_count ?? 0,
    is_liked_by_me: review.is_liked_by_me ?? false,
    status: review.status,
    rejection_reason: review.rejection_reason,
    created_at: review.created_at,
  }
}

function mapReviewResponseToAdminModerationItem(review: ReviewApiResponse): AdminReviewModerationItem {
  const authorName = review.author?.username ?? review.user_id ?? 'unknown'
  return {
    id: numericIdFromString(review.review_id),
    review_id: review.review_id,
    author_name: authorName,
    author_username: review.author?.username,
    concert_title: review.concert_title ?? 'Концерт',
    title: review.title ?? '',
    created_at: review.created_at ?? '',
    rating_total: review.rating_total ?? 0,
    status: (review.status ?? 'pending') as AdminReviewModerationItem['status'],
    text: review.text ?? '',
    media: (review.media ?? []).map((media) => ({
      id: media.media_id,
      type: media.media_type,
      url: resolveApiAssetUrl(media.media_url) ?? media.media_url,
    })),
  }
}

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
    loadConcerts().then((res) => res.items),
    apiRequest<ListResponse<ArtistCardItem>>(apiEndpoints.artists.list).then((res) => res.items),
    loadVenuesForBootstrap(),
    loadReviews().then((res) => res.items),
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

export async function loadReviews(params?: PublicReviewsListParams): Promise<PagedListResponse<ReviewCardItem>> {
  if (DATA_SOURCE_MODE === 'mock') {
    return {
      items: MOCK_REVIEWS,
      page_count: 1,
    }
  }

  const query = buildQuery(params ?? {})
  const response = await apiRequest<PagedListResponse<ReviewApiResponse>>(`${apiEndpoints.reviews.list}${query}`)
  const concerts = await loadConcerts()
    .then((res) => res.items)
    .catch((): Concert[] => [])
  return {
    ...response,
    items: response.items.map((review) => mapReviewResponseToCardItem(review, concerts)),
  }
}

export async function loadReviewById(reviewId: string | number): Promise<ReviewCardItem> {
  if (DATA_SOURCE_MODE === 'mock') {
    const review =
      MOCK_REVIEWS.find((item) => String(item.review_id ?? item.id) === String(reviewId)) ??
      MOCK_REVIEWS.find((item) => String(item.id) === String(reviewId))
    if (!review) throw new Error('Review not found')
    return review
  }

  const response = await apiRequest<ReviewApiResponse>(apiEndpoints.reviews.byId(String(reviewId)))
  const concerts = await loadConcerts()
    .then((res) => res.items)
    .catch((): Concert[] => [])
  return mapReviewResponseToCardItem(response, concerts)
}

export async function createReview(payload: CreateReviewPayload): Promise<ReviewCardItem> {
  if (DATA_SOURCE_MODE === 'mock') {
    const created: ReviewApiResponse = {
      review_id: `local_${Date.now()}`,
      concert_id: payload.concert_id,
      title: payload.title,
      text: payload.text,
      p1: payload.p1,
      p2: payload.p2,
      p3: payload.p3,
      p4: payload.p4,
      p5: payload.p5,
      rating_total: payload.p1 + payload.p2 + payload.p3 + payload.p4 + payload.p5,
      status: 'pending',
      author: {
        username: MOCK_PROFILE.handle,
        avatar_url: MOCK_PROFILE.avatar_url,
      },
      concert_title: MOCK_CONCERTS.find((concert) => String(concert.id) === payload.concert_id || concert.concert_id === payload.concert_id)?.title ?? 'Концерт',
      media: [],
      likes_count: 0,
      is_liked_by_me: false,
      created_at: new Date().toISOString(),
    }
    return mapReviewResponseToCardItem(created, MOCK_CONCERTS)
  }

  const response = await apiRequest<ReviewApiResponse>(apiEndpoints.reviews.create, 'POST', payload)
  const concerts = await loadConcerts()
    .then((res) => res.items)
    .catch((): Concert[] => [])
  return mapReviewResponseToCardItem(response, concerts)
}

async function uploadFileWithTicket(file: File, ticket: BatchUploadResponse['items'][number]): Promise<void> {
  if (ticket.upload_form && Object.keys(ticket.upload_form).length > 0) {
    const form = new FormData()
    Object.entries(ticket.upload_form).forEach(([key, value]) => {
      form.append(key, value)
    })
    form.append('file', file)

    const response = await fetch(ticket.upload_url, {
      method: 'POST',
      body: form,
    })
    if (!response.ok) {
      throw new Error(`Не удалось загрузить файл ${file.name}`)
    }
    return
  }

  const response = await fetch(ticket.upload_url, {
    method: 'PUT',
    headers: file.type ? { 'Content-Type': file.type } : undefined,
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл ${file.name}`)
  }
}

export async function uploadReviewMedia(files: File[]): Promise<string[]> {
  if (files.length === 0) return []

  if (DATA_SOURCE_MODE === 'mock') {
    return files.map((file) => `uploads/${file.name}`)
  }

  const response = await apiRequest<BatchUploadResponse>(apiEndpoints.reviews.presignUpload, 'POST', {
    files: files.map((file) => ({
      filename: file.name,
      file_size: file.size,
    })),
  })

  if (response.items.length !== files.length) {
    throw new Error('Сервис загрузки вернул неверное количество ссылок.')
  }

  await Promise.all(response.items.map((ticket, index) => uploadFileWithTicket(files[index], ticket)))
  return response.items.map((item) => item.file_key)
}

export async function loadConcerts(params?: PublicConcertListParams): Promise<PagedListResponse<Concert>> {
  if (DATA_SOURCE_MODE === 'mock') {
    return {
      items: MOCK_CONCERTS.map(mapConcertResponseToConcert),
      page_count: 1,
    }
  }

  const query = buildQuery(params ?? {})
  const response = await apiRequest<PagedListResponse<Concert>>(`${apiEndpoints.concerts.list}${query}`)
  return {
    ...response,
    items: response.items.map(mapConcertResponseToConcert),
  }
}

export async function loadConcertById(concertId: string | number): Promise<Concert> {
  if (DATA_SOURCE_MODE === 'mock') {
    const concert = MOCK_CONCERTS.find((item) => String(item.concert_id ?? item.id) === String(concertId))
    if (!concert) throw new Error('Concert not found')
    return mapConcertResponseToConcert(concert)
  }

  const response = await apiRequest<Concert>(apiEndpoints.concerts.byId(String(concertId)))
  return mapConcertResponseToConcert(response)
}

export async function createConcertSuggestion(
  payload: CreateConcertSuggestionPayload,
): Promise<ConcertSuggestionResponse> {
  if (DATA_SOURCE_MODE === 'mock') {
    return {
      id: `local_${Date.now()}`,
      user_id: 'mock_user',
      artist_name: payload.artist_name ?? '',
      venue_name: payload.venue_name ?? '',
      date: payload.date,
      info: payload.info,
      created_at: new Date().toISOString(),
    }
  }

  return apiRequest<ConcertSuggestionResponse>(apiEndpoints.concerts.suggest, 'POST', payload)
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
    adminRequest<PagedListResponse<ReviewApiResponse>>(apiEndpoints.admin.pendingReviews).then((res) =>
      res.items.map(mapReviewResponseToAdminModerationItem),
    ),
    adminRequest<ListResponse<AdminArtist>>(apiEndpoints.admin.artists).then((res) => res.items),
    loadAdminVenuesMapped({ include_deleted: true }),
    loadAdminConcerts({ include_deleted: true }),
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

export async function loadAdminReviews(params?: AdminReviewsListParams): Promise<AdminReviewModerationItem[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return MOCK_ADMIN_REVIEWS
  }

  const query = buildQuery(params ?? {})
  const response = await adminRequest<PagedListResponse<ReviewApiResponse>>(`${apiEndpoints.admin.pendingReviews}${query}`)
  return response.items.map(mapReviewResponseToAdminModerationItem)
}

export async function approveAdminReview(
  reviewId: string,
  payload: ApproveReviewPayload,
): Promise<AdminReviewModerationItem | null> {
  if (DATA_SOURCE_MODE === 'mock') {
    return null
  }

  const response = await adminRequest<ReviewApiResponse | null>(apiEndpoints.admin.approveReview(reviewId), 'POST', payload)
  return response ? mapReviewResponseToAdminModerationItem(response) : null
}

export async function loadAdminVenues(params?: AdminVenuesListParams): Promise<AdminVenue[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return MOCK_ADMIN_VENUES
  }

  return loadAdminVenuesMapped(params ?? { include_deleted: true })
}

export async function loadAdminConcerts(params?: AdminConcertListParams): Promise<AdminConcert[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return MOCK_ADMIN_CONCERTS
  }

  const query = buildQuery(params ?? {})
  const response = await adminRequest<PagedListResponse<AdminConcert>>(`${apiEndpoints.admin.concerts}${query}`)
  return response.items.map(mapAdminConcertResponseToAdminConcert)
}

export async function loadAdminConcertSuggestionById(suggestionId: string): Promise<AdminConcertSuggestion> {
  if (DATA_SOURCE_MODE === 'mock') {
    throw new Error('Mock mode does not support getting individual concert suggestions')
  }

  const response = await adminRequest<AdminConcertSuggestion>(apiEndpoints.admin.concertSuggestionById(suggestionId))
  return mapAdminConcertSuggestionResponse(response)
}

export async function loadAdminConcertSuggestions(
  params?: AdminConcertSuggestionsParams,
): Promise<AdminConcertSuggestion[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    throw new Error('Mock mode does not support admin concert suggestions API')
  }

  const query = buildQuery(params ?? {})
  const response = await adminRequest<ListResponse<AdminConcertSuggestion>>(
    `${apiEndpoints.admin.concertSuggestions}${query}`,
  )
  return response.items.map(mapAdminConcertSuggestionResponse)
}

export async function createAdminConcert(payload: CreateAdminConcertPayload): Promise<AdminConcert> {
  if (DATA_SOURCE_MODE === 'mock') {
    const nextId = `local_${Date.now()}`
    return mapAdminConcertResponseToAdminConcert({
      id: nextId,
      title: payload.title,
      date: payload.date,
      venue_id: payload.venue_id,
      artist_ids: payload.artists.map((artist) => artist.artist_id),
      poster_url: payload.poster_key ?? null,
      artists: payload.artists.map((artist) => ({ id: artist.artist_id, name: String(artist.artist_id), is_main: artist.is_main })),
    })
  }

  const response = await adminRequest<AdminConcert>(apiEndpoints.admin.concerts, 'POST', payload)
  return mapAdminConcertResponseToAdminConcert(response)
}

export async function updateAdminConcert(
  concertId: string | number,
  payload: UpdateAdminConcertPayload,
): Promise<AdminConcert> {
  if (DATA_SOURCE_MODE === 'mock') {
    throw new Error('Mock mode does not support updating admin concerts API')
  }

  const response = await adminRequest<AdminConcert>(apiEndpoints.admin.concertById(String(concertId)), 'PATCH', payload)
  return mapAdminConcertResponseToAdminConcert(response)
}

export async function restoreAdminConcert(concertId: string | number): Promise<AdminConcert> {
  if (DATA_SOURCE_MODE === 'mock') {
    throw new Error('Mock mode does not support restoring admin concerts API')
  }

  const response = await adminRequest<AdminConcert>(apiEndpoints.admin.concertRestore(String(concertId)), 'POST')
  return mapAdminConcertResponseToAdminConcert(response)
}

export async function deleteAdminConcertSoft(concertId: string | number): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return
  await adminRequest<void>(apiEndpoints.admin.concertDeleteSoft(String(concertId)), 'DELETE')
}

export async function deleteAdminConcertHard(concertId: string | number): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return
  await adminRequest<void>(apiEndpoints.admin.concertDeleteHard(String(concertId)), 'DELETE')
}

export async function deleteAdminConcertSuggestion(suggestionId: string): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return
  await adminRequest<void>(apiEndpoints.admin.concertSuggestionById(suggestionId), 'DELETE')
}

export async function addAdminConcertArtist(
  concertId: string | number,
  payload: AdminConcertArtistPayload,
): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return
  await adminRequest<void>(apiEndpoints.admin.concertArtists(String(concertId)), 'POST', payload)
}

export async function updateAdminConcertArtist(
  concertId: string | number,
  artistId: string | number,
  payload: Pick<AdminConcertArtistPayload, 'is_main'>,
): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return
  await adminRequest<void>(apiEndpoints.admin.concertArtistById(String(concertId), artistId), 'PATCH', payload)
}

export async function deleteAdminConcertArtist(concertId: string | number, artistId: string | number): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return
  await adminRequest<void>(apiEndpoints.admin.concertArtistById(String(concertId), artistId), 'DELETE')
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

