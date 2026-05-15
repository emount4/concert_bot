import { useEffect, useMemo, useState } from 'react'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { loadReviews } from '../api/repository'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import { useQuery } from '../utils/useQuery'

const REVIEWS_PAGE_SIZE = 18

export function ReviewsPage() {
  const reviewsQuery = useQuery(['reviews', 'list'], () =>
    loadReviews({ limit: 20, offset: 0, sort: 'created_at', direction: 'DESC' }).then((res) => res.items),
  )
  const reviews = reviewsQuery.data ?? []

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [reviews.length])

  const pageCount = Math.ceil(reviews.length / REVIEWS_PAGE_SIZE)
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, pageCount), [currentPage, pageCount])
  const pagedReviews = useMemo(() => {
    const offset = (currentPage - 1) * REVIEWS_PAGE_SIZE
    return reviews.slice(offset, offset + REVIEWS_PAGE_SIZE)
  }, [currentPage, reviews])

  if (reviewsQuery.isLoading) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (reviewsQuery.error) {
    return <section className="page"><div className="placeholder">{reviewsQuery.error}</div></section>
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Рецензии</h1>

      {/* Задание 5.3: карточки рецензий с компактным заголовком и разворачиваемым текстом. */}
      {reviews.length > 0 ? (
        <>
          <div className="reviewGrid">
            {pagedReviews.map((review) => (
              <ReviewCard key={`${review.review_id ?? review.id}-${review.concertId}`} review={review} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="pagination" role="navigation" aria-label="Пагинация рецензий">
              {paginationItems.map((item, index) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="paginationEllipsis" aria-hidden="true">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={item === currentPage ? 'settingsBtn primary' : 'settingsBtn ghost'}
                    onClick={() => {
                      setCurrentPage(item)
                      scrollToTop()
                    }}
                    aria-current={item === currentPage ? 'page' : undefined}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          )}
        </>
      ) : (
        <div className="placeholder">Пока нет рецензий</div>
      )}
    </section>
  )
}
