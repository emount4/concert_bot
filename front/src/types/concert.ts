// Задание 2.1: типы приближены к схеме из plan.txt и API-концертам.
export type Artist = {
  id: number
  name: string
}

export type Venue = {
  id: number
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
  id: number
  title: string | null
  date: string
  poster_url: string | null
  venue: Venue
  artists: Artist[]
  stats: ConcertStats
}

