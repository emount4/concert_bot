import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArtistCard } from '../components/artists/ArtistCard'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { RatingBreakdownBadge } from '../components/ratings/RatingBreakdownBadge'
import { loadArtistCardsPage, loadConcerts, loadReviews } from '../api/repository'
import { computeAvgScoresFromReviews } from '../utils/reviewAverages'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import { getConcertIdKey } from '../types/concert'
import { getReviewConcertIdKey } from '../types/review'
import { useQuery } from '../utils/useQuery'

type SortDirection = 'desc' | 'asc'
type ArtistSortBy = 'rating' | 'alphabet'
type ArtistReviewsFilter = 'all' | 'with_reviews' | 'without_reviews'
const ARTISTS_PAGE_SIZE = 12
const ARTIST_SORT_QUERY: Record<ArtistSortBy, string> = {
  rating: 'rating',
  alphabet: 'name',
}

type ArtistSocialKind = 'vk' | 'telegram' | 'youtube'

function normalizeSocialUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('@')) return `https://t.me/${encodeURIComponent(trimmed.slice(1))}`
  return `https://${trimmed.replace(/^\/+/, '')}`
}

function getArtistSocialLinks(socialLinks: Record<string, string | null | undefined> | null | undefined) {
  if (!socialLinks) return []

  const candidates: Array<{ kind: ArtistSocialKind; label: string; keys: string[] }> = [
    { kind: 'vk', label: 'VK', keys: ['vk', 'vkontakte'] },
    { kind: 'telegram', label: 'Telegram', keys: ['telegram', 'tg'] },
    { kind: 'youtube', label: 'YouTube', keys: ['youtube', 'yt'] },
  ]

  return candidates
    .map((candidate) => {
      const raw = candidate.keys.map((key) => socialLinks[key]).find(Boolean)
      const href = normalizeSocialUrl(raw)
      return href ? { ...candidate, href } : null
    })
    .filter((item): item is { kind: ArtistSocialKind; label: string; keys: string[]; href: string } => Boolean(item))
}

function SocialIcon({ kind }: { kind: ArtistSocialKind }) {
  if (kind === 'vk') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 7.3c.1 5.8 3 9.4 8.2 9.4h.3v-3.3c1.9.2 3.3 1.6 3.9 3.3h3.1c-.8-2.5-2.9-4-4.2-4.6 1.3-.8 3.1-2.6 3.5-4.8h-2.8c-.5 1.8-2 3.6-3.5 3.8V7.3H9.1v6.6c-1.6-.4-3.6-2.3-3.7-6.6H3.5Z" />
      </svg>
    )
  }

  if (kind === 'telegram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.6 4.6 3.9 11.1c-1.1.4-1.1 1.1-.2 1.4l4.3 1.3 1.7 5.2c.2.6.3.8.7.8s.6-.2.9-.5l2.1-2 4.4 3.2c.8.4 1.3.2 1.5-.7l2.8-13.3c.3-1.1-.4-1.6-1.5-1.1Zm-11.9 8.8 9.4-5.9c.5-.3.9-.1.5.2l-7.6 6.9-.3 3.1-1.9-4.3Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.4 7.1a2.6 2.6 0 0 0-1.8-1.8C18 4.9 12 4.9 12 4.9s-6 0-7.6.4a2.6 2.6 0 0 0-1.8 1.8 27.1 27.1 0 0 0-.4 4.9s0 3.2.4 4.9a2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.6.4 7.6.4s6 0 7.6-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.7.4-4.9.4-4.9s0-3.2-.4-4.9ZM10 15.1V8.9l5.2 3.1-5.2 3.1Z" />
    </svg>
  )
}

