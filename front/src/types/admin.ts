// Задание 8.1: типы админ-панели (модерация и CRUD сущностей).

export type AdminReviewStatus = 'pending' | 'approved' | 'rejected'

// Задание 19.1: типы админ-очереди (модерация профиля/предложения), географии и audit-логов.

export type AdminProfileChangeType = 'username' | 'bio' | 'avatar' | 'banner'
export type AdminProfileChangeStatus = 'pending' | 'approved' | 'rejected'

export type AdminProfileChangeRequest = {
  id: string
  created_at: string
  requested_by_username: string
  requested_by_displayName: string
  type: AdminProfileChangeType
  status: AdminProfileChangeStatus

  old_username?: string | null
  new_username?: string | null

  old_bio?: string | null
  new_bio?: string | null

  old_avatar_url?: string | null
  new_avatar_url?: string | null

  old_banner_url?: string | null
  new_banner_url?: string | null
}

export type AdminConcertSuggestionStatus = 'pending' | 'created' | 'rejected'

export type AdminConcertSuggestion = {
  id: string
  user_id?: string
  created_at: string
  status: AdminConcertSuggestionStatus
  suggested_by_username: string
  suggested_by_displayName: string
  artist_name: string
  venue_name: string
  city_name?: string
  date: string
  info?: string | null
}

export type AdminCity = {
  id: number
  name: string
  slug?: string
  timezone: string
}

export type AdminAuditLogTargetType = 'user' | 'review' | 'artist' | 'venue' | 'concert' | 'city'

export type AdminAuditLogEntry = {
  id: string | number
  created_at: string
  message?: string
  actor_displayName?: string
  actor_role?: AdminAccountRole
  moderator?: {
    id?: string
    username?: string
  }
  action?: string
  target_id?: string | null
  target_type?: AdminAuditLogTargetType | string | null
  details?: Record<string, unknown> | null
}

export type AdminReviewAttachment = {
  id: string
  type: 'image' | 'video'
  url: string
}

export type AdminReviewModerationItem = {
  review_id?: string
  id: number
  author_name: string
  author_username?: string
  concert_title: string
  title?: string
  created_at: string
  rating_total: number
  status: AdminReviewStatus
  rejection_reason?: string | null
  text: string
  media?: AdminReviewAttachment[]
}

export type AdminArtist = {
  artist_id?: string
  id: number
  name: string
  description: string
  photo_url: string | null
}

export type AdminVenueStats = {
  reviews_count: number
  sum_rating_total: number
  concerts_count: number
  favorites_count: number
  updated_at: string
}

export type AdminVenue = {
  venue_id?: string
  id: number
  name: string
  city: string
  /** Совпадает с city_id бэкенда; для моков может отсутствовать. */
  city_id?: number
  address: string
  capacity: number
  photo_url: string | null
  description?: string
  social_links?: Record<string, string> | null
  stats?: AdminVenueStats
  status?: string
  is_deleted?: boolean
  deleted_at?: string | null
  created_at?: string
}

export type AdminConcert = {
  concert_id?: string
  id: string | number
  title: string
  date: string
  venue_id: number
  artist_ids: number[]
  poster_url: string | null
  is_verified?: boolean
  created_by_user_id?: string | null
  created_at?: string
  deleted_at?: string | null
  venue?: {
    id: number
    name: string
    city: string
  }
  artists?: Array<{
    id: number
    name: string
    is_main?: boolean
  }>
  stats?: {
    reviews_count: number
    avg_rating_total: number | null
    avg_p1?: number | null
    avg_p2?: number | null
    avg_p3?: number | null
    avg_p4?: number | null
    avg_p5?: number | null
    updated_at?: string | null
  } | null
}

export type AdminAccountRole = 'user' | 'admin' | 'super_admin' | 'super-admin'

export type AdminAccountStats = {
  reviews_count: number
  likes_given_count: number
  likes_received_count: number
}

export type AdminAccount = {
  user_id?: string
  id: string | number
  email?: string
  username?: string
  bio?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  telegram_id?: number | null
  telegram_username?: string | null
  role_id?: number
  displayName: string
  handle: string
  role: AdminAccountRole
  is_email_verified?: boolean
  is_active?: boolean
  is_banned: boolean
  banned_by_user_id?: string | null
  created_at?: string
  updated_at?: string
  stats?: AdminAccountStats
  is_current: boolean
}

