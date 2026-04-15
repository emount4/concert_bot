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
    name: 'Северный Ветер',
    photo_url: null,
    avg_rating_total: 89.6,
  },
  {
    id: 102,
    name: 'Джаз Трамвай',
    photo_url: null,
    avg_rating_total: 84.2,
  },
  {
    id: 103,
    name: 'Эхо Города',
    photo_url: null,
    avg_rating_total: null,
  },
  {
    id: 104,
    name: 'Пыльца',
    photo_url: null,
    avg_rating_total: 78.3,
  },
  {
    id: 105,
    name: 'Лунный Канал',
    photo_url: null,
    avg_rating_total: 83.1,
  },
  {
    id: 106,
    name: 'Стерео Линия',
    photo_url: null,
    avg_rating_total: 80.4,
  },
  {
    id: 107,
    name: 'Портовый Шум',
    photo_url: null,
    avg_rating_total: 86.9,
  },
  {
    id: 108,
    name: 'Медленный Свет',
    photo_url: null,
    avg_rating_total: 77.5,
  },
  {
    id: 109,
    name: 'Вечерний Лес',
    photo_url: null,
    avg_rating_total: 81.2,
  },
  {
    id: 110,
    name: 'Синий Мост',
    photo_url: null,
    avg_rating_total: 84.9,
  },
  {
    id: 111,
    name: 'Кварц',
    photo_url: null,
    avg_rating_total: null,
  },
  {
    id: 112,
    name: 'Тихий Шторм',
    photo_url: null,
    avg_rating_total: 79.8,
  },
  {
    id: 113,
    name: 'Паруса',
    photo_url: null,
    avg_rating_total: 86.1,
  },
  {
    id: 114,
    name: 'Полярный Звук',
    photo_url: null,
    avg_rating_total: 83.7,
  },
  {
    id: 115,
    name: 'Городской Сад',
    photo_url: null,
    avg_rating_total: 75.9,
  },
  {
    id: 116,
    name: 'Линия Ночи',
    photo_url: null,
    avg_rating_total: 82.6,
  },
]

export const MOCK_ARTISTS: ArtistCardItem[] = RAW_ARTISTS.map((artist, index) => ({
  ...artist,
  artist_id: String(artist.id),
  photo_url: ARTIST_IMAGES[index % ARTIST_IMAGES.length] ?? null,
}))

