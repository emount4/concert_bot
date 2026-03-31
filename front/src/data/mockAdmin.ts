import type {
  AdminArtist,
  AdminConcert,
  AdminReviewModerationItem,
  AdminVenue,
} from '../types/admin'

// Задание 8.2: начальные мок-данные админ-панели.
export const MOCK_ADMIN_REVIEWS: AdminReviewModerationItem[] = [
  {
    id: 901,
    authorName: 'Игорь Туманов',
    concertTitle: 'Летний сигнал',
    createdAt: '2026-03-30T14:20:00Z',
    overallScore: 79,
    status: 'pending',
    text:
      'Сильный старт и мощный финал, но середина показалась чуть ровной. В отдельных треках ощущалась усталость по подаче, зато публика компенсировала это энергией. По звуку были небольшие перекосы по низким частотам рядом со сценой. В целом хороший живой опыт, на который можно смело идти снова.',
  },
  {
    id: 902,
    authorName: 'Анна Соколова',
    concertTitle: 'Громкие сны',
    createdAt: '2026-03-29T19:05:00Z',
    overallScore: 82,
    status: 'pending',
    text:
      'Публика была активной почти весь сет, но работа звукаря местами проседала: вокал периодически тонул в инструментах. При этом у группы получился очень хороший контакт с залом, особенно в последних треках. Если выровнять микс и добавить чуть больше пауз между блоками, концерт будет восприниматься еще сильнее.',
  },
]

export const MOCK_ADMIN_ARTISTS: AdminArtist[] = [
  { id: 101, name: 'Северный Ветер', description: 'Инди-рок группа из Москвы.', imageUrl: null },
  { id: 102, name: 'Джаз Трамвай', description: 'Современный джаз и фанк.', imageUrl: null },
]

export const MOCK_ADMIN_VENUES: AdminVenue[] = [
  {
    id: 201,
    name: 'Клуб Маяк',
    city: 'Москва',
    address: 'ул. Тверская, 17',
    capacity: 1200,
    imageUrl: null,
  },
  {
    id: 202,
    name: 'Дом музыки',
    city: 'Санкт-Петербург',
    address: 'наб. реки Фонтанки, 8',
    capacity: 1800,
    imageUrl: null,
  },
]

export const MOCK_ADMIN_CONCERTS: AdminConcert[] = [
  {
    id: 301,
    title: 'Ночной пульс',
    dateTime: '2026-04-12T19:00:00Z',
    venueId: 201,
    artistIds: [101],
    bannerImageUrl: null,
  },
  {
    id: 302,
    title: 'Огни на воде',
    dateTime: '2026-04-19T18:30:00Z',
    venueId: 202,
    artistIds: [102],
    bannerImageUrl: null,
  },
]
