import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { loadReviewById } from '../api/repository'
import type { ReviewCardItem } from '../types/review'

export function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>()
  const [review, setReview] = useState<ReviewCardItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!reviewId) {
      setReview(null)
      setError('Рецензия не найдена')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    void loadReviewById(reviewId)
      .then((loadedReview) => {
        if (cancelled) return
        setReview(loadedReview)
      })
      .catch((error) => {
        if (cancelled) return
        setReview(null)
        setError(error instanceof Error ? error.message : 'Не удалось загрузить рецензию')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reviewId])

  if (isLoading) {
    return (
      <section className="reviewDetailPage">
        <div className="placeholder">Загрузка рецензии...</div>
      </section>
    )
  }

  if (error || !review) {
    return (
      <section className="reviewDetailPage">
        <div className="placeholder">{error ?? 'Рецензия не найдена'}</div>
      </section>
    )
  }

  return (
    <section className="reviewDetailPage">
      <div className="reviewDetailCardWrap">
        <ReviewCard review={review} textMode="expanded" />
      </div>
    </section>
  )
}
