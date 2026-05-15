import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReviewCard } from '../components/reviews/ReviewCard'
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

  const artistsLabel = concert?.artists.map((artist) => artist.name).join(', ') || review.concert_artist
  const concertTitle = concert?.title ?? review.concert_title
  const concertPosterUrl = concert?.poster_url ?? review.concert_poster_url
  const concertHref = `/concerts/${encodeURIComponent(String(review.concert_id ?? review.concertId))}/rate`

  return (
    <section className="reviewDetailPage">
      <article className="rateHero reviewConcertHero">
        <div className="rateHeroMain">
          <div className="rateHeroPosterWrapper">
            <Link to={concertHref} className="rateHeroPoster reviewConcertHeroPoster" aria-label="Открыть концерт">
              <div className="rateHeroPosterMedia">
                {concertPosterUrl ? (
                  <img src={concertPosterUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                ) : (
                  <div className="rateHeroPosterFallback" />
                )}
              </div>
            </Link>
          </div>

          <div className="rateHeroContent">
            <div className="rateHeroInfoRow">
              <div className="rateHeroTags">
                {concert?.date && <span className="rateHeroTag">{formatReviewDetailDate(concert.date)}</span>}
                {concert?.venue && (
                  <Link to={`/venues?venue_id=${concert.venue.id}`} className="rateHeroTag rateHeroTagLink">
                    {concert.venue.name}, {concert.venue.city}
                  </Link>
                )}
              </div>
            </div>

            <Link to={concertHref} className="rateHeroTitle reviewConcertHeroTitle">
              {concertTitle}
            </Link>

            {artistsLabel && (
              <div className="rateHeroLinks">
                {concert?.artists.length
                  ? concert.artists.map((artist) => (
                      <Link key={artist.id} to={`/artists?artistId=${artist.id}`} className="rateLinkChip">
                        {artist.name}
                      </Link>
                    ))
                  : <span className="rateHeroMeta">{artistsLabel}</span>}
              </div>
            )}

            {concert?.stats.reviews_count ? (
              <div className="reviewConcertHeroStats">
                {concert.stats.avg_rating_total !== null && concert.stats.avg_rating_total > 0 && (
                  <span className="rateHeroAverageBadge">{Math.round(concert.stats.avg_rating_total)}</span>
                )}
                <span className="reviewConcertHeroReviewCount">
                  Рецензий: {concert.stats.reviews_count}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <div className="reviewDetailCardWrap">
        <ReviewCard review={review} textMode="expanded" />
      </div>
    </section>
  )
}