export function ArtistsPage() {
  // Задание 12.2: поиск, фильтрация и сортировка списка артистов как в концертах.
  const [search, setSearch] = useState('')
  const [reviewsFilter, setReviewsFilter] = useState<ArtistReviewsFilter>('all')
  const [sortBy, setSortBy] = useState<ArtistSortBy>('rating')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  const artistsQuery = useQuery(
    ['artists', 'cards', currentPage, sortBy, sortDirection, search, reviewsFilter],
    () =>
      loadArtistCardsPage({
        limit: ARTISTS_PAGE_SIZE,
        offset: (currentPage - 1) * ARTISTS_PAGE_SIZE,
        sort: ARTIST_SORT_QUERY[sortBy],
        direction: sortDirection.toUpperCase(),
        search: search.trim() || undefined,
        reviews_filter: reviewsFilter === 'all' ? undefined : reviewsFilter,
      }),
  )
  const artists = artistsQuery.data?.items ?? []

  const [searchParams] = useSearchParams()
  const artistId = Number(searchParams.get('artistId'))
  const selectedArtist = Number.isFinite(artistId)
    ? artists.find((item) => item.id === artistId) ?? null
    : null
  const shouldLoadArtistDetails = Boolean(selectedArtist)

  const concertsQuery = useQuery(
    ['artists', 'concerts', selectedArtist?.id ?? 'list'],
    () => loadConcerts({ limit: 20, offset: 0 }).then((res) => res.items),
    { enabled: shouldLoadArtistDetails },
  )
  const reviewsQuery = useQuery(
    ['artists', 'reviews', selectedArtist?.id ?? 'list'],
    () => loadReviews({ limit: 20, offset: 0, sort: 'created_at', direction: 'DESC' }).then((res) => res.items),
    { enabled: shouldLoadArtistDetails },
  )
  const concerts = concertsQuery.data ?? []
  const reviews = reviewsQuery.data ?? []

  useEffect(() => {
    setIsFavorite(false)
  }, [selectedArtist?.id])

  const artistStats = useMemo(() => {
    const out = new Map<number, { concertsCount: number; reviews_count: number }>()
    for (const artist of artists) {
      out.set(artist.id, {
        concertsCount: artist.concerts_count ?? 0,
        reviews_count: artist.reviews_count ?? 0,
      })
    }

    return out
  }, [artists])

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

    return filtered
  }, [artistStats, reviewsFilter, search])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, reviewsFilter, sortBy, sortDirection])

  const pageCount = artistsQuery.data?.page_count ?? 0
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, pageCount), [currentPage, pageCount])

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  if (artistsQuery.isLoading || (shouldLoadArtistDetails && (concertsQuery.isLoading || reviewsQuery.isLoading))) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  const pageError = artistsQuery.error ?? (shouldLoadArtistDetails ? concertsQuery.error ?? reviewsQuery.error : null)
  if (pageError) {
    return <section className="page"><div className="placeholder">{pageError}</div></section>
  }

  if (selectedArtist) {
    const artistConcerts = concerts
      .filter((concert) => concert.artists.some((artist) => artist.id === selectedArtist.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const artistConcertIds = new Set(artistConcerts.map((concert) => getConcertIdKey(concert)))
    const artistReviews = reviews
      .filter((review) => artistConcertIds.has(getReviewConcertIdKey(review)))
      .sort((a, b) => b.id - a.id)
    const roundedScore =
      Number.isFinite(selectedArtist.avg_rating_total) ? Math.round(selectedArtist.avg_rating_total as number) : null
    const socialLinks = getArtistSocialLinks(selectedArtist.social_links)
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
            <div className="artistPhotoMedia">
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
            {selectedArtist.photo_url && (
              <p className="photoSource">Источник фото: соцсети артиста «{selectedArtist.name}»</p>
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
            {socialLinks.length > 0 && (
              <div className="artistSocialLinks" aria-label="Социальные сети артиста">
                {socialLinks.map((link) => (
                  <a
                    key={link.kind}
                    href={link.href}
                    className={`artistSocialBtn artistSocialBtn-${link.kind}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    title={link.label}
                  >
                    <SocialIcon kind={link.kind} />
                  </a>
                ))}
              </div>
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
            {filteredArtists.map((artist) => (
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

