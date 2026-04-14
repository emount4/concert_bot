// Задание 2.1: типы приближены к схеме из plan.txt и API-концертам.
export type Artist = {
  artist_id?: string
  id?: string | number
  name: string
}

export type Venue = {
  venue_id?: string
  id?: string | number
  name: string
  city: string
  address: string
  photo_url: string | null
}

export type ConcertStats = {
  avg_rating_total: number | null
  reviews_count: number
}

export type Concert = {
  concert_id?: string
  id?: string | number
  title: string | null
  date: string
  poster_url: string | null
  venue: Venue
  artists: Artist[]
  stats: ConcertStats
}

