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
  imageUrl: string | null
}

export type ConcertStats = {
  avgOverallScore: number | null
  reviewsCount: number
}

export type Concert = {
  id: number
  title: string | null
  dateTime: string
  bannerImageUrl: string | null
  venue: Venue
  artists: Artist[]
  stats: ConcertStats
}
