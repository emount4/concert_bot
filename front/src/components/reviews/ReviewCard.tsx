import { useState } from 'react'
import type { ReviewCardItem } from '../../types/review'

type ReviewCardProps = {
  review: ReviewCardItem
}

type ScoreChip = {
  label: string
  value: number
}

function scoreRow(review: ReviewCardItem): ScoreChip[] {
  return [
    { label: 'Исполнение', value: review.scores.performance },
    { label: 'Динамика / трек-лист', value: review.scores.setlist },
    { label: 'Подача / взаимодействие с аудиторией', value: review.scores.crowd },
    { label: 'Работа звукаря (продакшн)', value: review.scores.sound },
    { label: 'Вайб', value: review.scores.vibe },
  ]
}

function ExpandIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 14.5 12 8.5l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9.5 12 15.5l6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ReviewCard({ review }: ReviewCardProps) {
  // Задание 5.4: сворачивание/разворачивание текста рецензии внутри карточки.
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="reviewCard">
      <header className="reviewHeader">
        <div className="reviewAuthor">
          <div className="reviewAvatar" aria-hidden="true" />
          <p className="reviewAuthorName">{review.authorName}</p>
        </div>

        <div className="reviewScoreWrap">
          <div className="ratingCircle reviewRatingCircle">{review.overallScore}</div>

          <div className="reviewParamRow" aria-label="Оценки по параметрам">
            {scoreRow(review).map((item, idx) => (
              <span key={`${review.id}-${idx}`} className="reviewParamItem" title={item.label}>
                <span className="reviewParamValue">{item.value}</span>
                <span className="reviewParamTooltip">{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="reviewConcertPosterWrap" aria-hidden="true">
          <div className="reviewConcertPosterMedia">
            {review.concertPosterUrl ? (
              <img className="reviewConcertPosterImg" src={review.concertPosterUrl} alt="" />
            ) : (
              <div className="reviewConcertPosterFallback" />
            )}
          </div>

          <div className="reviewPosterTooltip">
            <p className="reviewPosterTooltipTitle">{review.concertTitle}</p>
            <p className="reviewPosterTooltipArtist">{review.concertArtist}</p>
          </div>
        </div>
      </header>

      <div className="reviewBody">
        <h2 className="reviewConcertTitle">{review.concertTitle}</h2>

        <p className={expanded ? 'reviewText expanded' : 'reviewText'}>{review.text}</p>

        <div className="reviewFooter">
          <button
            type="button"
            className="reviewExpandBtn"
            aria-label={expanded ? 'Свернуть текст рецензии' : 'Развернуть текст рецензии'}
            onClick={() => setExpanded((v) => !v)}
          >
            <ExpandIcon expanded={expanded} />
          </button>
        </div>
      </div>
    </article>
  )
}
