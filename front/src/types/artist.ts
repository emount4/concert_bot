// Задание 3.1: тип карточки артиста для витрины.
export type ArtistCardItem = {
  id: number
  nickname: string
  imageUrl: string | null
  avgConcertScore: number | null
}
