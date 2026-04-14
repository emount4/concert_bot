export type UUID = string

export type ModerationStatus = 'pending' | 'approved' | 'rejected'
export type ContentStatus = 'active' | 'hidden' | 'archived'
export type TargetType = 'concert' | 'artist' | 'venue' | 'review' | 'user'
export type VerificationType = 'registration' | 'password_reset'
export type RoleName = 'user' | 'admin' | 'super_admin'

export type CityDto = {
  city_id: number
  name: string
  slug: string
  timezone: string
  created_at: string
}

export type RoleDto = {
  role_id: number
  name: RoleName
  permissions: Record<string, boolean> | null
  created_at: string
}

export type UserDto = {
  user_id: UUID
  email: string
  password_hash: string
  tg_id: number | null
  tg_username: string | null
  role_id: number
  username: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  is_email_verified: boolean
  is_active: boolean
  is_banned: boolean
  banned_by_user_id: UUID | null
  created_at: string
  updated_at: string
}

export type EmailVerificationDto = {
  verification_id: number
  user_id: UUID
  code: string
  type: VerificationType
  expires_at: string
  created_at: string
}

export type LoginAttemptDto = {
  attempt_id: number
  identifier: string | null
  success: boolean
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type ProfileModerationDto = {
  moderation_id: number
  user_id: UUID
  field_name: string
  old_value: string | null
  new_value: string | null
  status: ModerationStatus
  moderated_by_user_id: UUID | null
  created_at: string
}

export type VenueDto = {
  venue_id: UUID
  city_id: number
  name: string
  address: string | null
  capacity: number | null
  social_links: Record<string, string> | null
  photo_url: string | null
  description: string | null
  status: ContentStatus
  created_at: string
  deleted_at: string | null
}

export type ArtistDto = {
  artist_id: UUID
  name: string
  description: string | null
  photo_url: string | null
  social_links: Record<string, string> | null
  status: ContentStatus
  created_at: string
  deleted_at: string | null
}

export type ConcertDto = {
  concert_id: UUID
  venue_id: UUID
  title: string | null
  date: string
  poster_url: string | null
  is_verified: boolean
  created_by_user_id: UUID | null
  created_at: string
  deleted_at: string | null
}

export type ConcertArtistDto = {
  concert_id: UUID
  artist_id: UUID
  is_main: boolean
}

export type ConcertSuggestionDto = {
  suggestion_id: UUID
  user_id: UUID
  raw_artist_name: string | null
  raw_venue_name: string | null
  concert_date: string | null
  info: string | null
  status: ModerationStatus
  created_at: string
}

export type ReviewDto = {
  review_id: UUID
  user_id: UUID
  concert_id: UUID
  title: string | null
  text: string | null
  original_text: string | null
  p1: number
  p2: number
  p3: number
  p4: number
  p5: number
  rating_total: number | null
  status: ModerationStatus
  rejection_reason: string | null
  moderated_by_user_id: UUID | null
  is_visible: boolean
  created_at: string
  deleted_at: string | null
}

export type ReviewMediaDto = {
  media_id: UUID
  review_id: UUID
  media_url: string
  media_type: 'image' | 'video'
  file_size: number | null
  status: ModerationStatus
  created_at: string
}

export type ReviewLikeDto = {
  like_id: number
  user_id: UUID
  review_id: UUID
  created_at: string
}

export type FavoriteDto = {
  favorite_id: number
  user_id: UUID
  target_id: UUID
  target_type: TargetType
  created_at: string
}

export type ConcertStatsDto = {
  concert_id: UUID
  sum_p1: number
  sum_p2: number
  sum_p3: number
  sum_p4: number
  sum_p5: number
  sum_rating_total: number
  reviews_count: number
  updated_at: string
}

export type ArtistStatsDto = {
  artist_id: UUID
  sum_rating_total: number
  reviews_count: number
  updated_at: string
}

export type VenueStatsDto = {
  venue_id: UUID
  sum_rating_total: number
  reviews_count: number
  updated_at: string
}

export type UserStatsDto = {
  user_id: UUID
  reviews_count: number
  likes_given_count: number
  likes_received_count: number
  updated_at: string
}

export type ModerationLogDto = {
  log_id: number
  moderator_user_id: UUID | null
  action: string
  target_id: UUID | null
  target_type: TargetType | null
  details: Record<string, unknown> | null
  created_at: string
}

export type PaginationMetaDto = {
  next_cursor?: string
  page?: number
  page_size?: number
  total?: number
}

export type ApiListResponseDto<T> = {
  items: T[]
  meta?: PaginationMetaDto
}

export type ApiErrorResponseDto = {
  error_code: string
  message: string
  details?: Record<string, unknown>
}
