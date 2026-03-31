// Задание 5.1: типы карточки рецензии для витрины.
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
}

export type ReviewCardItem = {
  id: number
  concertId: number
  authorName: string
  authorAvatarUrl: string | null
  concertTitle: string
  concertArtist: string
  concertPosterUrl: string | null
  overallScore: number
  scores: ReviewScores
  text: string
  media?: ReviewMediaAttachment[]
}
