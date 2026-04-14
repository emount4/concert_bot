// Задание 3.1: тип карточки артиста для витрины.
export type ArtistCardItem = {
  artist_id?: string
  id?: string | number
  name: string
  photo_url: string | null
  avg_rating_total: number | null
}

