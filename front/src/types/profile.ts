// Задание 6.1: типы профиля для экрана «Мой профиль».
export type ProfileReviewStatus = 'approved' | 'pending' | 'rejected'

export type ProfileReviewItem = {
  review_id?: string
  concert_id?: string
  concert_poster_url?: string | null
  concert_artist?: string
  id: number
  concert_title: string
  title: string
  text: string
  created_at: string
  status: ProfileReviewStatus
  rejection_reason?: string | null
  rating_total: number
  p1?: number
  p2?: number
  p3?: number
  p4?: number
  p5?: number
  likes_count?: number
  is_liked_by_me?: boolean
  media?: Array<{
    id: string
    type: 'image' | 'video'
    url: string
    file_size?: number | null
    status?: string
  }>
}

export type UserProfile = {
  user_id?: string
  id: number | string
  email?: string
  displayName: string
  handle: string
  created_at: string
  bio: string
  reviews_count: number
  likes_given_count?: number
  likes_received_count?: number
  approved_count: number
  pending_count: number
  avatar_url: string | null
  banner_url?: string | null
  telegram_id?: number | null
  telegram_username?: string | null
  role_id?: number
  is_email_verified?: boolean
  is_banned?: boolean
  is_active?: boolean
  recent_reviews: ProfileReviewItem[]
}

