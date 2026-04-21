import type { Concert } from '../../types/concert'
import { InfoIcon } from './InfoIcon'

type ConcertCardProps = {
  concert: Concert
}

function formatConcertDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function ReviewsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 4.8h7.6l3 3V19a2.2 2.2 0 0 1-2.2 2.2H7.5A2.2 2.2 0 0 1 5.3 19V7A2.2 2.2 0 0 1 7.5 4.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.1 4.8V8h3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 11.2h7.6M8.2 14.7h7.6M8.2 18.2h5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ConcertCard({ concert }: ConcertCardProps) {
  // Задание 2.2: карточка работает с API-структурой концерта.
  const artistsLabel = concert.artists.map((artist) => artist.name).join(', ') || 'Артист не указан'
  const rating = concert.stats.avg_rating_total
  const roundedRating = rating === null ? null : Math.round(rating)
  const hasReviews = concert.stats.reviews_count > 0

  return (
    <article className="concertCard">
      {/* Задание 2.3: заменить заглушку афиши на реальное изображение (если есть URL). */}
      <div className="concertPoster" aria-label="Постер концерта">
        {concert.poster_url && (
          <img
            className="concertPosterImg"
            src={concert.poster_url}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      <div className="concertBottom">
        <div className="concertInfo">
          <h2 className="concert_title">{concert.title ?? 'Без названия'}</h2>

          <p className="concertMeta">
            <InfoIcon kind="artist" />
            <span className="metaText">{artistsLabel}</span>
          </p>

          <p className="concertMeta">
            <InfoIcon kind="date" />
            <span className="metaText">{formatConcertDate(concert.date)}</span>
          </p>

          <p className="concertMeta">
            <InfoIcon kind="venue" />
            <span className="metaText">{`${concert.venue.name}, ${concert.venue.city}`}</span>
          </p>
        </div>

        {(roundedRating !== null || hasReviews) && (
          <div className="ratingPanel">
            {roundedRating !== null && (
              <div className="ratingCircle" aria-label={`Средняя оценка ${roundedRating}`}>
                {roundedRating}
              </div>
            )}

            {hasReviews && (
              <div
                className="concertReviewsBadge"
                aria-label={`Рецензий: ${concert.stats.reviews_count}`}
                title={`Рецензий: ${concert.stats.reviews_count}`}
              >
                <span className="concertReviewsIcon" aria-hidden="true">
                  <ReviewsIcon />
                </span>
                <span className="concertReviewsValue">{concert.stats.reviews_count}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

