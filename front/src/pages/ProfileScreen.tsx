import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../api/AppDataProvider'
import {
  getMockUserByUsername,
  getMockUsernameByDisplayName,
  MOCK_FAVORITES_BY_USERNAME,
  MOCK_LIKED_REVIEW_IDS_BY_USERNAME,
} from '../data/mockUsers'
import type { ProfileReviewStatus } from '../types/profile'
import type { ReviewCardItem } from '../types/review'
import { resolveIsAdmin } from '../utils/adminAccess'
import { useQuery } from '../utils/useQuery'
import { ReviewCard } from '../components/reviews/ReviewCard'

type ProfileScreenProps =
  | {
      kind: 'me'
    }
  | {
      kind: 'user'
      username: string
    }

type ProfileTab = 'reviews' | 'favorites' | 'liked'

type FavoriteCardVm = {
  key: string
  title: string
  subtitle: string
  imageUrl: string | null
  to: string
}

type ReviewVm = {
  review: ReviewCardItem
  moderation: {
    status: ProfileReviewStatus
    rejection_reason?: string | null
  }
}

type ProfileBundle = {
  username: string
  is_active: boolean
  createdAt: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  isOwn: boolean
  showAdminBadge: boolean
  stats: {
    reviews: number
    likes_received: number
    likes_given: number
  }
  reviews: ReviewVm[]
  favorites: FavoriteCardVm[]
  liked: ReviewCardItem[]
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

function normalizeOptionalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function formatShortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function buildLikesCountByReviewId(): Map<number, number> {
  const out = new Map<number, number>()
  for (const ids of Object.values(MOCK_LIKED_REVIEW_IDS_BY_USERNAME)) {
    for (const reviewId of ids) {
      out.set(reviewId, (out.get(reviewId) ?? 0) + 1)
    }
  }
  return out
}

function moderationTitle(status: ProfileReviewStatus): string {
  if (status === 'pending') return 'На модерации'
  if (status === 'rejected') return 'Отклонена'
  return ''
}

function ReviewsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 4.8h7.6l3 3V19a2.2 2.2 0 0 1-2.2 2.2H7.5A2.2 2.2 0 0 1 5.3 19V7A2.2 2.2 0 0 1 7.5 4.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.1 4.8V8h3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 11.2h7.6M8.2 14.7h7.6M8.2 18.2h5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LikesReceivedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9.4-9.2C.8 8.6 2.3 6 5.2 5.2c2-.6 4 .1 5.2 1.6 1.2-1.5 3.2-2.2 5.2-1.6 2.9.8 4.4 3.4 2.6 6.6C19 16.4 12 21 12 21Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LikesGivenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9.4-9.2C.8 8.6 2.3 6 5.2 5.2c2-.6 4 .1 5.2 1.6 1.2-1.5 3.2-2.2 5.2-1.6 2.9.8 4.4 3.4 2.6 6.6C19 16.4 12 21 12 21Z"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M12 21s-7-4.6-9.4-9.2C.8 8.6 2.3 6 5.2 5.2c2-.6 4 .1 5.2 1.6 1.2-1.5 3.2-2.2 5.2-1.6 2.9.8 4.4 3.4 2.6 6.6C19 16.4 12 21 12 21Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProfileSkeleton({ title }: { title: string }) {
  // Задание 18.1: скелетоны профиля (пульсирующие блоки) на время загрузки.
  return (
    <section className="page">
      <h1 className="pageTitle">{title}</h1>

      <div className="profileLayout">
        <div className="profileSidebar">
          <article className="profileCard">
            <div className="profileAvatarSkeleton skeleton" />
            <div className="profileLineLg skeleton" />
            <div className="profileLineMd skeleton" />
            <div className="profileLineSm skeleton" />
            <div className="profileLineMd skeleton" />
          </article>

          <article className="profileCard">
            <div className="profileStatList" aria-hidden="true">
              <div className="profileStatRow">
                <div className="profileStatLeft">
                  <div className="profileStatIcon skeleton" />
                  <div className="profileStatName skeleton" />
                </div>
                <div className="profileStatNumber skeleton" />
              </div>
              <div className="profileStatRow">
                <div className="profileStatLeft">
                  <div className="profileStatIcon skeleton" />
                  <div className="profileStatName skeleton" />
                </div>
                <div className="profileStatNumber skeleton" />
              </div>
              <div className="profileStatRow">
                <div className="profileStatLeft">
                  <div className="profileStatIcon skeleton" />
                  <div className="profileStatName skeleton" />
                </div>
                <div className="profileStatNumber skeleton" />
              </div>
            </div>
          </article>
        </div>

        <div className="profileMain">
          <div className="profileBanner skeleton" />

          <div className="profileTabs">
            <div className="profileTab skeleton" />
            <div className="profileTab skeleton" />
            <div className="profileTab skeleton" />
          </div>

          <div className="profileContent">
            <div className="profileReviewSkeleton skeleton" />
            <div className="profileReviewSkeleton skeleton" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProfileScreen(props: ProfileScreenProps) {
  // Задание 18.2: новая страница профиля (баннер + левый блок с аватаром + табы: рецензии/избранное/лайкнутое).
  const { data, isLoading: appLoading, error: appError } = useAppData()
  const [activeTab, setActiveTab] = useState<ProfileTab>('reviews')

  const myUsername = useMemo(() => {
    const handle = data?.profile?.handle
    return handle ? normalizeUsername(handle) : null
  }, [data?.profile?.handle])

  const username = useMemo(() => {
    if (props.kind === 'me') return myUsername
    return normalizeUsername(props.username)
  }, [myUsername, props.kind, props.kind === 'user' ? props.username : null])

  const isAdmin = resolveIsAdmin()

  const profileQuery = useQuery<ProfileBundle | null>(
    ['profile', username, myUsername],
    async () => {
      if (!data) return null
      if (!username) return null

      // Имитация сетевой задержки даже в mock-режиме.
      await sleep(350)

      const isOwn = Boolean(myUsername && username === myUsername)
      const showAdminBadge = isOwn && isAdmin

      const stableSocialKey = isOwn ? (getMockUsernameByDisplayName(data.profile.displayName) ?? username) : username

      let userFromDirectory = getMockUserByUsername(username)
      if (!userFromDirectory && isOwn) {
        userFromDirectory = {
          username,
          displayName: data.profile.displayName,
          bio: data.profile.bio,
          avatar_url: data.profile.avatar_url,
          banner_url: data.profile.banner_url ?? null,
          created_at: data.profile.created_at,
          is_active: data.profile.is_active ?? true,
        }
      }

      if (!userFromDirectory) return null

      const is_active = userFromDirectory.is_active

      const createdAt = is_active ? (isOwn ? data.profile.created_at : userFromDirectory.created_at) : null

      const avatarUrl =
        !is_active
          ? null
          : isOwn
            ? (normalizeOptionalUrl(data.profile.avatar_url) ?? normalizeOptionalUrl(userFromDirectory.avatar_url))
            : normalizeOptionalUrl(userFromDirectory.avatar_url)

      const bannerUrl =
        !is_active
          ? null
          : isOwn
            ? (normalizeOptionalUrl(data.profile.banner_url) ?? normalizeOptionalUrl(userFromDirectory.banner_url))
            : normalizeOptionalUrl(userFromDirectory.banner_url)

      const bio = !is_active ? null : isOwn ? data.profile.bio : userFromDirectory.bio

      const likesCountByReviewId = buildLikesCountByReviewId()

      const moderationByReviewId = new Map<number, { status: ProfileReviewStatus; rejection_reason?: string | null }>()
      if (isOwn) {
        for (const item of data.profile.recent_reviews) {
          moderationByReviewId.set(item.id, { status: item.status, rejection_reason: item.rejection_reason ?? null })
        }
      }

      const allUserReviews = data.reviews
        .filter((review) => normalizeUsername(review.author_username ?? '') === username)
        .map<ReviewVm>((review) => {
          const moderation = moderationByReviewId.get(review.id) ?? { status: 'approved' as const }
          const author_name = is_active ? review.author_name : 'Удаленный пользователь'
          const author_username = username

          return {
            review: {
              ...review,
              author_name,
              author_username,
              author_avatar_url: is_active ? review.author_avatar_url : null,
            },
            moderation,
          }
        })
        .sort((a, b) => b.review.id - a.review.id)

      const visibleReviews = isOwn ? allUserReviews : allUserReviews.filter((item) => item.moderation.status === 'approved')

      const reviewsCount = visibleReviews.length
      const likes_received = visibleReviews.reduce((sum, item) => sum + (likesCountByReviewId.get(item.review.id) ?? 0), 0)
      const likes_given = (MOCK_LIKED_REVIEW_IDS_BY_USERNAME[stableSocialKey] ?? []).length

      const favoritesIds = MOCK_FAVORITES_BY_USERNAME[stableSocialKey] ?? { artists: [], venues: [], concerts: [] }

      const favorites: FavoriteCardVm[] = [
        ...favoritesIds.artists
          .map((id) => data.artists.find((artist) => artist.id === id) ?? null)
          .filter((v): v is NonNullable<typeof v> => Boolean(v))
          .map((artist) => ({
            key: `artist-${artist.id}`,
            title: artist.name,
            subtitle: 'Артист',
            imageUrl: artist.photo_url,
            to: `/artists?artistId=${artist.id}`,
          })),
        ...favoritesIds.venues
          .map((id) => data.venues.find((venue) => venue.id === id) ?? null)
          .filter((v): v is NonNullable<typeof v> => Boolean(v))
          .map((venue) => ({
            key: `venue-${venue.id}`,
            title: venue.name,
            subtitle: venue.city,
            imageUrl: venue.photo_url,
            to: `/venues?venue_id=${venue.id}`,
          })),
        ...favoritesIds.concerts
          .map((id) => data.concerts.find((concert) => concert.id === id) ?? null)
          .filter((v): v is NonNullable<typeof v> => Boolean(v))
          .map((concert) => ({
            key: `concert-${concert.id}`,
            title: concert.title ?? 'Концерт',
            subtitle: concert.venue.name,
            imageUrl: concert.poster_url,
            to: `/concerts/${concert.id}/rate`,
          })),
      ]

      const likedReviewIds = MOCK_LIKED_REVIEW_IDS_BY_USERNAME[stableSocialKey] ?? []
      const liked = likedReviewIds
        .map((id) => data.reviews.find((review) => review.id === id) ?? null)
        .filter((v): v is NonNullable<typeof v> => Boolean(v))
        .filter((review) => normalizeUsername(review.author_username ?? '') !== username)
        .sort((a, b) => b.id - a.id)

      return {
        username,
        is_active,
        createdAt,
        avatarUrl,
        bannerUrl,
        bio,
        isOwn,
        showAdminBadge,
        stats: { reviews: reviewsCount, likes_received, likes_given },
        reviews: visibleReviews,
        favorites,
        liked,
      }
    },
    {
      enabled: Boolean(!appLoading && !appError && data && username),
    },
  )

  const title = props.kind === 'me' ? 'Мой профиль' : 'Профиль пользователя'

  if (appLoading || profileQuery.isLoading) {
    return <ProfileSkeleton title={title} />
  }

  const error = appError ?? profileQuery.error
  if (error) {
    return (
      <section className="page">
        <h1 className="pageTitle">{title}</h1>
        <div className="placeholder">{error}</div>
      </section>
    )
  }

  const bundle = profileQuery.data
  if (!bundle || !username) {
    return (
      <section className="page">
        <h1 className="pageTitle">{title}</h1>
        <div className="placeholder">Пользователь не найден</div>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="pageTitle">{title}</h1>

      <div className="profileLayout">
        <div className="profileSidebar">
          <article className="profileCard profileIdentityCard">
            {bundle.is_active ? (
              <div className="profileAvatar" aria-label="Аватар пользователя">
                {bundle.avatarUrl ? (
                  <img
                    className="profileAvatarImg"
                    src={bundle.avatarUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <svg className="profileAvatarFallback" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M5 20.5a7 7 0 0 1 14 0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            ) : (
              <div className="profileDeletedBadge">Аккаунт удален</div>
            )}

            <div className="profileUsernameRow">
              <h2 className="profileUsername">{bundle.is_active ? `@${bundle.username}` : 'Аккаунт удален'}</h2>
              {bundle.showAdminBadge && <span className="profileRoleBadge">Админ</span>}
            </div>

            {bundle.is_active && bundle.createdAt && (
              <p className="profileRegisteredAt">На сайте с {formatShortDate(bundle.createdAt)}</p>
            )}

            {bundle.is_active && bundle.bio && bundle.bio.trim() && <p className="profileBio">{bundle.bio}</p>}
          </article>

          <article className="profileCard">
            <h3 className="profileBlockTitle">Статистика</h3>
            <ul className="profileStatList" aria-label="Статистика профиля">
              <li className="profileStatRow">
                <span className="profileStatLeft">
                  <span className="profileStatIcon" aria-hidden="true">
                    <ReviewsIcon />
                  </span>
                  <span className="profileStatName">Рецензий</span>
                </span>
                <span className="profileStatNumber">{bundle.stats.reviews}</span>
              </li>
              <li className="profileStatRow">
                <span className="profileStatLeft">
                  <span className="profileStatIcon" aria-hidden="true">
                    <LikesReceivedIcon />
                  </span>
                  <span className="profileStatName">Лайков получено</span>
                </span>
                <span className="profileStatNumber">{bundle.stats.likes_received}</span>
              </li>
              <li className="profileStatRow">
                <span className="profileStatLeft">
                  <span className="profileStatIcon" aria-hidden="true">
                    <LikesGivenIcon />
                  </span>
                  <span className="profileStatName">Лайков поставлено</span>
                </span>
                <span className="profileStatNumber">{bundle.stats.likes_given}</span>
              </li>
            </ul>
          </article>
        </div>

        <div className="profileMain">
          <article className="profileBanner" aria-label="Баннер профиля">
            {bundle.bannerUrl && (
              <img
                className="profileBannerImg"
                src={bundle.bannerUrl}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            )}
          </article>

          <nav className="profileTabs" aria-label="Навигация по контенту профиля">
            <button
              type="button"
              className={activeTab === 'reviews' ? 'profileTab active' : 'profileTab'}
              onClick={() => setActiveTab('reviews')}
            >
              Рецензии
            </button>
            <button
              type="button"
              className={activeTab === 'favorites' ? 'profileTab active' : 'profileTab'}
              onClick={() => setActiveTab('favorites')}
            >
              Избранное
            </button>
            <button
              type="button"
              className={activeTab === 'liked' ? 'profileTab active' : 'profileTab'}
              onClick={() => setActiveTab('liked')}
            >
              Лайкнутое
            </button>
          </nav>

          <section className="profileContent">
            {activeTab === 'reviews' && (
              <>
                {bundle.reviews.length > 0 ? (
                  <div className="profileReviewList reviewColumn">
                    {bundle.reviews.map((item) => (
                      <div key={item.review.id} className="profileReviewItem">
                        <ReviewCard
                          review={item.review}
                          moderation={
                            bundle.isOwn && item.moderation.status !== 'approved'
                              ? {
                                  status: item.moderation.status,
                                  title: moderationTitle(item.moderation.status),
                                  rejectionReason: item.moderation.rejection_reason ?? null,
                                }
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="placeholder">У пользователя пока нет рецензий</div>
                )}
              </>
            )}

            {activeTab === 'favorites' && (
              <>
                {bundle.favorites.length > 0 ? (
                  <div className="profileFavoritesGrid" role="list">
                    {bundle.favorites.map((item) => (
                      <Link key={item.key} to={item.to} className="profileFavoriteCard" role="listitem">
                        <div className="profileFavoriteMedia" aria-hidden="true">
                          {item.imageUrl && (
                            <img
                              className="profileFavoriteImg"
                              src={item.imageUrl}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                        <div className="profileFavoriteBody">
                          <p className="profileFavoriteTitle">{item.title}</p>
                          <p className="profileFavoriteSubtitle">{item.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="placeholder">Пока пусто</div>
                )}
              </>
            )}

            {activeTab === 'liked' && (
              <>
                {bundle.liked.length > 0 ? (
                  <div className="profileReviewList reviewColumn">
                    {bundle.liked.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="placeholder">Нет лайкнутых рецензий</div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
