// Задание 6.1: типы профиля для экрана «Мой профиль».
export type ProfileReviewStatus = 'approved' | 'pending' | 'rejected'

export type ProfileReviewItem = {
  review_id?: string
  id?: string | number
  concert_title: string
  created_at: string
  status: ProfileReviewStatus
  rating_total: number
}

export type UserProfile = {
  user_id?: string
  id?: string | number
  displayName: string
  handle: string
  created_at: string
  bio: string
  reviews_count: number
  approved_count: number
  pending_count: number
  avatar_url: string | null
  recent_reviews: ProfileReviewItem[]
}

