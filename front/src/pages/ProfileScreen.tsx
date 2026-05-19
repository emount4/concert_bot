import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../api/AppDataProvider'
import { getFavoritesRevision, loadMyLikedReviews, loadMyProfile, loadPublicProfile, loadUserFavorites, loadUserLikedReviews } from '../api/repository'
import {
  getMockUserByUsername,
  getMockUsernameByDisplayName,
  MOCK_LIKED_REVIEW_IDS_BY_USERNAME,
} from '../data/mockUsers'
import type { ProfileReviewItem, ProfileReviewStatus } from '../types/profile'
import type { ReviewCardItem } from '../types/review'
import type { FavoriteItem } from '../types/favorite'
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

type FavoriteIconVm = {
  key: string
  title: string
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
  userId: string
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
  liked: ReviewCardItem[]
}

type ProfileReviewAuthorContext = {
  username: string
  displayName: string
  avatarUrl: string | null
  isActive: boolean
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

function numericIdFromString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash || 1
}

function moderationTitle(status: ProfileReviewStatus): string {
  if (status === 'pending') return 'На модерации'
  if (status === 'rejected') return 'Отклонена'
  return ''
}

function mapProfileReviewToVm(item: ProfileReviewItem, author: ProfileReviewAuthorContext): ReviewVm {
  const reviewId = item.review_id ? numericIdFromString(item.review_id) : item.id
  const author_name = author.isActive ? author.displayName : 'Удаленный пользователь'

  return {
    review: {
      id: reviewId,
      review_id: item.review_id,
      concert_id: item.concert_id,
      concertId: item.concert_id ?? '',
      author_name,
      author_username: author.username,
      author_avatar_url: author.isActive ? author.avatarUrl : null,
      concert_title: item.concert_title,
      title: item.title,
      concert_artist: item.concert_artist ?? '',
      concert_poster_url: item.concert_poster_url ?? null,
      rating_total: item.rating_total,
      scores: {
        performance: item.p1 ?? 0,
        setlist: item.p2 ?? 0,
        crowd: item.p3 ?? 0,
        sound: item.p4 ?? 0,
        vibe: item.p5 ?? 0,
      },
      text: item.text,
      media: item.media,
      likes_count: item.likes_count ?? 0,
      is_liked_by_me: item.is_liked_by_me ?? false,
      status: item.status,
      rejection_reason: item.rejection_reason ?? null,
      created_at: item.created_at,
    },
    moderation: {
      status: item.status,
      rejection_reason: item.rejection_reason ?? null,
    },
  }
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
        <div className="profileBanner skeleton" />

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
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ProfileReviewStatus>('approved')

  const myUsername = useMemo(() => {
    const handle = data?.profile?.handle
    return handle ? normalizeUsername(handle) : null
  }, [data?.profile?.handle])

  const username = useMemo(() => {
    if (props.kind === 'me') return myUsername
    return normalizeUsername(props.username)
  }, [myUsername, props.kind, props.kind === 'user' ? props.username : null])

  const isAdmin = resolveIsAdmin()
  const isOwnProfile = Boolean(myUsername && username === myUsername)
  const ownReviewsQuery = useQuery(['profile', 'ownReviews', reviewStatusFilter], () =>
    loadMyProfile(reviewStatusFilter).then((profile) => profile.recent_reviews),
    { enabled: Boolean(!appLoading && !appError && isOwnProfile && activeTab === 'reviews' && reviewStatusFilter !== 'approved') },
  )

  const profileQuery = useQuery<ProfileBundle | null>(
    [
      'profile',
      username,
      myUsername,
      data?.profile?.recent_reviews.length ?? 0,
      data?.profile?.bio ?? '',
      data?.profile?.avatar_url ?? '',
      data?.profile?.banner_url ?? '',
    ],
    async () => {
      if (!data) return null
      if (!username) return null
      const reviews: ReviewCardItem[] = []

      // Имитация сетевой задержки даже в mock-режиме.
      await sleep(350)

      const isOwn = Boolean(myUsername && username === myUsername)
      const showAdminBadge = isOwn && isAdmin

      const apiProfile = isOwn ? data.profile : await loadPublicProfile(username)
      const stableSocialKey = isOwn ? (getMockUsernameByDisplayName(apiProfile.displayName) ?? username) : username

      let userFromDirectory = getMockUserByUsername(username)
      if (!userFromDirectory) {
        userFromDirectory = {
          username,
          displayName: apiProfile.displayName,
          bio: apiProfile.bio,
          avatar_url: apiProfile.avatar_url,
          banner_url: apiProfile.banner_url ?? null,
          created_at: apiProfile.created_at,
          is_active: apiProfile.is_active ?? true,
        }
      }

      if (!userFromDirectory) return null

      const is_active = apiProfile.is_active ?? userFromDirectory.is_active ?? true

      const createdAt = is_active ? apiProfile.created_at : null

      const avatarUrl =
        !is_active
          ? null
          : (normalizeOptionalUrl(apiProfile.avatar_url) ?? normalizeOptionalUrl(userFromDirectory.avatar_url))

      const bannerUrl =
        !is_active
          ? null
          : (normalizeOptionalUrl(apiProfile.banner_url) ?? normalizeOptionalUrl(userFromDirectory.banner_url))

      const bio = !is_active ? null : apiProfile.bio

      const likesCountByReviewId = buildLikesCountByReviewId()

      const allUserReviews = apiProfile.recent_reviews
        .map<ReviewVm>((item) => mapProfileReviewToVm(item, {
          username,
          displayName: apiProfile.displayName,
          avatarUrl,
          isActive: is_active,
        }))
        .sort((a, b) => {
          const left = new Date(a.review.created_at ?? '').getTime()
          const right = new Date(b.review.created_at ?? '').getTime()
          return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0)
        })

      const visibleReviews = isOwn ? allUserReviews : allUserReviews.filter((item) => item.moderation.status === 'approved')

      const reviewsCount = apiProfile.reviews_count ?? visibleReviews.length
      const likes_received =
        apiProfile.likes_received_count ??
        visibleReviews.reduce((sum, item) => sum + (likesCountByReviewId.get(item.review.id) ?? 0), 0)
      const likes_given = apiProfile.likes_given_count ?? (MOCK_LIKED_REVIEW_IDS_BY_USERNAME[stableSocialKey] ?? []).length

      const likedReviewIds = MOCK_LIKED_REVIEW_IDS_BY_USERNAME[stableSocialKey] ?? []
      const liked = likedReviewIds
        .map((id) => reviews.find((review) => review.id === id) ?? null)
        .filter((v): v is NonNullable<typeof v> => Boolean(v))
        .filter((review) => normalizeUsername(review.author_username ?? '') !== username)
        .sort((a, b) => b.id - a.id)

      return {
        userId: String(apiProfile.user_id ?? apiProfile.id ?? username),
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
        liked,
      }
    },
    {
      enabled: Boolean(!appLoading && !appError && data && username),
    },
  )
  const favoritesRevision = getFavoritesRevision()
  const favoritesQuery = useQuery(
    ['profile', 'favorites', username, favoritesRevision],
    () => loadUserFavorites(username ?? ''),
    { enabled: Boolean(!appLoading && !appError && activeTab === 'favorites' && username) },
  )
  const likedReviewsUsername = profileQuery.data?.username ?? username ?? ''
  const likedReviewsQuery = useQuery(
    ['profile', 'likedReviews', likedReviewsUsername],
    () => (isOwnProfile ? loadMyLikedReviews() : loadUserLikedReviews(likedReviewsUsername, { limit: 20, offset: 0 })),
    { enabled: Boolean(!appLoading && !appError && activeTab === 'liked' && likedReviewsUsername && profileQuery.data) },
  )

  const favoritesItems = favoritesQuery.data ?? []
  const displayedFavorites = useMemo(() => {
    const grouped: Record<'concert' | 'artist' | 'venue', FavoriteIconVm[]> = {
      concert: [],
      artist: [],
      venue: [],
    }

    favoritesItems.forEach((item: FavoriteItem) => {
      const base: FavoriteIconVm = {
        key: `${item.target_type}-${item.target_id}`,
        title: item.name,
        imageUrl: item.image_url,
        to:
          item.target_type === 'artist'
            ? `/artists?artistId=${item.target_id}`
            : item.target_type === 'venue'
              ? `/venues?venue_id=${item.target_id}`
              : `/concerts/${item.target_id}/rate`,
      }
      grouped[item.target_type].push(base)
    })

    return {
      concerts: grouped.concert,
      artists: grouped.artist,
      venues: grouped.venue,
    }
  }, [favoritesItems])
  const isFavoritesLoading = favoritesQuery.isLoading
  const favoritesError = favoritesQuery.error

  const title = props.kind === 'me' || isOwnProfile ? 'Мой профиль' : 'Профиль пользователя'

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

  const ownReviewItems = ownReviewsQuery.data ?? (reviewStatusFilter === 'approved' ? data?.profile?.recent_reviews ?? [] : [])
  const displayedReviews = bundle.isOwn
    ? ownReviewItems
        .map((item) => mapProfileReviewToVm(item, {
          username: bundle.username,
          displayName: bundle.username,
          avatarUrl: bundle.avatarUrl,
          isActive: bundle.is_active,
        }))
        .sort((a, b) => {
          const left = new Date(a.review.created_at ?? '').getTime()
          const right = new Date(b.review.created_at ?? '').getTime()
          return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0)
        })
    : bundle.reviews
  const displayedLikedReviews = likedReviewsQuery.data ?? bundle.liked

  return (
    <section className="page">
      <h1 className="pageTitle">{title}</h1>

      <div className="profileLayout">
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
              <h2 className="profileUsername">{bundle.is_active ? `${bundle.username}` : 'Аккаунт удален'}</h2>
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
          <div className="profileTabsRow">
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

            {bundle.isOwn && activeTab === 'reviews' && (
              <div className="profileReviewFilters" aria-label="Фильтры рецензий профиля">
                <label className="profileReviewFilter" title="Показывать отклоненные рецензии">
                  <input
                    type="checkbox"
                    checked={reviewStatusFilter === 'rejected'}
                    onChange={(event) => setReviewStatusFilter(event.target.checked ? 'rejected' : 'approved')}
                  />
                  <span aria-hidden="true" className="profileReviewFilterIcon">
                    ×
                  </span>
                  <span>Удаленные</span>
                </label>
                <label className="profileReviewFilter" title="Показывать рецензии, ожидающие модерации">
                  <input
                    type="checkbox"
                    checked={reviewStatusFilter === 'pending'}
                    onChange={(event) => setReviewStatusFilter(event.target.checked ? 'pending' : 'approved')}
                  />
                  <span aria-hidden="true" className="profileReviewFilterIcon">
                    ✓
                  </span>
                  <span>На модерации</span>
                </label>
              </div>
            )}
          </div>

          <section className="profileContent">
            {activeTab === 'reviews' && (
              <>
                {bundle.isOwn && ownReviewsQuery.isLoading ? (
                  <div className="profileReviewList reviewColumn" aria-busy="true">
                    <div className="profileReviewSkeleton skeleton" />
                  </div>
                ) : bundle.isOwn && ownReviewsQuery.error ? (
                  <div className="placeholder">{ownReviewsQuery.error}</div>
                ) : displayedReviews.length > 0 ? (
                  <div className="profileReviewList reviewColumn">
                    {displayedReviews.map((item) => (
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
                {isFavoritesLoading ? (
                  <div className="profileReviewList reviewColumn" aria-busy="true">
                    <div className="profileReviewSkeleton skeleton" />
                  </div>
                ) : favoritesError ? (
                  <div className="placeholder">{favoritesError}</div>
                ) : (
                <div className="profileFavoritesBlocks" aria-label="Избранное">
                  {(
                    [
                      { title: 'Концерты', items: displayedFavorites.concerts },
                      { title: 'Артисты', items: displayedFavorites.artists },
                      { title: 'Площадки', items: displayedFavorites.venues },
                    ] as const
                  ).map((block) => (
                    <article key={block.title} className="profileFavoritesBlock">
                      <div className="profileFavoritesHeader">
                        <h3 className="profileFavoritesTitle">{block.title}</h3>
                        <div className="profileFavoritesLine" aria-hidden="true" />
                      </div>

                      <div className="profileFavoritesRow" role="list" aria-label={block.title}>
                        {block.items.length === 0 && (
                          <div className="profileFavoritesEmpty" role="listitem">
                            нет избранных
                          </div>
                        )}
                        {block.items.slice(0, 5).map((item) => (
                          <Link
                            key={item.key}
                            to={item.to}
                            className="profileFavoriteCircleItem profileFavoriteCircleLink"
                            role="listitem"
                            aria-label={item.title}
                          >
                            <div className="profileFavoriteCircle" aria-hidden="true">
                              {item.imageUrl ? (
                                <img
                                  className="profileFavoriteCircleImg"
                                  src={item.imageUrl}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="profileFavoriteCircleFallback" />
                              )}
                            </div>
                            <div className="profileFavoriteCaption">{item.title}</div>
                          </Link>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                )}
              </>
            )}

            {activeTab === 'liked' && (
              <>
                {likedReviewsQuery.isLoading ? (
                  <div className="profileReviewList reviewColumn" aria-busy="true">
                    <div className="profileReviewSkeleton skeleton" />
                  </div>
                ) : likedReviewsQuery.error ? (
                  <div className="placeholder">{likedReviewsQuery.error}</div>
                ) : displayedLikedReviews.length > 0 ? (
                  <div className="profileReviewList reviewColumn">
                    {displayedLikedReviews.map((review) => (
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
