import { adminRequest, apiRequest } from './client'
import { DATA_SOURCE_MODE } from './config'
import { apiEndpoints } from './endpoints'
import { MOCK_ADMIN_ACCOUNTS, MOCK_ADMIN_ARTISTS, MOCK_ADMIN_CONCERTS, MOCK_ADMIN_REVIEWS, MOCK_ADMIN_VENUES } from '../data/mockAdmin'
import { MOCK_ARTISTS } from '../data/mockArtists'
import { MOCK_CONCERTS } from '../data/mockConcerts'
import { MOCK_PROFILE } from '../data/mockProfile'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { getMockUserByUsername, MOCK_FAVORITES_BY_USERNAME, MOCK_LIKED_REVIEW_IDS_BY_USERNAME, type MockFavorites } from '../data/mockUsers'
import { MOCK_VENUES } from '../data/mockVenues'
import { applyProfileOverrides } from '../data/profileStore'
import type {
  AdminAccount,
  AdminArtist,
  AdminConcert,
  AdminConcertSuggestion,
  AdminProfileChangeRequest,
  AdminReviewModerationItem,
  AdminVenue,
} from '../types/admin'
import type { Artist, ArtistCardItem, CreateArtistPayload, UpdateArtistPayload, AdminArtistResponse } from '../types/artist'
import type { City, CreateCityPayload, UpdateCityPayload } from '../types/city'
import type { Concert } from '../types/concert'
import type { FavoriteItem, FavoriteTargetType } from '../types/favorite'
import type { UserProfile } from '../types/profile'
import { calculateReviewRating, type ReviewCardItem } from '../types/review'
import { resolveMediaUrl } from '../utils/mediaUrl'
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
  search?: string
  city?: string
  only_rated?: boolean
  upcoming_only?: boolean
}
type PublicReviewsListParams = {
  limit?: number
  offset?: number
  sort?: string
  direction?: string
  concert_id?: string
}
type PublicArtistsListParams = {
  limit?: number
  offset?: number
  sort?: string
  direction?: string
  search?: string
  reviews_filter?: string
}
type AdminConcertSuggestionsParams = {
  limit?: number
  offset?: number
  status?: string
}
type AdminReviewsListParams = {
  limit?: number
  offset?: number
  status?: string
}
type AdminProfileModerationListParams = {
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
  concert?: {
    id: string
    title: string
    poster_url?: string | null
    artists?: Array<{
      id: number
      name: string
    }>
  } | null
  media?: Array<{
    media_id: string
    review_id?: string
    media_url: string
    media_type?: string | null
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

type FavoriteApiResponse = {
  id?: number
  favorite_id?: number
  target_type?: string
  target_id?: string | number
  name?: string | null
  image_url?: string | null
  created_at?: string | null
}

function normalizeReviewMediaType(mediaType: string | null | undefined, mediaUrl: string | null | undefined): 'image' | 'video' {
  const normalizedType = mediaType?.trim().toLowerCase() ?? ''
  if (normalizedType.includes('video') || ['mp4', 'webm', 'mov', 'm4v', 'ogg', 'ogv'].includes(normalizedType)) {
    return 'video'
  }

  const normalizedUrl = mediaUrl?.split('?')[0]?.split('#')[0]?.toLowerCase() ?? ''
  if (/\.(mp4|webm|mov|m4v|ogg|ogv)$/.test(normalizedUrl)) {
    return 'video'
  }

  return 'image'
}
type UserStatsApiResponse = {
  reviews_count: number
  likes_given_count: number
  likes_received_count: number
}
type ProfileReviewApiResponse = {
  review_id: string
  concert_id?: string | null
  title?: string | null
  text?: string | null
  rating?: number | null
  rating_total?: number | null
  p1?: number | null
  p2?: number | null
  p3?: number | null
  p4?: number | null
  p5?: number | null
  created_at?: string | null
  concert_title?: string | null
  concert?: {
    id?: string | null
    title?: string | null
    poster_url?: string | null
    artists?: Array<{
      id?: number
      name?: string | null
    }> | null
  } | null
  likes_count?: number | null
  is_liked_by_me?: boolean | null
  status?: string | null
  rejection_reason?: string | null
  media?: Array<{
    media_id: string
    review_id?: string
    media_url: string
    media_type?: string | null
    file_size?: number | null
    status?: string
    created_at?: string
  }> | null
}
type UserMeApiResponse = {
  id: string
  email: string
  username: string
  bio?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  telegram_id?: number | null
  telegram_username?: string | null
  role_id: number
  is_email_verified: boolean
  is_banned: boolean
  created_at: string
  stats?: UserStatsApiResponse | null
  reviews?: ProfileReviewApiResponse[] | null
}
type PublicProfileApiResponse = {
  id?: string | null
  username: string
  bio?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  created_at: string
  stats?: UserStatsApiResponse | null
  reviews?: ProfileReviewApiResponse[] | null
}
export type UpdateMyProfilePayload = {
  username?: string
  bio?: string | null
  avatar_key?: string | null
  banner_key?: string | null
}
type ProfileModerationApiStatus = 'pending' | 'approved' | 'rejected'
type ProfileModerationApiItem = {
  id: number | string
  user?: {
    id?: string
    username?: string
    avatar_url?: string | null
  } | null
  field_name: string
  old_value?: string | null
  new_value?: string | null
  status: ProfileModerationApiStatus
  moderated_by_user_id?: string | null
  created_at: string
  updated_at?: string | null
}
type ProfileModerationApiResponse = {
  items: ProfileModerationApiItem[]
  page_count?: number
}

function mapConcertResponseToConcert(concert: Concert): Concert {
  return {
    ...concert,
    concert_id: concert.concert_id ?? String(concert.id),
    poster_url: resolveMediaUrl(concert.poster_url),
    artists: (concert.artists ?? []).map((artist) => ({
      ...artist,
      photo_url: resolveMediaUrl(artist.photo_url),
    })),
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
    poster_url: resolveMediaUrl(concert.poster_url),
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

function mapArtistResponseToCardItem(artist: Artist): ArtistCardItem {
  const reviewsCount = artist.stats?.reviews_count ?? 0
  const sumRatingTotal = artist.stats?.sum_rating_total ?? 0
  const avg_rating_total = reviewsCount > 0 ? sumRatingTotal / reviewsCount : null

  return {
    artist_id: String(artist.id),
    id: artist.id,
    name: artist.name,
    photo_url: resolveMediaUrl(artist.photo_url),
    avg_rating_total,
    reviews_count: reviewsCount,
    concerts_count: artist.stats?.concerts_count ?? 0,
    social_links: artist.social_links ?? null,
  }
}

function mapArtistResponseToArtist(artist: Artist): Artist {
  return {
    ...artist,
    photo_url: resolveMediaUrl(artist.photo_url),
  }
}

function mapAdminArtistResponseToAdminArtist(artist: AdminArtistResponse): AdminArtistResponse {
  return {
    ...artist,
    photo_url: resolveMediaUrl(artist.photo_url),
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
  const reviewConcert = review.concert ?? null
  const reviewConcertId = reviewConcert?.id ?? review.concert_id
  const reviewConcertArtists = reviewConcert?.artists?.map((artist) => artist.name).join(', ')
  const authorName = review.author?.username ?? 'unknown'
  const localRating = calculateReviewRating(Number(review.p1) || 0, Number(review.p2) || 0, Number(review.p3) || 0, Number(review.p4) || 0, Number(review.p5) || 0)
  return {
    id: numericIdFromString(review.review_id),
    review_id: review.review_id,
    concert_id: reviewConcertId,
    concertId: reviewConcertId,
    author_id: review.author?.id ?? review.user_id,
    author_name: authorName,
    author_username: review.author?.username,
    author_avatar_url: resolveMediaUrl(review.author?.avatar_url),
    concert_title: review.concert_title ?? concert?.title ?? 'Концерт',
    title: review.title ?? undefined,
    concert_artist: reviewConcertArtists ?? concert?.artists.map((artist) => artist.name).join(', ') ?? '',
    concert_poster_url: resolveMediaUrl(reviewConcert?.poster_url) ?? concert?.poster_url ?? null,
    rating_total: localRating || (review.rating_total ?? undefined),
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
      type: normalizeReviewMediaType(media.media_type, media.media_url),
      url: resolveMediaUrl(media.media_url) ?? media.media_url,
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

function mapProfileReviewResponseToProfileReview(review: ProfileReviewApiResponse): UserProfile['recent_reviews'][number] {
  const hasParams = [review.p1, review.p2, review.p3, review.p4, review.p5].every((value) => typeof value === 'number')
  const localRating = hasParams
    ? calculateReviewRating(Number(review.p1), Number(review.p2), Number(review.p3), Number(review.p4), Number(review.p5))
    : null
  const concert = review.concert ?? null
  return {
    id: numericIdFromString(review.review_id),
    review_id: review.review_id,
    concert_id: review.concert_id ?? concert?.id ?? undefined,
    concert_title: review.concert_title ?? concert?.title ?? 'Концерт',
    concert_poster_url: resolveMediaUrl(concert?.poster_url),
    concert_artist: (concert?.artists ?? []).map((artist) => artist.name).filter(Boolean).join(', '),
    title: review.title ?? '',
    text: review.text ?? '',
    created_at: review.created_at ?? '',
    status: (review.status ?? 'approved') as UserProfile['recent_reviews'][number]['status'],
    rejection_reason: review.rejection_reason ?? null,
    rating_total: localRating ?? review.rating_total ?? review.rating ?? 0,
    p1: review.p1 ?? undefined,
    p2: review.p2 ?? undefined,
    p3: review.p3 ?? undefined,
    p4: review.p4 ?? undefined,
    p5: review.p5 ?? undefined,
    likes_count: review.likes_count ?? 0,
    is_liked_by_me: review.is_liked_by_me ?? false,
    media: (review.media ?? []).map((media) => ({
      id: media.media_id,
      type: normalizeReviewMediaType(media.media_type, media.media_url),
      url: resolveMediaUrl(media.media_url) ?? media.media_url,
      file_size: media.file_size,
      status: media.status,
    })),
  }
}

function mapMeResponseToProfile(profile: UserMeApiResponse): UserProfile {
  const stats = profile.stats
  const reviews = (profile.reviews ?? []).map(mapProfileReviewResponseToProfileReview)
  return {
    user_id: profile.id,
    id: profile.id,
    email: profile.email,
    displayName: profile.username,
    handle: `@${profile.username}`,
    created_at: profile.created_at,
    bio: profile.bio ?? '',
    reviews_count: stats?.reviews_count ?? 0,
    likes_given_count: stats?.likes_given_count ?? 0,
    likes_received_count: stats?.likes_received_count ?? 0,
    approved_count: stats?.reviews_count ?? 0,
    pending_count: 0,
    avatar_url: resolveMediaUrl(profile.avatar_url),
    banner_url: resolveMediaUrl(profile.banner_url),
    telegram_id: profile.telegram_id ?? null,
    telegram_username: profile.telegram_username ?? null,
    role_id: profile.role_id,
    is_email_verified: profile.is_email_verified,
    is_banned: profile.is_banned,
    is_active: !profile.is_banned,
    recent_reviews: reviews,
  }
}

function mapPublicProfileResponseToProfile(profile: PublicProfileApiResponse): UserProfile {
  const stats = profile.stats
  const reviews = (profile.reviews ?? []).map(mapProfileReviewResponseToProfileReview)
  return {
    user_id: profile.id ?? undefined,
    id: profile.id ?? profile.username,
    displayName: profile.username,
    handle: `@${profile.username}`,
    created_at: profile.created_at,
    bio: profile.bio ?? '',
    reviews_count: stats?.reviews_count ?? 0,
    likes_given_count: stats?.likes_given_count ?? 0,
    likes_received_count: stats?.likes_received_count ?? 0,
    approved_count: stats?.reviews_count ?? 0,
    pending_count: 0,
    avatar_url: resolveMediaUrl(profile.avatar_url),
    banner_url: resolveMediaUrl(profile.banner_url),
    is_active: true,
    recent_reviews: reviews,
  }
}

function profileModerationFieldToType(fieldName: string): AdminProfileChangeRequest['type'] {
  if (fieldName === 'avatar_key' || fieldName === 'avatar_url') return 'avatar'
  if (fieldName === 'banner_key' || fieldName === 'banner_url') return 'banner'
  if (fieldName === 'bio') return 'bio'
  return 'username'
}

function mapProfileModerationResponse(item: ProfileModerationApiItem, profile?: UserProfile | null): AdminProfileChangeRequest {
  const type = profileModerationFieldToType(item.field_name)
  const apiUsername = item.user?.username ?? ''
  const displayName = profile?.displayName ?? apiUsername
  const base = {
    id: String(item.id),
    created_at: item.created_at,
    requested_by_username: profile?.handle ? normalizeUsername(profile.handle) : apiUsername,
    requested_by_displayName: displayName,
    type,
    status: item.status,
  }

  if (type === 'avatar') {
    return {
      ...base,
      old_avatar_url: resolveMediaUrl(item.old_value),
      new_avatar_url: resolveMediaUrl(item.new_value),
    }
  }

  if (type === 'banner') {
    return {
      ...base,
      old_banner_url: resolveMediaUrl(item.old_value),
      new_banner_url: resolveMediaUrl(item.new_value),
    }
  }

  if (type === 'bio') {
    return {
      ...base,
      old_bio: item.old_value ?? null,
      new_bio: item.new_value ?? null,
    }
  }

  return {
    ...base,
    old_username: item.old_value ?? null,
    new_username: item.new_value ?? null,
  }
}

function mapReviewResponseToAdminModerationItem(review: ReviewApiResponse): AdminReviewModerationItem {
  const authorName = review.author?.username ?? review.user_id ?? 'unknown'
  const localRating = calculateReviewRating(Number(review.p1) || 0, Number(review.p2) || 0, Number(review.p3) || 0, Number(review.p4) || 0, Number(review.p5) || 0)
  return {
    id: numericIdFromString(review.review_id),
    review_id: review.review_id,
    author_name: authorName,
    author_username: review.author?.username,
    concert_title: review.concert_title ?? 'Концерт',
    title: review.title ?? '',
    created_at: review.created_at ?? '',
    rating_total: localRating || (review.rating_total ?? 0),
    status: (review.status ?? 'pending') as AdminReviewModerationItem['status'],
    rejection_reason: review.rejection_reason ?? null,
    text: review.text ?? '',
    media: (review.media ?? []).map((media) => ({
      id: media.media_id,
      type: normalizeReviewMediaType(media.media_type, media.media_url),
      url: resolveMediaUrl(media.media_url) ?? media.media_url,
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

const FAVORITES_OVERRIDES_KEY = 'concert_bot.favorites.overrides'
const FAVORITES_REVISION_KEY = 'concert_bot.favorites.revision'
const FAVORITE_TARGET_KEY: Record<FavoriteTargetType, keyof MockFavorites> = {
  artist: 'artists',
  venue: 'venues',
  concert: 'concerts',
}

type FavoritesOverridesStore = Record<string, MockFavorites>

function readFavoritesOverrides(): FavoritesOverridesStore {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(FAVORITES_OVERRIDES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as FavoritesOverridesStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeFavoritesOverrides(value: FavoritesOverridesStore): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(FAVORITES_OVERRIDES_KEY, JSON.stringify(value))
  } catch {
    // ignore storage failures
  }
}

function bumpFavoritesRevision(): number {
  if (typeof window === 'undefined') return 0
  const next = Date.now()
  try {
    window.localStorage.setItem(FAVORITES_REVISION_KEY, String(next))
  } catch {
    // ignore storage failures
  }
  return next
}

export function getFavoritesRevision(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(FAVORITES_REVISION_KEY)
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

function loadMockFavoritesForUser(username: string): MockFavorites {
  const normalized = normalizeUsername(username)
  const overrides = readFavoritesOverrides()
  return overrides[normalized] ?? MOCK_FAVORITES_BY_USERNAME[normalized] ?? { artists: [], venues: [], concerts: [] }
}

function saveMockFavoritesForUser(username: string, favorites: MockFavorites): void {
  const normalized = normalizeUsername(username)
  const overrides = readFavoritesOverrides()
  overrides[normalized] = favorites
  writeFavoritesOverrides(overrides)
  bumpFavoritesRevision()
}

function toMockFavoriteId(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (Number.isFinite(parsed)) return parsed
  return numericIdFromString(String(value))
}

function mapFavoriteApiItem(item: FavoriteApiResponse): FavoriteItem {
  const id = item.id ?? item.favorite_id ?? numericIdFromString(`${item.target_type ?? 'favorite'}:${item.target_id ?? ''}`)
  const targetType = (item.target_type ?? 'concert') as FavoriteTargetType
  return {
    id,
    target_type: targetType,
    target_id: String(item.target_id ?? ''),
    name: item.name ?? 'Избранное',
    image_url: resolveMediaUrl(item.image_url),
    created_at: item.created_at ?? new Date().toISOString(),
  }
}

function buildMockFavoriteItem(targetType: FavoriteTargetType, targetId: number): FavoriteItem | null {
  if (targetType === 'artist') {
    const artist = MOCK_ARTISTS.find((item) => item.id === targetId)
    if (!artist) return null
    return {
      id: numericIdFromString(`artist:${targetId}`),
      target_type: 'artist',
      target_id: String(targetId),
      name: artist.name,
      image_url: resolveMediaUrl(artist.photo_url),
      created_at: new Date().toISOString(),
    }
  }

  if (targetType === 'venue') {
    const venue = MOCK_VENUES.find((item) => item.id === targetId)
    if (!venue) return null
    return {
      id: numericIdFromString(`venue:${targetId}`),
      target_type: 'venue',
      target_id: String(targetId),
      name: venue.name,
      image_url: resolveMediaUrl(venue.photo_url),
      created_at: new Date().toISOString(),
    }
  }

  const concert = MOCK_CONCERTS.find((item) => Number(item.id) === targetId || Number(item.concert_id) === targetId)
  if (!concert) return null
  return {
    id: numericIdFromString(`concert:${targetId}`),
    target_type: 'concert',
    target_id: String(targetId),
    name: concert.title ?? 'Концерт',
    image_url: resolveMediaUrl(concert.poster_url),
    created_at: new Date().toISOString(),
  }
}

export async function loadMyProfile(includeStatuses = 'approved'): Promise<UserProfile> {
  if (DATA_SOURCE_MODE === 'mock') {
    const statuses = new Set(includeStatuses.split(',').map((status) => status.trim()).filter(Boolean))
    const profile = applyProfileOverrides(MOCK_PROFILE)
    return {
      ...profile,
      recent_reviews: profile.recent_reviews.filter((review) => statuses.has(review.status)),
    }
  }

  const query = buildQuery({ include_statuses: includeStatuses })
  const response = await apiRequest<UserMeApiResponse>(`${apiEndpoints.users.me}${query}`)
  return mapMeResponseToProfile(response)
}

export async function updateMyProfile(payload: UpdateMyProfilePayload): Promise<UserProfile> {
  if (DATA_SOURCE_MODE === 'mock') {
    return loadMyProfile()
  }

  const response = await apiRequest<UserMeApiResponse>(apiEndpoints.users.patchMe, 'PATCH', payload)
  return mapMeResponseToProfile(response)
}

export async function loadMyProfileModerationRequests(
  status?: ProfileModerationApiStatus,
  profile?: UserProfile | null,
): Promise<AdminProfileChangeRequest[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    return []
  }

  const query = status ? buildQuery({ status }) : ''
  const response = await apiRequest<ProfileModerationApiResponse>(`${apiEndpoints.users.profileModeration}${query}`)
  return response.items.map((item) => mapProfileModerationResponse(item, profile))
}

export async function loadAdminProfileModerationRequests(
  params: AdminProfileModerationListParams = { limit: 20, offset: 0 },
): Promise<PagedListResponse<AdminProfileChangeRequest>> {
  if (DATA_SOURCE_MODE === 'mock') {
    return { items: [], page_count: 0 }
  }

  const query = buildQuery({
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  })
  const response = await adminRequest<ProfileModerationApiResponse>(`${apiEndpoints.admin.pendingProfiles}${query}`)
  return {
    items: response.items.map((item) => mapProfileModerationResponse(item)),
    page_count: response.page_count ?? 0,
  }
}

export async function approveAdminProfileModerationRequest(requestId: string | number): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return

  await adminRequest<void>(apiEndpoints.admin.approveProfileRequest(requestId), 'POST')
}

export async function rejectAdminProfileModerationRequest(requestId: string | number): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') return

  await adminRequest<void>(apiEndpoints.admin.rejectProfileRequest(requestId), 'POST')
}

export async function loadPublicProfile(username: string): Promise<UserProfile> {
  const normalized = normalizeUsername(username)
  if (DATA_SOURCE_MODE === 'mock') {
    const current = normalizeUsername(MOCK_PROFILE.handle)
    if (normalized === current) return applyProfileOverrides(MOCK_PROFILE)

    const mockUser = getMockUserByUsername(normalized)
    if (!mockUser) throw new Error('Пользователь не найден')
    return {
      id: normalized,
      displayName: mockUser.displayName,
      handle: `@${mockUser.username}`,
      created_at: mockUser.created_at,
      bio: mockUser.bio ?? '',
      reviews_count: 0,
      approved_count: 0,
      pending_count: 0,
      avatar_url: mockUser.avatar_url,
      banner_url: mockUser.banner_url ?? null,
      is_active: mockUser.is_active ?? true,
      recent_reviews: [],
    }
  }

  const response = await apiRequest<PublicProfileApiResponse>(apiEndpoints.users.profileByUsername(normalized))
  return mapPublicProfileResponseToProfile(response)
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
    apiRequest<ListResponse<Artist>>(apiEndpoints.artists.list).then((res) => res.items.map(mapArtistResponseToCardItem)),
    loadVenuesForBootstrap(),
    loadReviews().then((res) => res.items),
    loadMyProfile(),
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
  return {
    ...response,
    items: response.items.map((review) => mapReviewResponseToCardItem(review)),
  }
}

export async function loadMyLikedReviews(): Promise<ReviewCardItem[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    const profile = applyProfileOverrides(MOCK_PROFILE)
    const username = normalizeUsername(profile.handle)
    const likedIds = new Set((MOCK_LIKED_REVIEW_IDS_BY_USERNAME[username] ?? []).map(String))
    return MOCK_REVIEWS.filter((review) => likedIds.has(String(review.review_id ?? review.id)))
  }

  const response = await apiRequest<PagedListResponse<ReviewApiResponse> | ReviewApiResponse[]>(apiEndpoints.users.likedReviews)
  const items = Array.isArray(response) ? response : response.items
  return items.map((review) => mapReviewResponseToCardItem(review))
}

export async function loadUserLikedReviews(username: string, params: { limit?: number; offset?: number } = {}): Promise<ReviewCardItem[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    const key = normalizeUsername(username)
    const likedIds = new Set((MOCK_LIKED_REVIEW_IDS_BY_USERNAME[key] ?? []).map(String))
    return MOCK_REVIEWS.filter((review) => likedIds.has(String(review.review_id ?? review.id)))
  }

  const query = buildQuery({
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  })
  const response = await apiRequest<PagedListResponse<ReviewApiResponse> | ReviewApiResponse[]>(
    `${apiEndpoints.users.likedReviewsByUsername(username)}${query}`,
  )
  const items = Array.isArray(response) ? response : response.items
  return items.map((review) => mapReviewResponseToCardItem(review))
}

export async function loadUserFavorites(
  username: string,
  params: { type?: FavoriteTargetType } = {},
): Promise<FavoriteItem[]> {
  if (!username) return []

  if (DATA_SOURCE_MODE === 'mock') {
    const favorites = loadMockFavoritesForUser(username)
    const targetTypes: FavoriteTargetType[] = params.type ? [params.type] : ['concert', 'artist', 'venue']
    return targetTypes
      .flatMap((targetType) => {
        const key = FAVORITE_TARGET_KEY[targetType]
        return favorites[key].map((id) => buildMockFavoriteItem(targetType, id)).filter((item): item is FavoriteItem => Boolean(item))
      })
  }

  const response = await apiRequest<ListResponse<FavoriteApiResponse> | FavoriteApiResponse[]>(
    apiEndpoints.favorites.byUsername(username, params.type),
  )
  const items = Array.isArray(response) ? response : response.items
  return items.map(mapFavoriteApiItem)
}

export async function addFavorite(targetType: FavoriteTargetType, targetId: string | number): Promise<FavoriteItem> {
  if (DATA_SOURCE_MODE === 'mock') {
    const profile = applyProfileOverrides(MOCK_PROFILE)
    const username = normalizeUsername(profile.handle)
    const favorites = loadMockFavoritesForUser(username)
    const key = FAVORITE_TARGET_KEY[targetType]
    const normalizedId = toMockFavoriteId(targetId)
    const nextList = favorites[key].includes(normalizedId)
      ? favorites[key]
      : [...favorites[key], normalizedId]
    const next = { ...favorites, [key]: nextList }
    saveMockFavoritesForUser(username, next)
    return (
      buildMockFavoriteItem(targetType, normalizedId) ?? {
        id: numericIdFromString(`${targetType}:${normalizedId}`),
        target_type: targetType,
        target_id: String(normalizedId),
        name: 'Избранное',
        image_url: null,
        created_at: new Date().toISOString(),
      }
    )
  }

  const response = await apiRequest<FavoriteApiResponse>(apiEndpoints.favorites.create, 'POST', {
    target_type: targetType,
    target_id: String(targetId),
  })
  bumpFavoritesRevision()
  return mapFavoriteApiItem(response)
}

export async function removeFavorite(targetType: FavoriteTargetType, targetId: string | number): Promise<void> {
  if (DATA_SOURCE_MODE === 'mock') {
    const profile = applyProfileOverrides(MOCK_PROFILE)
    const username = normalizeUsername(profile.handle)
    const favorites = loadMockFavoritesForUser(username)
    const key = FAVORITE_TARGET_KEY[targetType]
    const normalizedId = toMockFavoriteId(targetId)
    const next = {
      ...favorites,
      [key]: favorites[key].filter((id) => id !== normalizedId),
    }
    saveMockFavoritesForUser(username, next)
    return
  }

  await apiRequest<void>(apiEndpoints.favorites.remove(targetType, String(targetId)), 'DELETE')
  bumpFavoritesRevision()
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
  return mapReviewResponseToCardItem(response)
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
      rating_total: calculateReviewRating(payload.p1, payload.p2, payload.p3, payload.p4, payload.p5),
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
  return mapReviewResponseToCardItem(response)
}

async function uploadFileWithTicket(file: File, ticket: BatchUploadResponse['items'][number]): Promise<void> {
  if (ticket.upload_form && Object.keys(ticket.upload_form).length > 0) {
    const form = new FormData()
    Object.entries(ticket.upload_form).forEach(([key, value]) => {
      if (key !== 'url') {
        form.append(key, value)
      }
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
    adminRequest<ListResponse<AdminArtist>>(apiEndpoints.admin.artists).then((res) =>
      res.items.map((artist) => ({
        ...artist,
        photo_url: resolveMediaUrl(artist.photo_url),
      })),
    ),
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

  if (params?.status === 'approved') {
    const query = buildQuery({
      limit: params.limit,
      offset: params.offset,
      sort: 'created_at',
      direction: 'DESC',
    })
    const response = await apiRequest<PagedListResponse<ReviewApiResponse>>(`${apiEndpoints.reviews.list}${query}`)
    return response.items.map(mapReviewResponseToAdminModerationItem)
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

export async function rejectAdminReview(reviewId: string, reason: string): Promise<AdminReviewModerationItem | null> {
  if (DATA_SOURCE_MODE === 'mock') {
    return null
  }

  const response = await adminRequest<ReviewApiResponse | null>(apiEndpoints.admin.rejectReview(reviewId), 'POST', {
    rejection_reason: reason,
  })
  return response ? mapReviewResponseToAdminModerationItem(response) : null
}

export async function returnAdminReviewToPending(reviewId: string): Promise<AdminReviewModerationItem | null> {
  if (DATA_SOURCE_MODE === 'mock') {
    return null
  }

  const response = await adminRequest<ReviewApiResponse | null>(apiEndpoints.admin.returnReviewToPending(reviewId), 'POST')
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
  return response.items.map(mapArtistResponseToArtist)
}

export async function loadArtistCardsPage(params?: PublicArtistsListParams): Promise<PagedListResponse<ArtistCardItem>> {
  if (DATA_SOURCE_MODE === 'mock') {
    return {
      items: MOCK_ARTISTS,
      page_count: 1,
    }
  }

  const query = buildQuery(params ?? {})
  const response = await apiRequest<PagedListResponse<Artist>>(`${apiEndpoints.artists.list}${query}`)
  return {
    ...response,
    items: response.items.map(mapArtistResponseToCardItem),
  }
}

export async function loadArtistCards(): Promise<ArtistCardItem[]> {
  return loadArtistCardsPage().then((response) => response.items)
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

  const response = await apiRequest<Artist>(apiEndpoints.artists.byId(artistId))
  return mapArtistResponseToArtist(response)
}

export async function createArtist(payload: CreateArtistPayload): Promise<Artist> {
  if (DATA_SOURCE_MODE === 'mock') {
    const nextId = Math.max(...MOCK_ARTISTS.map((a) => a.id), 0) + 1
    const newArtist: Artist = {
      id: nextId,
      name: payload.name,
      description: payload.description || '',
      photo_url: resolveMediaUrl(payload.photo_key) ?? null,
      social_links: payload.social_links,
      status: 'active',
      created_at: new Date().toISOString(),
    }
    return newArtist
  }

  const response = await apiRequest<Artist>(apiEndpoints.artists.create, 'POST', payload)
  return mapArtistResponseToArtist(response)
}

export async function updateArtist(artistId: number | string, payload: UpdateArtistPayload): Promise<Artist> {
  if (DATA_SOURCE_MODE === 'mock') {
    const artist = MOCK_ARTISTS.find((a) => a.id === Number(artistId))
    if (!artist) throw new Error('Artist not found')
    return {
      id: artist.id,
      name: payload.name || artist.name,
      description: payload.description || '',
      photo_url: resolveMediaUrl(payload.photo_key) ?? artist.photo_url,
      social_links: payload.social_links,
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  const response = await adminRequest<Artist>(apiEndpoints.admin.artistById(artistId), 'PATCH', payload)
  return mapArtistResponseToArtist(response)
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

  const response = await apiRequest<Artist>(apiEndpoints.artists.restore(artistId), 'POST')
  return mapArtistResponseToArtist(response)
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
  return response.items.map(mapAdminArtistResponseToAdminArtist)
}

