import type { Concert } from '../types/concert'

// Задание 2.2: моки приведены к схеме концерта из plan.txt.
export const MOCK_CONCERTS: Concert[] = [
  {
    id: 1,
    title: 'Ночной пульс',
    dateTime: '2026-04-12T19:00:00Z',
    bannerImageUrl: null,
    venue: {
      id: 11,
      name: 'Клуб Маяк',
      city: 'Москва',
      address: 'ул. Тверская, 17',
      imageUrl: null,
    },
    artists: [{ id: 101, name: 'Северный Ветер' }],
    stats: {
      avgOverallScore: 90,
      reviewsCount: 24,
    },
  },
  {
    id: 2,
    title: 'Огни на воде',
    dateTime: '2026-04-19T18:30:00Z',
    bannerImageUrl: null,
    venue: {
      id: 12,
      name: 'Дом музыки',
      city: 'Санкт-Петербург',
      address: 'наб. реки Фонтанки, 8',
      imageUrl: null,
    },
    artists: [{ id: 102, name: 'Джаз Трамвай' }],
    stats: {
      avgOverallScore: 84,
      reviewsCount: 11,
    },
  },
  {
    id: 3,
    title: 'Громкие сны',
    dateTime: '2026-04-27T20:00:00Z',
    bannerImageUrl: null,
    venue: {
      id: 13,
      name: 'Сцена 1905',
      city: 'Казань',
      address: 'ул. Баумана, 3',
      imageUrl: null,
    },
    artists: [{ id: 103, name: 'Эхо Города' }],
    stats: {
      avgOverallScore: null,
      reviewsCount: 0,
    },
  },
  {
    id: 4,
    title: 'Летний сигнал',
    dateTime: '2026-05-03T17:00:00Z',
    bannerImageUrl: null,
    venue: {
      id: 14,
      name: 'Парк Арена',
      city: 'Екатеринбург',
      address: 'пр-т Ленина, 41',
      imageUrl: null,
    },
    artists: [{ id: 104, name: 'Пыльца' }],
    stats: {
      avgOverallScore: 78,
      reviewsCount: 6,
    },
  },
]
