import type { UserProfile } from '../types/profile'

// Задание 6.2: мок профиля для страницы «Мой профиль».
export const MOCK_PROFILE: UserProfile = {
  id: 1,
  displayName: 'Марк Колосов',
  handle: '@mark_reviews',
  createdAt: '2026-02-09T12:00:00Z',
  bio: 'Хожу на живые концерты с 2017 года. Больше всего люблю плотный живой звук, честную подачу и хорошую динамику сет-листа. Пишу рецензии без спойлеров, чтобы было полезно и тем, кто уже был на выступлении, и тем, кто только выбирает, куда пойти.',
  reviewsCount: 14,
  approvedCount: 10,
  pendingCount: 3,
  avatarUrl: null,
  recentReviews: [
    {
      id: 301,
      concertTitle: 'Ночной пульс',
      createdAt: '2026-03-25T20:30:00Z',
      status: 'approved',
      overallScore: 88,
    },
    {
      id: 302,
      concertTitle: 'Огни на воде',
      createdAt: '2026-03-18T19:50:00Z',
      status: 'approved',
      overallScore: 84,
    },
    {
      id: 303,
      concertTitle: 'Летний сигнал',
      createdAt: '2026-03-10T22:10:00Z',
      status: 'pending',
      overallScore: 79,
    },
  ],
}
