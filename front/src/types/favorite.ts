export type FavoriteTargetType = 'artist' | 'venue' | 'concert'

export type FavoriteItem = {
  id: number
  target_type: FavoriteTargetType
  target_id: string
  name: string
  image_url: string | null
  created_at: string
}
