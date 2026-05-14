// Задание 5.1: типы карточки рецензии для витрины.
import type { ConcertId } from './concert'

export type ReviewScores = {
  performance: number
  setlist: number
  crowd: number
  sound: number
  vibe: number
}

export type ReviewMediaAttachment = {
  id: string
  type: 'image' | 'video'
  url: string
  file_size?: number | null
  status?: string
}

export type ReviewLikeUser = {
  name: string
  username?: string
  avatar_url?: string | null
}

export type ReviewCardItem = {
  review_id?: string
  concert_id?: string
  id: number
  concertId: ConcertId
  author_name: string
  author_username?: string
  author_avatar_url: string | null
  concert_title: string
  concert_artist: string
  concert_poster_url: string | null
  rating_total?: number
  scores?: ReviewScores
  text: string
  media?: ReviewMediaAttachment[]
  likes?: ReviewLikeUser[]
  likes_count?: number
  is_liked_by_me?: boolean
  status?: string
  rejection_reason?: string | null
  created_at?: string
}

export function getReviewConcertIdKey(review: Pick<ReviewCardItem, 'concert_id' | 'concertId'>): string {
  return String(review.concert_id ?? review.concertId)
}

const EMPTY_REVIEW_SCORES: ReviewScores = {
  performance: 0,
  setlist: 0,
  crowd: 0,
  sound: 0,
  vibe: 0,
}

/** Безопасно для данных API, где scores может отсутствовать. */
export function resolveReviewScores(review: Pick<ReviewCardItem, 'scores'>): ReviewScores {
  const s = review.scores
  if (!s) return EMPTY_REVIEW_SCORES
  return {
    performance: Number(s.performance) || 0,
    setlist: Number(s.setlist) || 0,
    crowd: Number(s.crowd) || 0,
    sound: Number(s.sound) || 0,
    vibe: Number(s.vibe) || 0,
  }
}

