import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { MOCK_PROFILE } from '../data/mockProfile'
import { MOCK_REVIEWS } from '../data/mockReviews'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function buildHandle(displayName: string): string {
  return `@${displayName.trim().toLowerCase().replace(/\s+/g, '_')}`
}

export function UserProfilePage() {
  // Задание 12.1: публичный профиль автора по клику на человека в интерфейсе.
  const params = useParams<{ displayName: string }>()
  const displayName = decodeURIComponent(params.displayName ?? '').trim()

  const userReviews = useMemo(
    () => MOCK_REVIEWS.filter((review) => review.author_name === displayName),
    [displayName],
  )
  const avgScore =
    userReviews.length > 0
      ? Math.round(userReviews.reduce((sum, review) => sum + review.rating_total, 0) / userReviews.length)
      : null
  const mediaReviewsCount = userReviews.filter((review) => (review.media?.length ?? 0) > 0).length

  const isOwnProfileData = displayName === MOCK_PROFILE.displayName
  const profileSince = isOwnProfileData ? formatDate(MOCK_PROFILE.created_at) : 'дата регистрации неизвестна'
  const profileBio = isOwnProfileData
    ? MOCK_PROFILE.bio
    : 'Пользователь публикует рецензии на концерты и делится впечатлениями о выступлениях.'
  const profileHandle = isOwnProfileData ? MOCK_PROFILE.handle : buildHandle(displayName)

  if (!displayName) {
    return (
      <section className="page">
        <h1 className="pageTitle">Профиль пользователя</h1>
        <div className="placeholder">Пользователь не найден</div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="detailHeaderRow">
        <h1 className="pageTitle">Профиль пользователя</h1>
        <Link to="/reviews" className="detailBackLink">
          Все рецензии
        </Link>
      </div>

      <div className="profileLayout">
        <article className="profileHero">
          <div className="profileHeroHead">
            <div className="profileAvatar" aria-hidden="true" />

            <div className="profileIdentity">
              <h2 className="profileName">{displayName}</h2>
              <p className="profileHandle">{profileHandle}</p>
              <p className="profileSince">С нами с {profileSince}</p>
            </div>
          </div>

          <p className="profileBio">{profileBio}</p>
        </article>

        <aside className="profileStats">
          <h3 className="profileBlockTitle">Статистика</h3>

          <div className="profileStatGrid">
            <div className="profileStatCard">
              <p className="profileStatValue">{userReviews.length}</p>
              <p className="profileStatLabel">Всего рецензий</p>
            </div>

            <div className="profileStatCard">
              <p className="profileStatValue">{avgScore ?? '-'}</p>
              <p className="profileStatLabel">Средняя оценка</p>
            </div>

            <div className="profileStatCard">
              <p className="profileStatValue">{mediaReviewsCount}</p>
              <p className="profileStatLabel">С медиа</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="profileReviews">
        <h3 className="profileBlockTitle">Последние рецензии</h3>

        {userReviews.length > 0 ? (
          <div className="profileReviewList reviewColumn">
            {userReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="placeholder">У этого пользователя пока нет рецензий</div>
        )}
      </section>
    </section>
  )
}

