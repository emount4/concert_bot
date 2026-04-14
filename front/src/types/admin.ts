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
  created_at: string
  status: AdminConcertSuggestionStatus
  suggested_by_username: string
  suggested_by_displayName: string
  artist_name: string
  venue_name: string
  city_name: string
  date: string
}

export type AdminCity = {
  id: number
  name: string
  slug: string
  timezone: string
}

export type AdminAuditLogEntry = {
  id: string
  created_at: string
  actor_displayName: string
  actor_role: AdminAccountRole
  message: string
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
  created_at: string
  rating_total: number
  status: AdminReviewStatus
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

export type AdminVenue = {
  venue_id?: string
  id: number
  name: string
  city: string
  address: string
  capacity: number
  photo_url: string | null
}

export type AdminConcert = {
  concert_id?: string
  id: number
  title: string
  date: string
  venue_id: number
  artist_ids: number[]
  poster_url: string | null
}

export type AdminAccountRole = 'user' | 'admin' | 'super_admin' | 'super-admin'

export type AdminAccount = {
  user_id?: string
  id: number
  displayName: string
  handle: string
  role: AdminAccountRole
  is_banned: boolean
  is_current: boolean
}

