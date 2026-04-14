import type { UserProfile } from '../types/profile'

// Задание 6.2: мок профиля для страницы «Мой профиль».
export const MOCK_PROFILE: UserProfile = {
  id: 1,
  displayName: 'Марк Колосов',
  handle: '@mark_reviews',
  created_at: '2026-02-09T12:00:00Z',
  bio: 'Хожу на живые концерты с 2017 года. Больше всего люблю плотный живой звук, честную подачу и хорошую динамику сет-листа. Пишу рецензии без спойлеров, чтобы было полезно и тем, кто уже был на выступлении, и тем, кто только выбирает, куда пойти.',
  reviews_count: 14,
  approved_count: 10,
  pending_count: 3,
  avatar_url: null,
  recent_reviews: [
    {
      id: 301,
      concert_title: 'Ночной пульс',
      created_at: '2026-03-25T20:30:00Z',
      status: 'approved',
      rating_total: 88,
    },
    {
      id: 302,
      concert_title: 'Огни на воде',
      created_at: '2026-03-18T19:50:00Z',
      status: 'approved',
      rating_total: 84,
    },
    {
      id: 303,
      concert_title: 'Летний сигнал',
      created_at: '2026-03-10T22:10:00Z',
      status: 'pending',
      rating_total: 79,
    },
  ],
}

