import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArtistCard } from '../components/artists/ArtistCard'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { RatingBreakdownBadge } from '../components/ratings/RatingBreakdownBadge'
import { FilterIcon, SearchIcon } from '../components/common/ControlIcons'
import { addFavorite, getFavoritesRevision, loadUserFavorites, removeFavorite, getArtistById, loadArtistCardsPage, loadConcerts, loadReviews } from '../api/repository'
import { computeAvgScoresFromReviews } from '../utils/reviewAverages'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import { getConcertIdKey } from '../types/concert'
import { getReviewConcertIdKey } from '../types/review'
import { useQuery } from '../utils/useQuery'
import { useAuthStore } from '../store/useAuthStore'
import { ErrorState } from '../components/ui/ErrorState'
import { DetailSkeleton, SkeletonGrid } from '../components/ui/Skeletons'

type SortDirection = 'desc' | 'asc'
type ArtistSortBy = 'rating' | 'alphabet'
type ArtistReviewsFilter = 'all' | 'with_reviews' | 'without_reviews'
const ARTISTS_PAGE_SIZE = 10
const ARTIST_SORT_QUERY: Record<ArtistSortBy, string> = {
  rating: 'rating',
  alphabet: 'name',
}

type ArtistSocialKind = 'vk' | 'telegram' | 'youtube' | 'website'

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
    { kind: 'website', label: 'Сайт', keys: ['website', 'site', 'url'] },
  ]

  return candidates
    .map((candidate) => {
      const raw = candidate.keys.map((key) => socialLinks[key]).find(Boolean)
      const href = normalizeSocialUrl(raw)
      return href ? { ...candidate, href } : null
    })
    .filter((item): item is { kind: ArtistSocialKind; label: string; keys: string[]; href: string } => Boolean(item))
}

