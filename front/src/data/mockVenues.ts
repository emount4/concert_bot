import type { VenueCardItem } from '../types/venue'

// Задание 4.2: мок-данные для вкладки площадок.
export const MOCK_VENUES: VenueCardItem[] = [
  {
    id: 201,
    name: 'Клуб Маяк',
    city: 'Москва',
    capacity: 1200,
    imageUrl: null,
    avgVenueScore: 88.7,
  },
  {
    id: 202,
    name: 'Дом музыки',
    city: 'Санкт-Петербург',
    capacity: 1800,
    imageUrl: null,
    avgVenueScore: 84.3,
  },
  {
    id: 203,
    name: 'Сцена 1905',
    city: 'Казань',
    capacity: 900,
    imageUrl: null,
    avgVenueScore: null,
  },
  {
    id: 204,
    name: 'Парк Арена',
    city: 'Екатеринбург',
    capacity: 3500,
    imageUrl: null,
    avgVenueScore: 79.6,
  },
]
