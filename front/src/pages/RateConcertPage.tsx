import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { RatingBreakdownBadge } from '../components/ratings/RatingBreakdownBadge'
import { useAppData } from '../api/AppDataProvider'
import { computeAvgScoresFromReviews } from '../utils/reviewAverages'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import { useBodyScrollLock } from '../utils/useBodyScrollLock'

type ScoreState = {
  performance: number
  setlist: number
  crowd: number
  sound: number
  vibe: number
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

const RATE_REVIEWS_PAGE_SIZE = 10

export function RateConcertPage() {
  // Задание 11.1: первичный экран оценивания концерта с ползунками и списком рецензий.
  const { data, isLoading, error } = useAppData()
  const concerts = data?.concerts ?? []
  const reviews = data?.reviews ?? []

  const { concertId } = useParams<{ concertId: string }>()
  const numericConcertId = Number(concertId)
  const concert = useMemo(
    () => concerts.find((item) => item.id === numericConcertId) ?? null,
    [concerts, numericConcertId],
  )

  const [scores, setScores] = useState<ScoreState>({
    performance: 5,
    setlist: 5,
    crowd: 5,
    sound: 5,
    vibe: 1,
  })
  const [reviewTitle, setReviewTitle] = useState('')
  const [text, setText] = useState('')

  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false)
  const [isDraftToastVisible, setIsDraftToastVisible] = useState(false)
  const [isDraftReady, setIsDraftReady] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [attachedMedia, setAttachedMedia] = useState<File[]>([])

  useBodyScrollLock(isCriteriaOpen || isConfirmClearOpen || isMediaModalOpen)

  // Задание 11.5: выбор и управление прикрепленными медиа-файлами.
  const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    setAttachedMedia((prev) => [...prev, ...files])
    event.target.value = ''
  }

  const removeAttachedMedia = (indexToRemove: number) => {
    setAttachedMedia((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  // Задание 11.3: загрузка черновика для выбранного концерта.
  useEffect(() => {
    setIsDraftReady(false)
    if (numericConcertId) {
      const stored = localStorage.getItem(`draft_${numericConcertId}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.scores) setScores(parsed.scores)
          if (parsed.reviewTitle) setReviewTitle(parsed.reviewTitle)
          if (parsed.text) setText(parsed.text)
        } catch {
          localStorage.removeItem(`draft_${numericConcertId}`)
        }
      }

      setIsDraftReady(true)
      return
    }

    setIsDraftReady(true)
  }, [numericConcertId])

  // Задание 11.4: автосохранение черновика после паузы ввода.
  useEffect(() => {
    if (!numericConcertId || !isDraftReady) return

    const saveTimerId = window.setTimeout(() => {
      const draft = { scores, reviewTitle, text }
      localStorage.setItem(`draft_${numericConcertId}`, JSON.stringify(draft))
      setIsDraftToastVisible(true)
    }, 1200)

    return () => window.clearTimeout(saveTimerId)
  }, [numericConcertId, scores, reviewTitle, text, isDraftReady])

  useEffect(() => {
    if (!isDraftToastVisible) return

    const hideTimerId = window.setTimeout(() => {
      setIsDraftToastVisible(false)
    }, 1800)

    return () => window.clearTimeout(hideTimerId)
  }, [isDraftToastVisible])

  const clearDraft = () => {
    setIsConfirmClearOpen(true)
  }

  const confirmClearDraft = () => {
    setScores({ performance: 5, setlist: 5, crowd: 5, sound: 5, vibe: 1 })
    setReviewTitle('')
    setText('')
    localStorage.removeItem(`draft_${numericConcertId}`)
    setIsConfirmClearOpen(false)
    setIsDraftToastVisible(false)
  }

  const concertReviews = useMemo(
    () => reviews.filter((review) => review.concertId === numericConcertId),
    [numericConcertId, reviews],
  )

  const [reviewsPage, setReviewsPage] = useState(1)

  useEffect(() => {
    setReviewsPage(1)
  }, [numericConcertId, concertReviews.length])

  const rateReviewsPageCount = Math.ceil(concertReviews.length / RATE_REVIEWS_PAGE_SIZE)
  const rateReviewsPaginationItems = useMemo(
    () => buildPaginationItems(reviewsPage, rateReviewsPageCount),
    [reviewsPage, rateReviewsPageCount],
  )
  const pagedConcertReviews = useMemo(() => {
    const offset = (reviewsPage - 1) * RATE_REVIEWS_PAGE_SIZE
    return concertReviews.slice(offset, offset + RATE_REVIEWS_PAGE_SIZE)
  }, [concertReviews, reviewsPage])
  // Задание 13.2: раскладка средней оценки концерта по параметрам (до десятых).
  const concertAvgScores = useMemo(() => computeAvgScoresFromReviews(concertReviews), [concertReviews])
  const concertDateLabel = useMemo(() => {
    const date = new Date(concert?.date ?? '')
    if (Number.isNaN(date.getTime())) return concert?.date ?? ''

    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }, [concert])
  // Задание 11.2: итоговая оценка считается по формуле из plan.txt.
  const objectiveSum = scores.performance + scores.setlist + scores.crowd + scores.sound
  const vibeMultiplier = Math.pow(1.6072, (scores.vibe - 1) / 9)
  const overallRaw = objectiveSum * 1.4 * vibeMultiplier
  const rating_total = Math.min(90, overallRaw)
  const overallRounded = Math.round(rating_total)
  const avg_rating_total =
    concert?.stats.avg_rating_total === null || concert?.stats.avg_rating_total === undefined
      ? null
      : Math.round(concert.stats.avg_rating_total)

  if (isLoading) {
    return (
      <section className="page">
        <h1 className="pageTitle">Оценивание концерта</h1>
        <div className="placeholder">Загрузка данных...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <h1 className="pageTitle">Оценивание концерта</h1>
        <div className="placeholder">{error}</div>
      </section>
    )
  }

  if (!concert) {
    return (
      <section className="page">
        <h1 className="pageTitle">Оценивание концерта</h1>
        <div className="placeholder">Концерт не найден</div>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Оценивание концерта</h1>

      <article className="rateHero">
        <div className="rateHeroMain">
          <div className="rateHeroPosterWrapper">
            <div className="rateHeroPoster" aria-hidden="true">
              {concert.poster_url ? <img src={concert.poster_url} alt="" /> : <div className="rateHeroPosterFallback" />}
            </div>
          </div>

          <div className="rateHeroContent">
            <div className="rateHeroInfoRow">
              <div className="rateHeroTags">
                <span className="rateHeroTag">{concertDateLabel}</span>
                <Link to={`/venues?venue_id=${concert.venue.id}`} className="rateHeroTag rateHeroTagLink">
                  {concert.venue.name}, {concert.venue.city}
                </Link>
              </div>
              <button
                type="button"
                className={`rateHeroFavoriteBtn ${isFavorite ? 'active' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
                aria-label="В избранное"
                title="Добавить в избранное"
              >
                {isFavorite ? '♥' : '♡'}
              </button>
            </div>

            <h2 className="rateHeroTitle">{concert.title ?? 'Без названия'}</h2>

            <div className="rateHeroLinks">
              {concert.artists.map((artist) => (
                <Link key={artist.id} to={`/artists?artistId=${artist.id}`} className="rateLinkChip">
                  {artist.name}
                </Link>
              ))}
            </div>

            {avg_rating_total !== null && (
              <RatingBreakdownBadge
                value={avg_rating_total}
                className="rateHeroAverageBadge"
                ariaLabel="Средняя оценка концерта"
                breakdown={
                  concertAvgScores
                    ? [
                        { label: 'Исполнение', value: concertAvgScores.performance },
                        { label: 'Динамика / трек-лист', value: concertAvgScores.setlist },
                        { label: 'Харизма', value: concertAvgScores.crowd },
                        { label: 'Звук', value: concertAvgScores.sound },
                        { label: 'Вайб', value: concertAvgScores.vibe },
                      ]
                    : []
                }
              />
            )}
          </div>
        </div>
      </article>

      <section className="rateFormSection">
        <h3 className="rateSectionTitle">Оценка концерта</h3>

        <div className="rateScorePanel">
          <div className="rateSliderTopRow">
            <label className="rateSliderCard">
              <div className="rateSliderHead">
                <span className="rateSliderLabel">Исполнение</span>
                <span className="rateSliderValue">{scores.performance}</span>
              </div>
              <input
                className="rateSliderInput"
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores.performance}
                onChange={(event) =>
                  setScores((prev) => ({ ...prev, performance: Number(event.target.value) }))
                }
              />
            </label>

            <label className="rateSliderCard">
              <div className="rateSliderHead">
                <span className="rateSliderLabel">Динамика / трек-лист</span>
                <span className="rateSliderValue">{scores.setlist}</span>
              </div>
              <input
                className="rateSliderInput"
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores.setlist}
                onChange={(event) =>
                  setScores((prev) => ({ ...prev, setlist: Number(event.target.value) }))
                }
              />
            </label>

            <label className="rateSliderCard">
              <div className="rateSliderHead">
                <span className="rateSliderLabel">Харизма</span>
                <span className="rateSliderValue">{scores.crowd}</span>
              </div>
              <input
                className="rateSliderInput"
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores.crowd}
                onChange={(event) => setScores((prev) => ({ ...prev, crowd: Number(event.target.value) }))}
              />
            </label>

            <label className="rateSliderCard">
              <div className="rateSliderHead">
                <span className="rateSliderLabel">Звук</span>
                <span className="rateSliderValue">{scores.sound}</span>
              </div>
              <input
                className="rateSliderInput"
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores.sound}
                onChange={(event) => setScores((prev) => ({ ...prev, sound: Number(event.target.value) }))}
              />
            </label>
          </div>

          <div className="rateScoreBottom">
            <label className="rateVibeRow">
              <div className="rateSliderHead rateVibeHead">
                <span className="rateVibeLabel">Вайб</span>
                <span className="rateVibeValue">{scores.vibe}</span>
              </div>
              <input
                className="rateSliderInput rateSliderInputWide"
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores.vibe}
                onChange={(event) => setScores((prev) => ({ ...prev, vibe: Number(event.target.value) }))}
              />
            </label>
          </div>
        </div>

        <label className="rateTextWrap">
          <span className="rateSliderLabel">Название рецензии</span>
          <input
            className="rateTitleInput"
            placeholder="Короткий заголовок вашей рецензии"
            value={reviewTitle}
            onChange={(event) => setReviewTitle(event.target.value)}
          />
        </label>

        <label className="rateTextWrap">
          <span className="rateSliderLabel">Текст рецензии</span>
          <textarea
            className="rateTextarea"
            placeholder="Текст рецензии (от 300 до 8500 символов)"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        <div className="rateUtilityRow">
          <button
            type="button"
            className="rateUtilityBtn"
            onClick={clearDraft}
          >
            Очистить черновик
          </button>
          <button 
            type="button" 
            className="rateUtilityBtn secondary"
            onClick={() => setIsCriteriaOpen(true)}
          >
            Критерии 90-балльной системы оценивания
          </button>
          <div className="rateUtilityRight">
            <button type="button" className="rateMediaBtn" onClick={() => setIsMediaModalOpen(true)}>
              📎 Прикрепить медиа{attachedMedia.length > 0 ? ` (${attachedMedia.length})` : ''}
            </button>
            <p className="rateCharCount">{text.length}/8500</p>
          </div>
        </div>

        <div className="rateActions">
          <div className="rateSubmitMeta">
            <p className="rateOverallValue">{overallRounded}</p>
            <p className="rateOverallLimit">/90</p>
          </div>

          <button type="button" className="rateSubmitButton" aria-label="Отправить рецензию">
            ✓
          </button>
        </div>
      </section>

      <section className="rateReviewsSection">
        <div className="rateReviewsHeader" aria-label="Блок рецензий">
          <h3 className="rateSectionTitle">Написанные рецензии</h3>
          <span className="rateReviewsCountBadge" aria-label={`Всего рецензий: ${concertReviews.length}`}>
            {concertReviews.length}
          </span>
        </div>

        {concertReviews.length > 0 ? (
          <>
            <div className="rateReviewList">
              {pagedConcertReviews.map((review) => (
                <div key={review.id} className="rateReviewItem">
                  <ReviewCard review={review} textMode="expanded" />
                </div>
              ))}
            </div>

            {rateReviewsPageCount > 1 && (
              <div className="pagination" role="navigation" aria-label="Пагинация рецензий концерта">
                {rateReviewsPaginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="paginationEllipsis" aria-hidden="true">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={item === reviewsPage ? 'settingsBtn primary' : 'settingsBtn ghost'}
                      onClick={() => {
                        setReviewsPage(item)
                        scrollToTop()
                      }}
                      aria-current={item === reviewsPage ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        ) : (
          <div className="placeholder">Пока нет опубликованных рецензий по этому концерту</div>
        )}
      </section>

      {isCriteriaOpen && (
        <div className="rateModalOverlay" onClick={() => setIsCriteriaOpen(false)}>
          <div className="rateModalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="rateModalTitle">Система оценивания</h3>
            <div className="rateModalBody">
              <p>Оценка состоит из 4-х объективных параметров (каждый от 1 до 10):</p>
              <ul>
                <li><strong>Исполнение:</strong> качество музыкального исполнения, вокал.</li>
                <li><strong>Динамика / трек-лист:</strong> структура концерта, баланс хитов и нового.</li>
                <li><strong>Харизма:</strong> подача и энергия артиста, работа со зрителем.</li>
                <li><strong>Звук:</strong> качество звучания в зале и работа звукорежиссуры.</li>
              </ul>
              <hr />
              <p>
                <strong>Субъективный параметр (Вайб)</strong> — это всё, что не попало в четыре пункта выше: «изюминка»
                концерта (перформансы, визуал, сюрпризы) или то, что может испортить впечатление (форс-мажоры,
                задержки, происшествия). Оценивается от 1 до 10 и рассчитывается как множитель (от 1.0 до 1.6072).
              </p>
              <div className="rateFormulaBox">
                Сумма_объективных × 1.4 × Вайб = Итог (макс. 90)
              </div>
            </div>
            <div className="rateModalActions">
              <button 
                type="button" 
                className="rateSubmitButton" 
                onClick={() => setIsCriteriaOpen(false)}
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmClearOpen && (
        <div className="rateModalOverlay" onClick={() => setIsConfirmClearOpen(false)}>
          <div className="rateModalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="rateModalTitle">Удалить черновик?</h3>
            <div className="rateModalBody">
              <p>Черновик рецензии будет удален без возможности восстановления.</p>
            </div>
            <div className="rateModalActions rateModalActionsEnd">
              <button
                type="button"
                className="rateModalBtn"
                onClick={() => setIsConfirmClearOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="rateModalBtn rateModalBtnDanger"
                onClick={confirmClearDraft}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {isMediaModalOpen && (
        <div className="rateModalOverlay" onClick={() => setIsMediaModalOpen(false)}>
          <div className="rateModalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="rateModalTitle">Прикрепление медиа</h3>
            <div className="rateModalBody">
              <label className="rateMediaPicker">
                <span>Выберите фото или видео</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaSelect}
                />
              </label>

              {attachedMedia.length > 0 ? (
                <div className="rateMediaList">
                  {attachedMedia.map((file, index) => (
                    <div key={`${file.name}_${file.size}_${index}`} className="rateMediaItem">
                      <div className="rateMediaFileInfo">
                        <p className="rateMediaFileName">{file.name}</p>
                        <p className="rateMediaFileMeta">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        className="rateMediaRemoveBtn"
                        onClick={() => removeAttachedMedia(index)}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rateMediaEmpty">Файлы пока не выбраны.</p>
              )}
            </div>
            <div className="rateModalActions rateModalActionsEnd">
              <button
                type="button"
                className="rateModalBtn"
                onClick={() => setAttachedMedia([])}
              >
                Очистить список
              </button>
              <button
                type="button"
                className="rateModalBtn"
                onClick={() => setIsMediaModalOpen(false)}
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {isDraftToastVisible && <div className="rateDraftToast">Черновик сохранен</div>}
    </section>
  )
}

