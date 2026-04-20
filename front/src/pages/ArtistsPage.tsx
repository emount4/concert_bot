import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArtistCard } from '../components/artists/ArtistCard'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { RatingBreakdownBadge } from '../components/ratings/RatingBreakdownBadge'
import { useAppData } from '../api/AppDataProvider'
import { computeAvgScoresFromReviews } from '../utils/reviewAverages'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'

type SortDirection = 'desc' | 'asc'
type ArtistSortBy = 'rating' | 'alphabet'
type ArtistReviewsFilter = 'all' | 'with_reviews' | 'without_reviews'
const ARTISTS_PAGE_SIZE = 12

export function ArtistsPage() {
  // Задание 12.2: поиск, фильтрация и сортировка списка артистов как в концертах.
  const [search, setSearch] = useState('')
  const [reviewsFilter, setReviewsFilter] = useState<ArtistReviewsFilter>('all')
  const [sortBy, setSortBy] = useState<ArtistSortBy>('rating')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  const { data, isLoading, error } = useAppData()
  const artists = data?.artists ?? []
  const concerts = data?.concerts ?? []
  const reviews = data?.reviews ?? []

  const [searchParams] = useSearchParams()
  const artistId = Number(searchParams.get('artistId'))
  const selectedArtist = Number.isFinite(artistId)
    ? artists.find((item) => item.id === artistId) ?? null
    : null

  useEffect(() => {
    setIsFavorite(false)
  }, [selectedArtist?.id])

  const artistStats = useMemo(() => {
    const reviewsByConcertId = new Map<number, number>()
    for (const review of reviews) {
      reviewsByConcertId.set(review.concertId, (reviewsByConcertId.get(review.concertId) ?? 0) + 1)
    }

    const out = new Map<number, { concertsCount: number; reviews_count: number }>()
    for (const artist of artists) {
      const artistConcerts = concerts.filter((concert) =>
        concert.artists.some((concert_artist) => concert_artist.id === artist.id),
      )
      const reviews_count = artistConcerts.reduce(
        (sum, concert) => sum + (reviewsByConcertId.get(concert.id) ?? 0),
        0,
      )
      out.set(artist.id, { concertsCount: artistConcerts.length, reviews_count })
    }

    return out
  }, [artists, concerts, reviews])

  const filteredArtists = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = artists.filter((artist) => {
      const stats = artistStats.get(artist.id) ?? { concertsCount: 0, reviews_count: 0 }

      if (reviewsFilter === 'with_reviews' && stats.reviews_count === 0) {
        return false
      }

      if (reviewsFilter === 'without_reviews' && stats.reviews_count > 0) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return artist.name.toLowerCase().includes(normalizedSearch)
    })

    return filtered.sort((a, b) => {
      const base =
        sortBy === 'rating'
          ? (b.avg_rating_total ?? -1) - (a.avg_rating_total ?? -1)
          : b.name.localeCompare(a.name, 'ru-RU')
      return sortDirection === 'desc' ? base : -base
    })
  }, [artistStats, reviewsFilter, search, sortBy, sortDirection])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, reviewsFilter, sortBy, sortDirection])

  const pageCount = Math.ceil(filteredArtists.length / ARTISTS_PAGE_SIZE)
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, pageCount), [currentPage, pageCount])
  const pagedArtists = useMemo(() => {
    const start = (currentPage - 1) * ARTISTS_PAGE_SIZE
    return filteredArtists.slice(start, start + ARTISTS_PAGE_SIZE)
  }, [currentPage, filteredArtists])

  if (isLoading) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (error) {
    return <section className="page"><div className="placeholder">{error}</div></section>
  }

  if (selectedArtist) {
    const artistConcerts = concerts
      .filter((concert) => concert.artists.some((artist) => artist.id === selectedArtist.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const artistConcertIds = new Set(artistConcerts.map((concert) => concert.id))
    const artistReviews = reviews
      .filter((review) => artistConcertIds.has(review.concertId))
      .sort((a, b) => b.id - a.id)
    const roundedScore =
      selectedArtist.avg_rating_total === null ? null : Math.round(selectedArtist.avg_rating_total)
    // Задание 13.3: раскладка средней оценки артиста по параметрам (до десятых).
    const artistAvgScores = computeAvgScoresFromReviews(artistReviews)

    return (
      <section className="page">
        <div className="detailHeaderRow">
          <h1 className="pageTitle">Артист</h1>
          <Link to="/artists" className="detailBackLink">
            Все артисты
          </Link>
        </div>

        <article className="detailHero">
          {/* Задание 3.4: реальные изображения в карточке артиста (детальная шапка). */}
          <div className="detailHeroMedia artistPhoto" aria-hidden="true">
            {selectedArtist.photo_url && (
              <img
                className="artistPhotoImg"
                src={selectedArtist.photo_url}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="detailHeroBody">
            <div className="detailHeroTitleRow">
              <h2 className="detailHeroTitle">{selectedArtist.name}</h2>
              <button
                type="button"
                className={`rateHeroFavoriteBtn detailFavoriteBtn ${isFavorite ? 'active' : ''}`}
                onClick={() => setIsFavorite((v) => !v)}
                aria-label="В избранное"
                title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                {isFavorite ? '♥' : '♡'}
              </button>
            </div>
            <div className="detailStatsRow">
              <p className="detailStatItem">
                Концертов: <strong>{artistConcerts.length}</strong>
              </p>
              <p className="detailStatItem">
                Рецензий: <strong>{artistReviews.length}</strong>
              </p>
            </div>
            {roundedScore !== null && (
              <RatingBreakdownBadge
                value={roundedScore}
                className="ratingCircle detailRatingCircle"
                ariaLabel="Средняя оценка артиста"
                breakdown={
                  artistAvgScores
                    ? [
                        { label: 'Исполнение', value: artistAvgScores.performance },
                        { label: 'Динамика / трек-лист', value: artistAvgScores.setlist },
                        { label: 'Харизма', value: artistAvgScores.crowd },
                        { label: 'Звук', value: artistAvgScores.sound },
                        { label: 'Вайб', value: artistAvgScores.vibe },
                      ]
                    : []
                }
              />
            )}
          </div>
        </article>

        <section className="detailSection">
          <h3 className="rateSectionTitle">Последние концерты</h3>
          {artistConcerts.length > 0 ? (
            <div className="detailConcertScroll" role="list">
              {artistConcerts.map((concert) => (
                <Link
                  key={concert.id}
                  to={`/concerts/${concert.id}/rate`}
                  className="concertCardLink detailConcertItem"
                  role="listitem"
                >
                  <ConcertCard concert={concert} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="placeholder">У артиста пока нет концертов</div>
          )}
        </section>

        <section className="detailSection">
          <h3 className="rateSectionTitle">Последние рецензии</h3>
          {artistReviews.length > 0 ? (
            <div className="detailReviewScroll" role="list">
              {artistReviews.map((review) => (
                <div key={review.id} className="detailReviewItem" role="listitem">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder">По этому артисту пока нет рецензий</div>
          )}
        </section>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Артисты</h1>

      <div className="concertControls">
        <div className="concertControlsRow">
          <input
            className="concertSearch"
            type="search"
            placeholder="Поиск по артисту"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="concertSelect"
            value={reviewsFilter}
            onChange={(e) => setReviewsFilter(e.target.value as ArtistReviewsFilter)}
          >
            <option value="all">Рецензии: любые</option>
            <option value="with_reviews">Есть рецензии</option>
            <option value="without_reviews">Нет рецензий</option>
          </select>

          <select
            className="concertSelect"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ArtistSortBy)}
          >
            <option value="rating">Сортировка: оценка</option>
            <option value="alphabet">Сортировка: алфавит</option>
          </select>

          <button
            type="button"
            className="settingsBtn ghost sortDirectionBtn"
            onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            aria-label={
              sortDirection === 'desc'
                ? 'Сортировка по убыванию, нажмите для возрастания'
                : 'Сортировка по возрастанию, нажмите для убывания'
            }
            title={sortDirection === 'desc' ? 'По убыванию' : 'По возрастанию'}
          >
            {sortDirection === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        <div className="concertControlsRow">
          <button
            type="button"
            className="settingsBtn ghost"
            onClick={() => {
              setSearch('')
              setReviewsFilter('all')
              setSortBy('rating')
              setSortDirection('desc')
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Задание 3.4: карточки артистов с фото-заглушкой, ником и средней оценкой. */}
      {filteredArtists.length > 0 ? (
        <>
          <div className="artistGrid">
            {pagedArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="pagination" role="navigation" aria-label="Пагинация артистов">
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
        <div className="placeholder">По выбранным фильтрам артисты не найдены</div>
      )}
    </section>
  )
}

