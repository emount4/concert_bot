import type { ArtistCardItem } from '../types/artist'

// Задание 3.2: мок-данные для вкладки артистов.
// Задание 3.4: реальные изображения для карточек артистов.
const ARTIST_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
]

const RAW_ARTISTS: ArtistCardItem[] = [
  {
    id: 101,
    nickname: 'Северный Ветер',
    imageUrl: null,
    avgConcertScore: 89.6,
  },
  {
    id: 102,
    nickname: 'Джаз Трамвай',
    imageUrl: null,
    avgConcertScore: 84.2,
  },
  {
    id: 103,
    nickname: 'Эхо Города',
    imageUrl: null,
    avgConcertScore: null,
  },
  {
    id: 104,
    nickname: 'Пыльца',
    imageUrl: null,
    avgConcertScore: 78.3,
  },
  {
    id: 105,
    nickname: 'Лунный Канал',
    imageUrl: null,
    avgConcertScore: 83.1,
  },
  {
    id: 106,
    nickname: 'Стерео Линия',
    imageUrl: null,
    avgConcertScore: 80.4,
  },
  {
    id: 107,
    nickname: 'Портовый Шум',
    imageUrl: null,
    avgConcertScore: 86.9,
  },
  {
    id: 108,
    nickname: 'Медленный Свет',
    imageUrl: null,
    avgConcertScore: 77.5,
  },
]

export const MOCK_ARTISTS: ArtistCardItem[] = RAW_ARTISTS.map((artist) => ({
  ...artist,
  imageUrl: ARTIST_IMAGES[(artist.id - 1) % ARTIST_IMAGES.length] ?? null,
}))