function getEntityIdKey(entity: { id?: string | number; artist_id?: string | number } | null | undefined): string {
  if (!entity) return ''
  return entity.artist_id !== undefined && entity.artist_id !== null ? String(entity.artist_id) : String(entity.id ?? '')
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

  if (kind === 'website') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm6.8 8.8h-3.1a15.3 15.3 0 0 0-1.2-5 7.7 7.7 0 0 1 4.3 5Zm-6.8-6.6c.7 1 1.4 3.2 1.6 6.6h-3.2c.2-3.4.9-5.6 1.6-6.6ZM4.4 13h3.8c.1 1.8.4 3.5.9 4.9A7.8 7.8 0 0 1 4.4 13Zm3.8-2H4.4A7.8 7.8 0 0 1 9.1 6c-.5 1.4-.8 3.1-.9 5Zm3.8 8.6c-.7-1-1.4-3.2-1.6-6.6h3.2c-.2 3.4-.9 5.6-1.6 6.6Zm2.5-1.7c.5-1.4.8-3.1.9-4.9h3.8a7.8 7.8 0 0 1-4.7 4.9Z" />
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
  const [searchDraft, setSearchDraft] = useState('')
  const [reviewsFilter, setReviewsFilter] = useState<ArtistReviewsFilter>('all')
  const [sortBy, setSortBy] = useState<ArtistSortBy>('rating')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [reviewsFilterDraft, setReviewsFilterDraft] = useState<ArtistReviewsFilter>('all')
  const [sortByDraft, setSortByDraft] = useState<ArtistSortBy>('rating')
  const [sortDirectionDraft, setSortDirectionDraft] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [isFavoriteBusy, setIsFavoriteBusy] = useState(false)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const authUser = useAuthStore((state) => state.user)
  const isAuth = useAuthStore((state) => state.isAuth)

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
  const artistIdParam = searchParams.get('artistId')?.trim() ?? ''
  const selectedArtistFromList = artistIdParam
    ? artists.find((item) => getEntityIdKey(item) === artistIdParam) ?? null
    : null
  const selectedArtistQuery = useQuery(
    ['artists', 'detail', artistIdParam],
    () => getArtistById(artistIdParam),
    { enabled: Boolean(artistIdParam && !selectedArtistFromList) },
  )
  const selectedArtist = selectedArtistFromList ?? selectedArtistQuery.data ?? null
  const selectedArtistIdKey = getEntityIdKey(selectedArtist)
  const shouldLoadArtistDetails = Boolean(artistIdParam && selectedArtist)
  const favoritesUsername = useMemo(() => {
    const raw = authUser?.username ?? ''
    return raw.trim().replace(/^@+/, '').toLowerCase()
  }, [authUser?.username])
  const favoritesRevision = getFavoritesRevision()
  const favoritesQuery = useQuery(
    ['favorites', 'artist', favoritesUsername, favoritesRevision],
    () => loadUserFavorites(favoritesUsername, { type: 'artist' }),
    { enabled: Boolean(isAuth && favoritesUsername) },
  )

  const concertsQuery = useQuery(
    ['artists', 'concerts', selectedArtistIdKey || 'list'],
    () => loadConcerts({ limit: 20, offset: 0 }).then((res) => res.items),
    { enabled: shouldLoadArtistDetails },
  )
  const reviewsQuery = useQuery(
    ['artists', 'reviews', selectedArtistIdKey || 'list'],
    () => loadReviews({ limit: 20, offset: 0, sort: 'created_at', direction: 'DESC' }).then((res) => res.items),
    { enabled: shouldLoadArtistDetails },
  )
  const concerts = concertsQuery.data ?? []
  const reviews = reviewsQuery.data ?? []

  useEffect(() => {
    if (!selectedArtistIdKey || !isAuth || !favoritesUsername) {
      setIsFavorite(false)
      return
    }
    const favorites = favoritesQuery.data ?? []
    setIsFavorite(favorites.some((item) => item.target_id === selectedArtistIdKey))
  }, [favoritesQuery.data, favoritesUsername, isAuth, selectedArtistIdKey])

  useEffect(() => {
    setFavoriteError(null)
  }, [selectedArtistIdKey])

  useEffect(() => {
    if (!selectedArtist) {
      setFavoriteCount(0)
      return
    }

    const cardFavoritesCount = 'favorites_count' in selectedArtist ? selectedArtist.favorites_count : undefined
    const statsFavoritesCount = 'stats' in selectedArtist ? selectedArtist.stats?.favorites_count : undefined
    setFavoriteCount(cardFavoritesCount ?? statsFavoritesCount ?? 0)
  }, [selectedArtist])

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

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(searchDraft)
    setCurrentPage(1)
  }

  const openFilters = () => {
    setReviewsFilterDraft(reviewsFilter)
    setSortByDraft(sortBy)
    setSortDirectionDraft(sortDirection)
    setIsFiltersOpen(true)
  }

  const applyFilters = () => {
    setSearch(searchDraft)
    setReviewsFilter(reviewsFilterDraft)
    setSortBy(sortByDraft)
    setSortDirection(sortDirectionDraft)
    setCurrentPage(1)
    setIsFiltersOpen(false)
  }

  const resetFilterDrafts = () => {
    setSearchDraft('')
    setReviewsFilterDraft('all')
    setSortByDraft('rating')
    setSortDirectionDraft('desc')
  }

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  const handleFavoriteToggle = async () => {
    if (!selectedArtistIdKey) return
    if (!isAuth || !favoritesUsername) {
      setFavoriteError('Нужно войти, чтобы добавить в избранное.')
      return
    }
    if (isFavoriteBusy) return

    setIsFavoriteBusy(true)
    setFavoriteError(null)

    try {
      if (isFavorite) {
        await removeFavorite('artist', selectedArtistIdKey)
        setIsFavorite(false)
        setFavoriteCount((prev) => Math.max(0, prev - 1))
      } else {
        await addFavorite('artist', selectedArtistIdKey)
        setIsFavorite(true)
        setFavoriteCount((prev) => prev + 1)
      }
      await favoritesQuery.refetch()
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : 'Не удалось обновить избранное.')
    } finally {
      setIsFavoriteBusy(false)
    }
  }

  if (
    (!artistIdParam && artistsQuery.isLoading) ||
    (artistIdParam && !selectedArtist && selectedArtistQuery.isLoading) ||
    (shouldLoadArtistDetails && (concertsQuery.isLoading || reviewsQuery.isLoading))
  ) {
    return artistIdParam
      ? <DetailSkeleton title="Артист" media="square" />
      : <SkeletonGrid title="Артисты" variant="artist" count={8} />
  }

  const pageError = artistIdParam
    ? selectedArtistQuery.error ?? (shouldLoadArtistDetails ? concertsQuery.error ?? reviewsQuery.error : null)
    : artistsQuery.error
  if (pageError) {
    return (
      <section className="page errorPage">
        <ErrorState
          title="Не получилось загрузить артистов"
          text={pageError}
          actions={[
            {
              label: 'Повторить',
              onClick: () => {
                void artistsQuery.refetch()
                void selectedArtistQuery.refetch()
                void concertsQuery.refetch()
                void reviewsQuery.refetch()
              },
              variant: 'primary',
            },
            { label: 'На главную', to: '/home', variant: 'ghost' },
          ]}
        />
      </section>
    )
  }

  if (selectedArtist) {
    const artistConcerts = concerts
      .filter((concert) => concert.artists.some((artist) => getEntityIdKey(artist) === selectedArtistIdKey))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const artistConcertIds = new Set(artistConcerts.map((concert) => getConcertIdKey(concert)))
    const artistReviews = reviews
      .filter((review) => artistConcertIds.has(getReviewConcertIdKey(review)))
      .sort((a, b) => b.id - a.id)
    const selectedArtistRating = 'avg_rating_total' in selectedArtist
      ? selectedArtist.avg_rating_total
      : selectedArtist.stats?.reviews_count
        ? selectedArtist.stats.sum_rating_total / selectedArtist.stats.reviews_count
        : null
    const roundedScore = Number.isFinite(selectedArtistRating) ? Math.round(selectedArtistRating as number) : null
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

        <article className="detailHero artistDetailHero">
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
                onClick={() => void handleFavoriteToggle()}
                disabled={isFavoriteBusy}
                aria-label="В избранное"
                title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                <span className="favoriteBtnMark" aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
                {favoriteCount > 0 && <span className="favoriteBtnCount">{favoriteCount}</span>}
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
            {favoriteError && <p className="reviewLikeError">{favoriteError}</p>}
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
                        { label: 'Звук/Визуал', value: artistAvgScores.sound },
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
          <form className="concertSearchGroup" onSubmit={submitSearch} role="search">
            <input
              className="concertSearch"
              type="search"
              placeholder="Поиск по артисту"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            <button type="submit" className="settingsBtn primary searchSubmitBtn" aria-label="Искать" title="Искать">
              <SearchIcon />
            </button>
          </form>

          <button
            type="button"
            className="settingsBtn ghost filterOpenBtn"
            onClick={openFilters}
            aria-label="Фильтры"
            title="Фильтры"
          >
            <FilterIcon />
          </button>
        </div>

      </div>

      {isFiltersOpen && (
        <div className="filtersModalBackdrop" role="presentation" onClick={() => setIsFiltersOpen(false)}>
          <div className="filtersModal" role="dialog" aria-modal="true" aria-label="Фильтры артистов" onClick={(e) => e.stopPropagation()}>
            <div className="filtersModalHeader">
              <h2 className="filtersModalTitle">Фильтры</h2>
              <button type="button" className="settingsBtn ghost" onClick={() => setIsFiltersOpen(false)}>Закрыть</button>
            </div>
            <div className="filtersModalGrid">
              <label className="filtersField">
                <span>Рецензии</span>
                <select className="concertSelect" value={reviewsFilterDraft} onChange={(e) => setReviewsFilterDraft(e.target.value as ArtistReviewsFilter)}>
                  <option value="all">Любые</option>
                  <option value="with_reviews">Есть рецензии</option>
                  <option value="without_reviews">Нет рецензий</option>
                </select>
              </label>
              <label className="filtersField">
                <span>Сортировка</span>
                <select className="concertSelect" value={sortByDraft} onChange={(e) => setSortByDraft(e.target.value as ArtistSortBy)}>
                  <option value="rating">Оценка</option>
                  <option value="alphabet">Алфавит</option>
                </select>
              </label>
              <label className="filtersField">
                <span>Направление</span>
                <button type="button" className="settingsBtn ghost" onClick={() => setSortDirectionDraft((prev) => (prev === 'desc' ? 'asc' : 'desc'))}>
                  {sortDirectionDraft === 'desc' ? 'По убыванию' : 'По возрастанию'}
                </button>
              </label>
            </div>
            <div className="filtersModalActions">
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={resetFilterDrafts}
              >
                Сбросить фильтры
              </button>
              <button type="button" className="settingsBtn primary" onClick={applyFilters}>Готово</button>
            </div>
          </div>
        </div>
      )}

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

