import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { RatingBreakdownBadge } from '../components/ratings/RatingBreakdownBadge'
import { ErrorState } from '../components/ui/ErrorState'
import { DetailSkeleton } from '../components/ui/Skeletons'
import { loadConcertById, loadReviewById } from '../api/repository'
import type { Concert } from '../types/concert'
import type { ReviewCardItem } from '../types/review'

function formatReviewDetailDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>()
  const [review, setReview] = useState<ReviewCardItem | null>(null)
  const [concert, setConcert] = useState<Concert | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!reviewId) {
      setReview(null)
      setConcert(null)
      setError('Рецензия не найдена')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setConcert(null)
    void loadReviewById(reviewId)
      .then(async (loadedReview) => {
        if (cancelled) return
        setReview(loadedReview)

        try {
          const loadedConcert = await loadConcertById(loadedReview.concert_id ?? loadedReview.concertId)
          if (!cancelled) setConcert(loadedConcert)
        } catch {
          if (!cancelled) setConcert(null)
        }
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
    return <DetailSkeleton title="Рецензия" media="poster" />
  }

  if (error || !review) {
    return (
      <section className="page reviewDetailPage errorPage">
        <h1 className="pageTitle mobilePageTitle">Рецензия</h1>
        <ErrorState
          code={!review ? '404' : undefined}
          title={!review ? 'Рецензия не найдена' : 'Не получилось загрузить рецензию'}
          text={error ?? 'Рецензия удалена, скрыта модерацией или ссылка устарела.'}
          actions={[
            { label: 'К рецензиям', to: '/reviews', variant: 'primary' },
            { label: 'На главную', to: '/home', variant: 'ghost' },
          ]}
        />
      </section>
    )
  }

  const artistsLabel = concert?.artists.map((artist) => artist.name).join(', ') || review.concert_artist
  const concertTitle = concert?.title ?? review.concert_title
  const concertPosterUrl = concert?.poster_url ?? review.concert_poster_url
  const concertHref = `/concerts/${encodeURIComponent(String(review.concert_id ?? review.concertId))}/rate`
  const reviewRatingTotal = review.rating_total ?? null
  const avgRatingTotal =
    concert?.stats.reviews_count && concert.stats.avg_rating_total !== null && concert.stats.avg_rating_total > 0
      ? Math.round(concert.stats.avg_rating_total)
      : null
  const ratingBreakdown = concert?.stats.reviews_count
    ? [
        { label: 'Исполнение', value: concert.stats.avg_p1 ?? 0 },
        { label: 'Динамика / трек-лист', value: concert.stats.avg_p2 ?? 0 },
        { label: 'Харизма', value: concert.stats.avg_p3 ?? 0 },
        { label: 'Звук/Визуал', value: concert.stats.avg_p4 ?? 0 },
        { label: 'Вайб', value: concert.stats.avg_p5 ?? 0 },
      ].filter((item) => item.value > 0)
    : []

  return (
    <section className="page reviewDetailPage">
      <h1 className="pageTitle mobilePageTitle">Рецензия</h1>

      <article className="reviewDetailHero">
        <Link to={concertHref} className="reviewDetailHeroPoster" aria-label="Открыть концерт">
          <div className="rateHeroPosterMedia">
            {concertPosterUrl ? (
              <img src={concertPosterUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            ) : (
              <div className="rateHeroPosterFallback" />
            )}
          </div>
          {concertPosterUrl && (
            <p className="photoSource">
              {concert?.poster_source ?? 'Источник фото: соцсети артиста'}
            </p>
          )}
        </Link>

        <div className="reviewDetailHeroContent">
          <div className="reviewDetailHeroTop">
            <span className="reviewDetailHeroType">Концерт</span>

            {concert?.stats.reviews_count ? (
              <Link to={concertHref} className="reviewDetailHeroReviews">
                Рецензий: {concert.stats.reviews_count}
              </Link>
            ) : null}
          </div>

          <Link to={concertHref} className="reviewDetailHeroTitle">
            {concertTitle}
          </Link>

          <div className="reviewDetailHeroMeta">
            {concert?.artists.length
              ? concert.artists.map((artist) => (
                  <Link key={artist.id} to={`/artists?artistId=${artist.id}`} className="reviewDetailHeroArtist">
                    {artist.name}
                  </Link>
                ))
              : artistsLabel && <span className="reviewDetailHeroArtist">{artistsLabel}</span>}

            {concert?.date && <span className="reviewDetailHeroDate">{formatReviewDetailDate(concert.date)}</span>}

            {concert?.venue && (
              <Link to={`/venues?venue_id=${concert.venue.id}`} className="reviewDetailHeroVenue">
                {concert.venue.name}, {concert.venue.city}
              </Link>
            )}
          </div>

          <div className="reviewDetailHeroBottom">
            <div className="reviewDetailHeroScores" aria-label="Оценки">
              {avgRatingTotal !== null && (
                <RatingBreakdownBadge
                  value={avgRatingTotal}
                  className="rateHeroAverageBadge"
                  ariaLabel="Средняя оценка концерта"
                  breakdown={ratingBreakdown}
                />
              )}

              {reviewRatingTotal !== null && (
                <span className="reviewDetailHeroUserScore" aria-label="Оценка этой рецензии">
                  {reviewRatingTotal}
                </span>
              )}
            </div>

            <Link to={concertHref} className="reviewDetailHeroOpen">
              Открыть концерт
            </Link>
          </div>
        </div>
      </article>

      <Link to={concertHref} className="reviewDetailBackLink">
        ← Посмотреть все рецензии на концерт
      </Link>

      <div className="reviewDetailCardWrap">
        <ReviewCard review={review} textMode="expanded" />
      </div>
    </section>
  )
}
