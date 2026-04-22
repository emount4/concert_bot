import { apiRequest } from './client'
import { DATA_SOURCE_MODE } from './config'
import { apiEndpoints } from './endpoints'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { getMockUserByDisplayName, getMockUserByUsername } from '../data/mockUsers'
import type { ReviewLikeUser } from '../types/review'

type ListResponse<T> = { items: T[] }

function normalizeReviewId(reviewId: number | string): { id: number | null; raw: string } {
  const raw = String(reviewId)
  const asNumber = typeof reviewId === 'number' ? reviewId : Number(raw)
  return { id: Number.isFinite(asNumber) ? asNumber : null, raw }
}

function enrichMockLikers(likers: ReviewLikeUser[]): ReviewLikeUser[] {
  return likers.map((user) => {
    const fallbackByUsername = user.username ? getMockUserByUsername(user.username) : null
    const fallbackByName = user.name ? getMockUserByDisplayName(user.name) : null

    return {
      ...user,
      username: user.username ?? fallbackByName?.username ?? undefined,
      avatar_url: user.avatar_url ?? fallbackByUsername?.avatar_url ?? fallbackByName?.avatar_url ?? null,
    }
  })
}

export async function loadReviewLikers(reviewId: number | string): Promise<ReviewLikeUser[]> {
  if (DATA_SOURCE_MODE === 'mock') {
    const normalized = normalizeReviewId(reviewId)
    const review =
      (normalized.id != null ? MOCK_REVIEWS.find((item) => item.id === normalized.id) : null) ??
      MOCK_REVIEWS.find((item) => item.review_id === normalized.raw) ??
      null

    return enrichMockLikers(review?.likes ?? [])
  }

  const normalized = normalizeReviewId(reviewId)
  const payload = await apiRequest<ListResponse<ReviewLikeUser> | ReviewLikeUser[]>(
    apiEndpoints.reviews.likers(normalized.raw),
  )

  const items = Array.isArray(payload) ? payload : payload.items
  return items
}
