import { ReviewCard } from '../components/reviews/ReviewCard'
import { MOCK_REVIEWS } from '../data/mockReviews'

export function ReviewsPage() {
  return (
    <section className="page">
      {/* <h1 className="pageTitle">Рецензии</h1> */}

      {/* Задание 5.3: карточки рецензий с компактным заголовком и разворачиваемым текстом. */}
      <div className="reviewGrid">
        {MOCK_REVIEWS.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  )
}
