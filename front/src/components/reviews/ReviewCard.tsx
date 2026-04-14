import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  // Задание 10.2: сворачивание текста и просмотр прикрепленных медиа в карточке рецензии.
  const [expanded, setExpanded] = useState(false)
  const [isMediaOpen, setIsMediaOpen] = useState(false)
  // Задание 10.3: просмотр вложений по одному с переключением стрелками.
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const media = review.media ?? []
  const currentMedia = media[currentMediaIndex] ?? null
  const navigate = useNavigate()
  const authorLinkParam = encodeURIComponent(review.author_username ?? review.author_name)

  return (
    <article className="reviewCard">
      <header className="reviewHeader">
        <Link to={`/users/${authorLinkParam}`} className="reviewAuthor reviewAuthorLink">
          {/* Задание 10.4: маленькая афиша и аватар пользователя в карточке рецензии. */}
          <div className="reviewAvatar" aria-hidden="true">
            {review.author_avatar_url && (
              <img
                className="reviewAvatarImg"
                src={review.author_avatar_url}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <p className="reviewAuthorName">{review.author_name}</p>
        </Link>

        <div className="reviewScoreWrap">
          <div className="ratingCircle reviewRatingCircle">{review.rating_total}</div>

          <div className="reviewParamRow" aria-label="Оценки по параметрам">
            {scoreRow(review).map((item, idx) => (
              <span key={`${review.id}-${idx}`} className="reviewParamItem" title={item.label}>
                <span className="reviewParamValue">{item.value}</span>
                <span className="reviewParamTooltip">{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="reviewConcertPosterWrap reviewPosterBtn"
          aria-label="Открыть страницу оценивания концерта"
          onClick={() => navigate(`/concerts/${review.concertId}/rate`)}
        >
          <div className="reviewConcertPosterMedia">
            {review.concert_poster_url ? (
              <img
                className="reviewConcertPosterImg"
                src={review.concert_poster_url}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="reviewConcertPosterFallback" />
            )}
          </div>

          <div className="reviewPosterTooltip">
            <p className="reviewPosterTooltipTitle">{review.concert_title}</p>
            <p className="reviewPosterTooltipArtist">{review.concert_artist}</p>
          </div>
        </button>
      </header>

      <div className="reviewBody">
        <h2 className="reviewConcertTitle">{review.concert_title}</h2>

        <p className={expanded ? 'reviewText expanded' : 'reviewText'}>{review.text}</p>

        <div className="reviewFooter">
          {media.length > 0 && (
            <button
              type="button"
              className="reviewMediaBtn"
              onClick={() => {
                setCurrentMediaIndex(0)
                setIsMediaOpen(true)
              }}
              aria-label={`Открыть вложения рецензии (${media.length})`}
            >
              Медиа ({media.length})
            </button>
          )}

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

      {isMediaOpen && (
        <div className="reviewMediaBackdrop" onClick={() => setIsMediaOpen(false)}>
          <article className="reviewMediaCard" onClick={(event) => event.stopPropagation()}>
            <div className="reviewMediaHeader">
              <h3 className="reviewMediaTitle">Вложения рецензии</h3>
              <button type="button" className="reviewMediaClose" onClick={() => setIsMediaOpen(false)}>
                Закрыть
              </button>
            </div>

            {currentMedia && (
              <>
                <div className="reviewMediaStage">
                  <button
                    type="button"
                    className="reviewMediaArrow"
                    aria-label="Предыдущее вложение"
                    onClick={() => setCurrentMediaIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentMediaIndex === 0}
                  >
                    ←
                  </button>

                  <div className="reviewMediaItem">
                    {currentMedia.type === 'video' ? (
                      <video className="reviewMediaAsset" src={currentMedia.url} controls preload="metadata" />
                    ) : (
                      <img className="reviewMediaAsset" src={currentMedia.url} alt="Вложение рецензии" />
                    )}
                  </div>

                  <button
                    type="button"
                    className="reviewMediaArrow"
                    aria-label="Следующее вложение"
                    onClick={() => setCurrentMediaIndex((prev) => Math.min(media.length - 1, prev + 1))}
                    disabled={currentMediaIndex === media.length - 1}
                  >
                    →
                  </button>
                </div>

                <p className="reviewMediaCounter">
                  {currentMediaIndex + 1} / {media.length}
                </p>
              </>
            )}
          </article>
        </div>
      )}
    </article>
  )
}

