// Задание 3.1: тип карточки артиста для витрины.
export type ArtistCardItem = {
  artist_id?: string
  id: number
  name: string
  photo_url: string | null
  photo_source?: string | null
  avg_rating_total: number | null
  reviews_count?: number
  concerts_count?: number
  social_links?: ArtistSocialLinks | null
}

// API Types for Artists
export type ArtistStats = {
  reviews_count: number
  sum_rating_total: number
  concerts_count: number
  favorites_count: number
  updated_at: string
}

export type ArtistSocialLinks = {
  instagram?: string | null
  spotify?: string | null
  website?: string | null
  youtube?: string | null
  twitter?: string | null
  [key: string]: string | null | undefined
}

export type Artist = {
  id: number
  name: string
  description: string
  photo_url: string | null
  social_links?: ArtistSocialLinks | null
  stats?: ArtistStats
  status: string
  created_at: string
}

export type CreateArtistPayload = {
  name: string
  description?: string
  photo_key?: string
  social_links?: ArtistSocialLinks
}

export type UpdateArtistPayload = {
  name?: string
  description?: string
  photo_key?: string
  social_links?: ArtistSocialLinks | null
}

export type AdminArtistResponse = {
  id: number
  name: string
  description: string
  photo_url: string | null
  social_links?: ArtistSocialLinks | null
  stats?: ArtistStats
  status: string
  created_at: string
  deleted_at?: string | null
  is_deleted?: boolean
}

