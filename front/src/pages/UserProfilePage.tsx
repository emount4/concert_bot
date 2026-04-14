import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { useAppData } from '../api/AppDataProvider'

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

  const { data, isLoading, error } = useAppData()
  const profile = data?.profile
  const reviews = data?.reviews ?? []

  if (isLoading || !profile) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (error) {
    return <section className="page"><div className="placeholder">{error}</div></section>
  }

  const userReviews = useMemo(
    () => reviews.filter((review) => review.author_name === displayName),
    [displayName, reviews],
  )
  const avgScore =
    userReviews.length > 0
      ? Math.round(userReviews.reduce((sum, review) => sum + review.rating_total, 0) / userReviews.length)
      : null
  const mediaReviewsCount = userReviews.filter((review) => (review.media?.length ?? 0) > 0).length

  const isOwnProfileData = displayName === profile.displayName
  const profileSince = isOwnProfileData ? formatDate(profile.created_at) : 'дата регистрации неизвестна'
  const profileBio = isOwnProfileData
    ? profile.bio
    : 'Пользователь публикует рецензии на концерты и делится впечатлениями о выступлениях.'
  const profileHandle = isOwnProfileData ? profile.handle : buildHandle(displayName)

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

