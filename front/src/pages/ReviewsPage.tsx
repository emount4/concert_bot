import { useEffect, useMemo, useState } from 'react'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { ReviewGrid } from '../components/reviews/ReviewGrid'
import { loadReviews } from '../api/repository'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import { useQuery } from '../utils/useQuery'
import { ErrorState } from '../components/ui/ErrorState'
import { SkeletonGrid } from '../components/ui/Skeletons'

const REVIEWS_PAGE_SIZE = 18

export function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const reviewsQuery = useQuery(['reviews', 'list', currentPage], () =>
    loadReviews({
      limit: REVIEWS_PAGE_SIZE,
      offset: (currentPage - 1) * REVIEWS_PAGE_SIZE,
      sort: 'created_at',
      direction: 'DESC',
    }),
  )
  const reviews = reviewsQuery.data?.items ?? []

  const pageCount = reviewsQuery.data?.page_count ?? 0
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, pageCount), [currentPage, pageCount])

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  if (reviewsQuery.isLoading) {
    return <SkeletonGrid title="Рецензии" variant="review" count={6} />
  }

  if (reviewsQuery.error) {
    return (
      <section className="page errorPage">
        <ErrorState
          title="Не получилось загрузить рецензии"
          text={reviewsQuery.error}
          actions={[
            { label: 'Повторить', onClick: () => reviewsQuery.refetch(), variant: 'primary' },
            { label: 'На главную', to: '/home', variant: 'ghost' },
          ]}
        />
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Рецензии</h1>

      {/* Задание 5.3: карточки рецензий с компактным заголовком и разворачиваемым текстом. */}
      {reviews.length > 0 ? (
        <>
          <ReviewGrid>
            {reviews.map((review) => (
              <ReviewCard key={`${review.review_id ?? review.id}-${review.concertId}`} review={review} />
            ))}
          </ReviewGrid>

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
