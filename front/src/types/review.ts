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
  review_id?: string
  concert_id?: string
  id?: string | number
  concertId?: string | number
  author_name: string
  author_avatar_url: string | null
  concert_title: string
  concert_artist: string
  concert_poster_url: string | null
  rating_total: number
  scores: ReviewScores
  text: string
  media?: ReviewMediaAttachment[]
}

