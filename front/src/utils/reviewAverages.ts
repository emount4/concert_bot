import type { ReviewCardItem } from '../types/review'
import { resolveReviewScores } from '../types/review'

export type AvgScores = {
  performance: number
  setlist: number
  crowd: number
  sound: number
  vibe: number
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

export function computeAvgScoresFromReviews(reviews: ReviewCardItem[]): AvgScores | null {
  // Задание 13.2: средние оценки по параметрам (округление до десятых).
  if (reviews.length === 0) return null

  const sums = reviews.reduce(
    (acc, review) => {
      const s = resolveReviewScores(review)
      acc.performance += s.performance
      acc.setlist += s.setlist
      acc.crowd += s.crowd
      acc.sound += s.sound
      acc.vibe += s.vibe
      return acc
    },
    { performance: 0, setlist: 0, crowd: 0, sound: 0, vibe: 0 },
  )

  return {
    performance: roundToTenth(sums.performance / reviews.length),
    setlist: roundToTenth(sums.setlist / reviews.length),
    crowd: roundToTenth(sums.crowd / reviews.length),
    sound: roundToTenth(sums.sound / reviews.length),
    vibe: roundToTenth(sums.vibe / reviews.length),
  }
}
