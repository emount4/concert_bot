// Задание 4.1: тип карточки площадки для витрины.
export type VenueCardItem = {
  id: number
  name: string
  city: string
  capacity: number
  photo_url: string | null
  avg_rating_total: number | null
}

