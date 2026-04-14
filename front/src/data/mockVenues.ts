import type { VenueCardItem } from '../types/venue'

// Задание 4.2: мок-данные для вкладки площадок.
// Задание 4.4: реальные изображения для карточек площадок.
const VENUE_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1524777313293-86d2ab467344?auto=format&fit=crop&w=1000&q=80',
]

const RAW_VENUES: VenueCardItem[] = [
  {
    id: 201,
    name: 'Клуб Маяк',
    city: 'Москва',
    capacity: 1200,
    photo_url: null,
    avg_rating_total: 88.7,
  },
  {
    id: 202,
    name: 'Дом музыки',
    city: 'Санкт-Петербург',
    capacity: 1800,
    photo_url: null,
    avg_rating_total: 84.3,
  },
  {
    id: 203,
    name: 'Сцена 1905',
    city: 'Казань',
    capacity: 900,
    photo_url: null,
    avg_rating_total: null,
  },
  {
    id: 204,
    name: 'Парк Арена',
    city: 'Екатеринбург',
    capacity: 3500,
    photo_url: null,
    avg_rating_total: 79.6,
  },
  {
    id: 205,
    name: 'Север Холл',
    city: 'Новосибирск',
    capacity: 2400,
    photo_url: null,
    avg_rating_total: 82.4,
  },
  {
    id: 206,
    name: 'Набережная Сцена',
    city: 'Нижний Новгород',
    capacity: 1600,
    photo_url: null,
    avg_rating_total: 85.1,
  },
  {
    id: 207,
    name: 'Театр Звук',
    city: 'Ростов-на-Дону',
    capacity: 1100,
    photo_url: null,
    avg_rating_total: 80.9,
  },
  {
    id: 208,
    name: 'Крыша 9',
    city: 'Самара',
    capacity: 700,
    photo_url: null,
    avg_rating_total: null,
  },
]

export const MOCK_VENUES: VenueCardItem[] = RAW_VENUES.map((venue) => ({
  ...venue,
  photo_url: VENUE_IMAGES[(venue.id - 1) % VENUE_IMAGES.length] ?? null,
}))

