// Задание 4.1: тип карточки площадки для витрины.
export type VenueCardItem = {
  id: number
  name: string
  city: string
  capacity: number
  imageUrl: string | null
  avgVenueScore: number | null
}
