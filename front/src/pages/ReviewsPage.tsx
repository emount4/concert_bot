import { ReviewCard } from '../components/reviews/ReviewCard'
import { useAppData } from '../api/AppDataProvider'

export function ReviewsPage() {
  const { data, isLoading, error } = useAppData()
  const reviews = data?.reviews ?? []

  if (isLoading) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (error) {
    return <section className="page"><div className="placeholder">{error}</div></section>
  }

  return (
    <section className="page">
      {/* <h1 className="pageTitle">Рецензии</h1> */}

      {/* Задание 5.3: карточки рецензий с компактным заголовком и разворачиваемым текстом. */}
      <div className="reviewGrid">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  )
}
