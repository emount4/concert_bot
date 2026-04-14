import type { Concert } from '../types/concert'

// Задание 2.2: моки приведены к схеме концерта из plan.txt.

// Задание 2.3: реальные изображения афиш для вкладки "Концерты".
// Примечание: URL'ы публичные и используются только для dev-моков.
const CONCERT_POSTERS: string[] = [
  'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
]

const RAW_CONCERTS: Concert[] = [
  {
    id: 1,
    title: 'Ночной пульс',
    date: '2026-04-12T19:00:00Z',
    poster_url: null,
    venue: {
      id: 11,
      name: 'Клуб Маяк',
      city: 'Москва',
      address: 'ул. Тверская, 17',
      photo_url: null,
    },
    artists: [{ id: 101, name: 'Северный Ветер' },{id: 102, name: 'Южный Ветер' }],
    stats: {
      avg_rating_total: 90,
      reviews_count: 24,
    },
  },
  {
    id: 2,
    title: 'Огни на воде',
    date: '2026-04-19T18:30:00Z',
    poster_url: null,
    venue: {
      id: 12,
      name: 'Дом музыки',
      city: 'Санкт-Петербург',
      address: 'наб. реки Фонтанки, 8',
      photo_url: null,
    },
    artists: [{ id: 102, name: 'Джаз Трамвай' }],
    stats: {
      avg_rating_total: 84,
      reviews_count: 11,
    },
  },
  {
    id: 3,
    title: 'Громкие сны',
    date: '2026-04-27T20:00:00Z',
    poster_url: null,
    venue: {
      id: 13,
      name: 'Сцена 1905',
      city: 'Казань',
      address: 'ул. Баумана, 3',
      photo_url: null,
    },
    artists: [{ id: 103, name: 'Эхо Города' }],
    stats: {
      avg_rating_total: null,
      reviews_count: 0,
    },
  },
  {
    id: 4,
    title: 'Летний сигнал',
    date: '2026-05-03T17:00:00Z',
    poster_url: null,
    venue: {
      id: 14,
      name: 'Парк Арена',
      city: 'Екатеринбург',
      address: 'пр-т Ленина, 41',
      photo_url: null,
    },
    artists: [{ id: 104, name: 'Пыльца' }],
    stats: {
      avg_rating_total: 78,
      reviews_count: 6,
    },
  },
  {
    id: 5,
    title: 'Линия прибоя',
    date: '2026-05-10T19:30:00Z',
    poster_url: null,
    venue: {
      id: 11,
      name: 'Клуб Маяк',
      city: 'Москва',
      address: 'ул. Тверская, 17',
      photo_url: null,
    },
    artists: [{ id: 101, name: 'Северный Ветер' }],
    stats: {
      avg_rating_total: 87,
      reviews_count: 18,
    },
  },
  {
    id: 6,
    title: 'Полуночный экспресс',
    date: '2026-05-18T20:00:00Z',
    poster_url: null,
    venue: {
      id: 12,
      name: 'Дом музыки',
      city: 'Санкт-Петербург',
      address: 'наб. реки Фонтанки, 8',
      photo_url: null,
    },
    artists: [{ id: 102, name: 'Джаз Трамвай' }],
    stats: {
      avg_rating_total: 82,
      reviews_count: 9,
    },
  },
  {
    id: 7,
    title: 'Теплый фронт',
    date: '2026-05-22T18:00:00Z',
    poster_url: null,
    venue: {
      id: 13,
      name: 'Сцена 1905',
      city: 'Казань',
      address: 'ул. Баумана, 3',
      photo_url: null,
    },
    artists: [{ id: 103, name: 'Эхо Города' }],
    stats: {
      avg_rating_total: 76,
      reviews_count: 4,
    },
  },
  {
    id: 8,
    title: 'Ближе к небу',
    date: '2026-06-01T17:30:00Z',
    poster_url: null,
    venue: {
      id: 14,
      name: 'Парк Арена',
      city: 'Екатеринбург',
      address: 'пр-т Ленина, 41',
      photo_url: null,
    },
    artists: [{ id: 104, name: 'Пыльца' }],
    stats: {
      avg_rating_total: 81,
      reviews_count: 8,
    },
  },
  {
    id: 9,
    title: 'Северный маршрут',
    date: '2026-06-12T20:30:00Z',
    poster_url: null,
    venue: {
      id: 11,
      name: 'Клуб Маяк',
      city: 'Москва',
      address: 'ул. Тверская, 17',
      photo_url: null,
    },
    artists: [{ id: 101, name: 'Северный Ветер' }],
    stats: {
      avg_rating_total: 89,
      reviews_count: 14,
    },
  },
  {
    id: 10,
    title: 'Джаз без сна',
    date: '2026-06-20T19:00:00Z',
    poster_url: null,
    venue: {
      id: 12,
      name: 'Дом музыки',
      city: 'Санкт-Петербург',
      address: 'наб. реки Фонтанки, 8',
      photo_url: null,
    },
    artists: [{ id: 102, name: 'Джаз Трамвай' }],
    stats: {
      avg_rating_total: 85,
      reviews_count: 12,
    },
  },
  {
    id: 11,
    title: 'Лунная сборка',
    date: '2026-06-28T19:00:00Z',
    poster_url: null,
    venue: {
      id: 15,
      name: 'Север Холл',
      city: 'Новосибирск',
      address: 'ул. Ленина, 58',
      photo_url: null,
    },
    artists: [{ id: 105, name: 'Лунный Канал' }],
    stats: {
      avg_rating_total: 83,
      reviews_count: 7,
    },
  },
  {
    id: 12,
    title: 'Шумопровод',
    date: '2026-07-04T20:00:00Z',
    poster_url: null,
    venue: {
      id: 16,
      name: 'Набережная Сцена',
      city: 'Нижний Новгород',
      address: 'наб. Волги, 12',
      photo_url: null,
    },
    artists: [{ id: 106, name: 'Стерео Линия' }],
    stats: {
      avg_rating_total: 81,
      reviews_count: 10,
    },
  },
  {
    id: 13,
    title: 'Портовый маяк',
    date: '2026-07-09T19:30:00Z',
    poster_url: null,
    venue: {
      id: 17,
      name: 'Театр Звук',
      city: 'Ростов-на-Дону',
      address: 'ул. Садовая, 23',
      photo_url: null,
    },
    artists: [{ id: 107, name: 'Портовый Шум' }],
    stats: {
      avg_rating_total: 87,
      reviews_count: 9,
    },
  },
  {
    id: 14,
    title: 'Тонкий луч',
    date: '2026-07-16T18:30:00Z',
    poster_url: null,
    venue: {
      id: 18,
      name: 'Крыша 9',
      city: 'Самара',
      address: 'ул. Молодогвардейская, 70',
      photo_url: null,
    },
    artists: [{ id: 108, name: 'Медленный Свет' }],
    stats: {
      avg_rating_total: 75,
      reviews_count: 3,
    },
  },
  {
    id: 15,
    title: 'Городской импульс',
    date: '2026-07-21T20:30:00Z',
    poster_url: null,
    venue: {
      id: 11,
      name: 'Клуб Маяк',
      city: 'Москва',
      address: 'ул. Тверская, 17',
      photo_url: null,
    },
    artists: [{ id: 107, name: 'Портовый Шум' }],
    stats: {
      avg_rating_total: 86,
      reviews_count: 13,
    },
  },
  {
    id: 16,
    title: 'Светоформа',
    date: '2026-07-29T19:00:00Z',
    poster_url: null,
    venue: {
      id: 12,
      name: 'Дом музыки',
      city: 'Санкт-Петербург',
      address: 'наб. реки Фонтанки, 8',
      photo_url: null,
    },
    artists: [{ id: 108, name: 'Медленный Свет' }],
    stats: {
      avg_rating_total: 79,
      reviews_count: 5,
    },
  },
  {
    id: 17,
    title: 'Глубина канала',
    date: '2026-08-06T20:00:00Z',
    poster_url: null,
    venue: {
      id: 15,
      name: 'Север Холл',
      city: 'Новосибирск',
      address: 'ул. Ленина, 58',
      photo_url: null,
    },
    artists: [{ id: 105, name: 'Лунный Канал' }],
    stats: {
      avg_rating_total: 84,
      reviews_count: 11,
    },
  },
  {
    id: 18,
    title: 'Стерео периметр',
    date: '2026-08-14T18:00:00Z',
    poster_url: null,
    venue: {
      id: 16,
      name: 'Набережная Сцена',
      city: 'Нижний Новгород',
      address: 'наб. Волги, 12',
      photo_url: null,
    },
    artists: [{ id: 106, name: 'Стерео Линия' }],
    stats: {
      avg_rating_total: 82,
      reviews_count: 6,
    },
  },
]

export const MOCK_CONCERTS: Concert[] = RAW_CONCERTS.map((concert) => ({
  ...concert,
  poster_url: CONCERT_POSTERS[(concert.id - 1) % CONCERT_POSTERS.length] ?? null,
}))

