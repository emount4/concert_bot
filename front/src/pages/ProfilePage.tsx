import { ReviewCard } from '../components/reviews/ReviewCard'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { MOCK_PROFILE } from '../data/mockProfile'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function ProfilePage() {
  // Задание 6.3: витрина профиля в стиле дашборда с моими рецензиями.
  const profile = MOCK_PROFILE
  const profileReviewCards = profile.recent_reviews
    .map((item) => MOCK_REVIEWS.find((review) => review.id === item.id))
    .filter((review): review is NonNullable<typeof review> => Boolean(review))
    .map((review) => ({ ...review, author_name: profile.displayName }))

  return (
    <section className="page">
      <h1 className="pageTitle">Мой профиль</h1>

      <div className="profileLayout">
        <article className="profileHero">
          <div className="profileHeroHead">
            <div className="profileAvatar" aria-hidden="true" />

            <div className="profileIdentity">
              <h2 className="profileName">{profile.displayName}</h2>
              <p className="profileHandle">{profile.handle}</p>
              <p className="profileSince">С нами с {formatDate(profile.created_at)}</p>
            </div>
          </div>

          <p className="profileBio">{profile.bio}</p>
        </article>

        <aside className="profileStats">
          <h3 className="profileBlockTitle">Статистика</h3>

          <div className="profileStatGrid">
            <div className="profileStatCard">
              <p className="profileStatValue">{profile.reviews_count}</p>
              <p className="profileStatLabel">Всего рецензий</p>
            </div>

            <div className="profileStatCard">
              <p className="profileStatValue">{profile.approved_count}</p>
              <p className="profileStatLabel">Одобрено</p>
            </div>

            <div className="profileStatCard">
              <p className="profileStatValue">{profile.pending_count}</p>
              <p className="profileStatLabel">На модерации</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="profileReviews">
        <h3 className="profileBlockTitle">Мои последние рецензии</h3>

        <div className="profileReviewList reviewColumn">
          {profileReviewCards.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </section>
  )
}

