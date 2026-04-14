import type { UserProfile } from '../types/profile'

// Задание 6.2: мок профиля для страницы «Мой профиль».
export const MOCK_PROFILE: UserProfile = {
  id: 1,
  user_id: '1',
  displayName: 'Марк Колосов',
  handle: '@mark_reviews',
  created_at: '2026-02-09T12:00:00Z',
  bio: 'Хожу на живые концерты с 2017 года. Больше всего люблю плотный живой звук, честную подачу и хорошую динамику сет-листа. Пишу рецензии без спойлеров, чтобы было полезно и тем, кто уже был на выступлении, и тем, кто только выбирает, куда пойти.',
  reviews_count: 3,
  approved_count: 1,
  pending_count: 1,
  avatar_url: null,
  banner_url:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  is_active: true,
  recent_reviews: [
    {
      id: 301,
      review_id: '301',
      concert_title: 'Ночной пульс',
      created_at: '2026-03-25T20:30:00Z',
      status: 'approved',
      rating_total: 88,
    },
    {
      id: 315,
      review_id: '315',
      concert_title: 'Полуночный экспресс',
      created_at: '2026-03-18T21:10:00Z',
      status: 'pending',
      rating_total: 82,
    },
    {
      id: 316,
      review_id: '316',
      concert_title: 'Ближе к небу',
      created_at: '2026-03-05T21:40:00Z',
      status: 'rejected',
      rejection_reason: 'Пожалуйста, добавьте больше конкретики по звуку и подаче (мок).',
      rating_total: 78,
    },
  ],
}

