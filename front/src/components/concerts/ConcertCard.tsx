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

function formatReviewsCount(value: number): string {
  const mod10 = value % 10
  const mod100 = value % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${value} рецензия`
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${value} рецензии`
  }

  return `${value} рецензий`
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

            {hasReviews && <p className="reviews_count">{formatReviewsCount(concert.stats.reviews_count)}</p>}
          </div>
        )}
      </div>
    </article>
  )
}

