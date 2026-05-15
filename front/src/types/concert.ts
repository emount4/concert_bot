// Задание 2.1: типы приближены к схеме из plan.txt и API-концертам.
export type ConcertId = string | number

export type Artist = {
  artist_id?: string
  id: ConcertId
  name: string
  is_main?: boolean
}

export type Venue = {
  venue_id?: string
  id: ConcertId
  name: string
  city: string
  address?: string | null
  photo_url?: string | null
}

export type ConcertStats = {
  avg_rating_total: number | null
  reviews_count: number
  avg_p1?: number | null
  avg_p2?: number | null
  avg_p3?: number | null
  avg_p4?: number | null
  avg_p5?: number | null
  updated_at?: string | null
}

export type UserReviewStatus = 'pending' | 'approved' | 'rejected'

export type Concert = {
  concert_id?: string
  id: ConcertId
  title: string | null
  date: string
  poster_url: string | null
  poster_source?: string | null
  is_verified?: boolean
  user_review_status?: UserReviewStatus | null
  venue: Venue
  artists: Artist[]
  stats: ConcertStats
  created_at?: string
}

export function getConcertIdKey(concert: Pick<Concert, 'id' | 'concert_id'>): string {
  return String(concert.concert_id ?? concert.id)
}

