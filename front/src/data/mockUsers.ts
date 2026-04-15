// Задание 17.1: мок-справочник пользователей + социальные данные (лайки/избранное) для страниц профиля.

export type MockUserDirectoryItem = {
  username: string
  displayName: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  created_at: string
  is_active: boolean
}

export const DELETED_USERNAME = 'deleted_user'

const USERNAME_BY_DISPLAY_NAME: Record<string, string> = {
  'Марк Колосов': 'mark_reviews',
  'Лина Орлова': 'lina_orlova',
  'Игорь Туманов': 'igor_tumanov',
  'Соня Белкина': 'sonya_belkina',
  'Павел Лобов': 'pavel_lobov',
  'Артем Демин': 'artem_demin',
  'Ника Тихая': 'nika_tihaya',
  'Илья Бондарь': 'ilya_bondar',
  'Рита Смирнова': 'rita_smirnova',
  'Данил Корнеев': 'danil_korneev',
  'Влада Ким': 'vlada_kim',
  'Олег Гринь': 'oleg_grin',
  'Кирилл Фролов': 'kirill_frolov',
  'Удаленный пользователь': DELETED_USERNAME,
}

const DISPLAY_NAME_BY_USERNAME: Record<string, string> = Object.fromEntries(
  Object.entries(USERNAME_BY_DISPLAY_NAME).map(([displayName, username]) => [username, displayName]),
)

export function getMockUsernameByDisplayName(displayName: string): string | null {
  const normalized = displayName.trim()
  return USERNAME_BY_DISPLAY_NAME[normalized] ?? null
}

export function getMockDisplayNameByUsername(username: string): string | null {
  const normalized = username.trim().replace(/^@+/, '').toLowerCase()
  return DISPLAY_NAME_BY_USERNAME[normalized] ?? null
}

const DEFAULT_BANNER_URL =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'

export const MOCK_USERS: MockUserDirectoryItem[] = [
  {
    username: 'mark_reviews',
    displayName: 'Марк Колосов',
    bio: 'Хожу на живые концерты с 2017 года. Пишу рецензии без спойлеров и стараюсь отмечать сильные стороны сета.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    banner_url: DEFAULT_BANNER_URL,
    created_at: '2026-02-09T12:00:00Z',
    is_active: true,
  },
  {
    username: 'lina_orlova',
    displayName: 'Лина Орлова',
    bio: 'Люблю камерные площадки и честный звук. Пишу коротко и по делу.',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    banner_url:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    created_at: '2025-11-21T18:20:00Z',
    is_active: true,
  },
  {
    username: 'igor_tumanov',
    displayName: 'Игорь Туманов',
    bio: null,
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    banner_url:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    created_at: '2025-08-02T10:05:00Z',
    is_active: true,
  },
  {
    username: DELETED_USERNAME,
    displayName: 'Удаленный пользователь',
    bio: null,
    avatar_url: null,
    banner_url: null,
    created_at: '2025-01-01T00:00:00Z',
    is_active: false,
  },
]

export function getMockUserByUsername(username: string): MockUserDirectoryItem | null {
  const normalized = username.trim().replace(/^@+/, '').toLowerCase()
  const explicit = MOCK_USERS.find((item) => item.username.toLowerCase() === normalized) ?? null
  if (explicit) return explicit

  const displayName = DISPLAY_NAME_BY_USERNAME[normalized]
  if (!displayName) return null

  return {
    username: normalized,
    displayName,
    bio: null,
    avatar_url:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    banner_url: DEFAULT_BANNER_URL,
    created_at: '2025-06-12T09:00:00Z',
    is_active: true,
  }
}

export function getMockUserByDisplayName(displayName: string): MockUserDirectoryItem | null {
  const username = getMockUsernameByDisplayName(displayName)
  if (!username) return null
  return getMockUserByUsername(username)
}

export type MockFavorites = {
  artists: number[]
  venues: number[]
  concerts: number[]
}

// Задание 17.2: мок-избранное по пользователю.
export const MOCK_FAVORITES_BY_USERNAME: Record<string, MockFavorites> = {
  mark_reviews: { artists: [101, 102], venues: [201], concerts: [1, 4] },
  lina_orlova: { artists: [103], venues: [202], concerts: [2] },
  [DELETED_USERNAME]: { artists: [], venues: [], concerts: [] },
}

// Задание 17.3: мок-лайки (список review.id, которые лайкнул пользователь).
export const MOCK_LIKED_REVIEW_IDS_BY_USERNAME: Record<string, number[]> = {
  mark_reviews: [308, 312, 302],
  lina_orlova: [301, 308],
  igor_tumanov: [301],
  [DELETED_USERNAME]: [301],
}
