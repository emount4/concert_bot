// Задание 8.1: типы админ-панели (модерация и CRUD сущностей).

export type AdminReviewStatus = 'pending' | 'approved' | 'rejected'

export type AdminReviewAttachment = {
  id: string
  type: 'image' | 'video'
  url: string
}

export type AdminReviewModerationItem = {
  id: number
  author_name: string
  concert_title: string
  created_at: string
  rating_total: number
  status: AdminReviewStatus
  text: string
  media?: AdminReviewAttachment[]
}

export type AdminArtist = {
  id: number
  name: string
  description: string
  photo_url: string | null
}

export type AdminVenue = {
  id: number
  name: string
  city: string
  address: string
  capacity: number
  photo_url: string | null
}

export type AdminConcert = {
  id: number
  title: string
  date: string
  venue_id: number
  artist_ids: number[]
  poster_url: string | null
}

export type AdminAccountRole = 'user' | 'admin' | 'super-admin'

export type AdminAccount = {
  id: number
  displayName: string
  handle: string
  role: AdminAccountRole
  is_banned: boolean
  is_current: boolean
}

