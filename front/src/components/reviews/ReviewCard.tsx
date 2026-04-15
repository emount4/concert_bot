import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ReviewCardItem } from '../../types/review'

type ReviewCardProps = {
  review: ReviewCardItem
  textMode?: 'collapsible' | 'expanded'
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

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21s-7-4.6-9.4-9.2C.8 8.6 2.3 6 5.2 5.2c2-.6 4 .1 5.2 1.6 1.2-1.5 3.2-2.2 5.2-1.6 2.9.8 4.4 3.4 2.6 6.6C19 16.4 12 21 12 21Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.6s-7-4.4-9.3-8.9C.9 8.6 2.3 6 5.2 5.2c2-.6 4 .1 5.2 1.6 1.2-1.5 3.2-2.2 5.2-1.6 2.9.8 4.3 3.4 2.5 6.5C19 16.2 12 20.6 12 20.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 11.3a3.6 3.6 0 1 0-3.6-3.6A3.6 3.6 0 0 0 9 11.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.2 20.2a6.1 6.1 0 0 1 11.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.7 10.5a2.8 2.8 0 1 0-2.8-2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.2 13.7a5.3 5.3 0 0 1 4.6 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MediaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 6.5h11A2.5 2.5 0 0 1 20 9v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 17V9a2.5 2.5 0 0 1 2.5-2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.2 14.2 10.2 12l2.2 2.4 2.2-1.7 2.2 2.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 10.6a.9.9 0 1 0-.9-.9.9.9 0 0 0 .9.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ReviewCard({ review, textMode = 'collapsible' }: ReviewCardProps) {
  // Задание 10.2: сворачивание текста и просмотр прикрепленных медиа в карточке рецензии.
  const [expanded, setExpanded] = useState(textMode === 'expanded')
  const [isMediaOpen, setIsMediaOpen] = useState(false)
  const [isLikesOpen, setIsLikesOpen] = useState(false)
  // Задание 10.3: просмотр вложений по одному с переключением стрелками.
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const media = review.media ?? []
  const currentMedia = media[currentMediaIndex] ?? null
  const navigate = useNavigate()
  const authorLinkParam = encodeURIComponent(review.author_username ?? review.author_name)

  const allowTextToggle = textMode === 'collapsible'

  useEffect(() => {
    if (textMode === 'expanded') {
      setExpanded(true)
    }
  }, [textMode])

  const baseLikes = review.likes ?? []
  const storageKey = `concert_bot.review_like.${review.id}`
  const [likedByMe, setLikedByMe] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(storageKey) === '1'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, likedByMe ? '1' : '0')
  }, [likedByMe, storageKey])

  const likesCount = baseLikes.length + (likedByMe ? 1 : 0)

  const likeEntries = useMemo(() => {
    const entries: Array<{ key: string; name: string; href: string; avatarUrl: string | null }> = []

    if (likedByMe) {
      entries.push({ key: 'me', name: 'Вы', href: '/profile', avatarUrl: null })
    }

    baseLikes.forEach((user, index) => {
      const handle = (user.username ?? user.name).trim()
      const href = `/users/${encodeURIComponent(handle)}`
      entries.push({
        key: `${handle}-${index}`,
        name: user.name,
        href,
        avatarUrl: user.avatar_url ?? null,
      })
    })

    return entries
  }, [baseLikes, likedByMe])

  return (
    <article className="reviewCard">
      <header className="reviewHeader">
        <Link to={`/users/${authorLinkParam}`} className="reviewAuthor reviewAuthorLink">
          {/* Задание 10.4: маленькая афиша и аватар пользователя в карточке рецензии. */}
          <div className="reviewAvatar" aria-hidden="true">
            {review.author_avatar_url ? (
              <img
                className="reviewAvatarImg"
                src={review.author_avatar_url}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <svg className="reviewAvatarFallback" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M5 20.5a7 7 0 0 1 14 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
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
          <div className="reviewFooterLeft" aria-label="Действия с рецензией">
            <button
              type="button"
              className={likedByMe ? 'reviewIconBtn reviewLikeBtn liked' : 'reviewIconBtn reviewLikeBtn'}
              onClick={() => setLikedByMe((prev) => !prev)}
              aria-label={likedByMe ? 'Убрать лайк' : 'Поставить лайк'}
            >
              <HeartIcon filled={likedByMe} />
              {likesCount > 0 && <span className="reviewLikeCount">{likesCount}</span>}
            </button>

            {likesCount > 0 && (
              <button
                type="button"
                className="reviewIconBtn"
                onClick={() => setIsLikesOpen(true)}
                aria-label="Показать список лайкнувших"
              >
                <UsersIcon />
              </button>
            )}

            {media.length > 0 && (
              <button
                type="button"
                className="reviewIconBtn"
                onClick={() => {
                  setCurrentMediaIndex(0)
                  setIsMediaOpen(true)
                }}
                aria-label={`Открыть вложения рецензии (${media.length})`}
              >
                <MediaIcon />
              </button>
            )}
          </div>

          {allowTextToggle && (
            <button
              type="button"
              className="reviewExpandBtn"
              aria-label={expanded ? 'Свернуть текст рецензии' : 'Развернуть текст рецензии'}
              onClick={() => setExpanded((v) => !v)}
            >
              <ExpandIcon expanded={expanded} />
            </button>
          )}
        </div>
      </div>

      {isLikesOpen && (
        <div className="reviewLikesBackdrop" onClick={() => setIsLikesOpen(false)}>
          <article className="reviewLikesCard" onClick={(event) => event.stopPropagation()}>
            <div className="reviewLikesHeader">
              <h3 className="reviewLikesTitle">Лайкнули</h3>
              <button type="button" className="reviewLikesClose" onClick={() => setIsLikesOpen(false)}>
                Закрыть
              </button>
            </div>

            {likeEntries.length > 0 ? (
              <div className="reviewLikesList" role="list">
                {likeEntries.map((entry) => (
                  <Link key={entry.key} to={entry.href} className="reviewLikesItem" role="listitem">
                    <div className="reviewLikesAvatar" aria-hidden="true">
                      {entry.avatarUrl ? (
                        <img
                          className="reviewLikesAvatarImg"
                          src={entry.avatarUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <svg className="reviewLikesAvatarFallback" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M5 20.5a7 7 0 0 1 14 0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="reviewLikesName">{entry.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="placeholder">Пока нет лайков</div>
            )}
          </article>
        </div>
      )}

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

