// Задание 6.1: типы профиля для экрана «Мой профиль».
export type ProfileReviewStatus = 'approved' | 'pending' | 'rejected'

export type ProfileReviewItem = {
  id: number
  concertTitle: string
  createdAt: string
  status: ProfileReviewStatus
  overallScore: number
}

export type UserProfile = {
  id: number
  displayName: string
  handle: string
  createdAt: string
  bio: string
  reviewsCount: number
  approvedCount: number
  pendingCount: number
  avatarUrl: string | null
  recentReviews: ProfileReviewItem[]
}
