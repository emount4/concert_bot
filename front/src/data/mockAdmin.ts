import type {
  AdminAccount,
  AdminArtist,
  AdminConcert,
  AdminReviewModerationItem,
  AdminVenue,
} from '../types/admin'

// Задание 8.2: начальные мок-данные админ-панели.
export const MOCK_ADMIN_REVIEWS: AdminReviewModerationItem[] = [
  {
    id: 901,
    author_name: 'Игорь Туманов',
    author_username: 'igor_live',
    concert_title: 'Летний сигнал',
    created_at: '2026-03-30T14:20:00Z',
    rating_total: 79,
    status: 'pending',
    text:
      'Сильный старт и мощный финал, но середина показалась чуть ровной. В отдельных треках ощущалась усталость по подаче, зато публика компенсировала это энергией. По звуку были небольшие перекосы по низким частотам рядом со сценой. В целом хороший живой опыт, на который можно смело идти снова.',
    media: [
      {
        id: 'm901-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'm901-2',
        type: 'video',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      },
    ],
  },
  {
    id: 902,
    author_name: 'Анна Соколова',
    author_username: 'anna_music',
    concert_title: 'Громкие сны',
    created_at: '2026-03-29T19:05:00Z',
    rating_total: 82,
    status: 'pending',
    text:
      'Публика была активной почти весь сет, но работа звукаря местами проседала: вокал периодически тонул в инструментах. При этом у группы получился очень хороший контакт с залом, особенно в последних треках. Если выровнять микс и добавить чуть больше пауз между блоками, концерт будет восприниматься еще сильнее.',
  },
]

export const MOCK_ADMIN_ARTISTS: AdminArtist[] = [
  { id: 101, name: 'Северный Ветер', description: 'Инди-рок группа из Москвы.', photo_url: null },
  { id: 102, name: 'Джаз Трамвай', description: 'Современный джаз и фанк.', photo_url: null },
]

export const MOCK_ADMIN_VENUES: AdminVenue[] = [
  {
    id: 201,
    name: 'Клуб Маяк',
    city: 'Москва',
    address: 'ул. Тверская, 17',
    capacity: 1200,
    photo_url: null,
  },
  {
    id: 202,
    name: 'Дом музыки',
    city: 'Санкт-Петербург',
    address: 'наб. реки Фонтанки, 8',
    capacity: 1800,
    photo_url: null,
  },
]

export const MOCK_ADMIN_CONCERTS: AdminConcert[] = [
  {
    id: 301,
    title: 'Ночной пульс',
    date: '2026-04-12T19:00:00Z',
    venue_id: 201,
    artist_ids: [101],
    poster_url: null,
  },
  {
    id: 302,
    title: 'Огни на воде',
    date: '2026-04-19T18:30:00Z',
    venue_id: 202,
    artist_ids: [102],
    poster_url: null,
  },
]

export const MOCK_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 1,
    displayName: 'Марк Колосов',
    handle: '@mark_reviews',
    role: 'super-admin',
    is_banned: false,
    is_current: true,
  },
  {
    id: 2,
    displayName: 'Игорь Туманов',
    handle: '@igor_live',
    role: 'user',
    is_banned: false,
    is_current: false,
  },
  {
    id: 3,
    displayName: 'Анна Соколова',
    handle: '@anna_music',
    role: 'admin',
    is_banned: false,
    is_current: false,
  },
  {
    id: 4,
    displayName: 'Лина Орлова',
    handle: '@lina_reviews',
    role: 'user',
    is_banned: true,
    is_current: false,
  },
  {
    id: 5,
    displayName: 'Ника Тихая',
    handle: '@nika_wave',
    role: 'user',
    is_banned: false,
    is_current: false,
  },
]

