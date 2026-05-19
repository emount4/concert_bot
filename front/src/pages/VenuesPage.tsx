import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { VenueCard } from '../components/venues/VenueCard'
import { RatingBreakdownBadge } from '../components/ratings/RatingBreakdownBadge'
import { FilterIcon, SearchIcon } from '../components/common/ControlIcons'
import { DATA_SOURCE_MODE } from '../api/config'
import { addFavorite, getFavoritesRevision, loadUserFavorites, removeFavorite, loadConcerts, loadReviews, loadVenueById, loadCities, loadVenuesList } from '../api/repository'
import { mapVenueResponseToCardItem } from '../types/venue'
import { computeAvgScoresFromReviews } from '../utils/reviewAverages'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import { getConcertIdKey } from '../types/concert'
import { getReviewConcertIdKey } from '../types/review'
import type { City } from '../types/city'
import type { VenueCardItem } from '../types/venue'
import { useQuery } from '../utils/useQuery'
import { useAuthStore } from '../store/useAuthStore'

type VenueSortBy = 'capacity' | 'rating' | 'alphabet'
type SortDirection = 'desc' | 'asc'
type VenueSocialKind = 'vk' | 'telegram' | 'website'

function normalizeSocialUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('@')) return `https://t.me/${encodeURIComponent(trimmed.slice(1))}`
  return `https://${trimmed.replace(/^\/+/, '')}`
}

function getVenueSocialLinks(socialLinks: Record<string, string | null | undefined> | null | undefined) {
  if (!socialLinks) return []

  const candidates: Array<{ kind: VenueSocialKind; label: string; keys: string[] }> = [
    { kind: 'vk', label: 'VK', keys: ['vk', 'vkontakte'] },
    { kind: 'telegram', label: 'Telegram', keys: ['telegram', 'tg'] },
    { kind: 'website', label: 'Сайт', keys: ['website', 'site', 'url'] },
  ]

  return candidates
    .map((candidate) => {
      const raw = candidate.keys.map((key) => socialLinks[key]).find(Boolean)
      const href = normalizeSocialUrl(raw)
      return href ? { ...candidate, href } : null
    })
    .filter((item): item is { kind: VenueSocialKind; label: string; keys: string[]; href: string } => Boolean(item))
}

function VenueSocialIcon({ kind }: { kind: VenueSocialKind }) {
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
      <path d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm6.8 8.8h-3.1a15.3 15.3 0 0 0-1.2-5 7.7 7.7 0 0 1 4.3 5Zm-6.8-6.6c.7 1 1.4 3.2 1.6 6.6h-3.2c.2-3.4.9-5.6 1.6-6.6ZM4.4 13h3.8c.1 1.8.4 3.5.9 4.9A7.8 7.8 0 0 1 4.4 13Zm3.8-2H4.4A7.8 7.8 0 0 1 9.1 6c-.5 1.4-.8 3.1-.9 5Zm3.8 8.6c-.7-1-1.4-3.2-1.6-6.6h3.2c-.2 3.4-.9 5.6-1.6 6.6Zm2.5-1.7c.5-1.4.8-3.1.9-4.9h3.8a7.8 7.8 0 0 1-4.7 4.9Z" />
    </svg>
  )
}

const VENUES_PAGE_SIZE = 12
const VENUE_SORT_QUERY: Record<VenueSortBy, string> = {
  capacity: 'capacity',
  rating: 'rating',
  alphabet: 'name',
}

function formatCapacity(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function VenuesPage() {
  // Задание 12.3: поиск, фильтрация и сортировка списка площадок как в концертах.
  const [search, setSearch] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [capacityFrom, setCapacityFrom] = useState('')
  const [capacityTo, setCapacityTo] = useState('')
  const [sortBy, setSortBy] = useState<VenueSortBy>('rating')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [cityFilterDraft, setCityFilterDraft] = useState('all')
  const [capacityFromDraft, setCapacityFromDraft] = useState('')
  const [capacityToDraft, setCapacityToDraft] = useState('')
  const [sortByDraft, setSortByDraft] = useState<VenueSortBy>('rating')
  const [sortDirectionDraft, setSortDirectionDraft] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteBusy, setIsFavoriteBusy] = useState(false)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [detailVenue, setDetailVenue] = useState<VenueCardItem | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const authUser = useAuthStore((state) => state.user)
  const isAuth = useAuthStore((state) => state.isAuth)

  const selectedCityId = useMemo(() => {
    if (cityFilter === 'all') return undefined
    return cities.find((city) => city.name === cityFilter)?.city_id
  }, [cities, cityFilter])

  const venuesQuery = useQuery(['venues', 'cards', currentPage, sortBy, sortDirection, search, selectedCityId, capacityFrom, capacityTo], () => loadVenuesList({
    limit: VENUES_PAGE_SIZE,
    offset: (currentPage - 1) * VENUES_PAGE_SIZE,
    sort: VENUE_SORT_QUERY[sortBy],
    direction: sortDirection.toUpperCase() as 'ASC' | 'DESC',
    search: search.trim() || undefined,
    city_id: selectedCityId,
    capacity_from: capacityFrom ? Number(capacityFrom) : undefined,
    capacity_to: capacityTo ? Number(capacityTo) : undefined,
  }).then((res) => {
    const cityMap = new Map(cities.map((city) => [city.city_id, city.name]))
    return {
      ...res,
      items: res.items.map((venue) => mapVenueResponseToCardItem(venue, cityMap)),
    }
  }), { enabled: cities.length > 0 })
  const concertsQuery = useQuery(['venues', 'concerts'], () => loadConcerts({ limit: 20, offset: 0 }).then((res) => res.items))
  const reviewsQuery = useQuery(['venues', 'reviews'], () =>
    loadReviews({ limit: 20, offset: 0, sort: 'created_at', direction: 'DESC' }).then((res) => res.items),
  )
  const venues = venuesQuery.data?.items ?? []
  const concerts = concertsQuery.data ?? []
  const reviews = reviewsQuery.data ?? []

  const [searchParams] = useSearchParams()
  const venue_id = Number(searchParams.get('venue_id'))

  const selectedVenue = useMemo(() => {
    if (!Number.isFinite(venue_id) || venue_id <= 0) return null
    return venues.find((item) => item.id === venue_id) ?? detailVenue
  }, [venue_id, venues, detailVenue])
  const favoritesUsername = useMemo(() => {
    const raw = authUser?.username ?? ''
    return raw.trim().replace(/^@+/, '').toLowerCase()
  }, [authUser?.username])
  const favoritesRevision = getFavoritesRevision()
  const favoritesQuery = useQuery(
    ['favorites', 'venue', favoritesUsername, favoritesRevision],
    () => loadUserFavorites(favoritesUsername, { type: 'venue' }),
    { enabled: Boolean(isAuth && favoritesUsername) },
  )

  useEffect(() => {
    let cancelled = false
    if (!Number.isFinite(venue_id) || venue_id <= 0) {
      setDetailVenue(null)
      return
    }
    if (venues.some((v) => v.id === venue_id)) {
      setDetailVenue(null)
      return
    }
    if (DATA_SOURCE_MODE === 'mock') {
      setDetailVenue(null)
      return
    }
    void Promise.all([loadVenueById(venue_id), loadCities().catch(() => [] as City[])])
      .then(([venueRes, loadedCities]) => {
        if (cancelled) return
        const cityMap = new Map(loadedCities.map((c) => [c.city_id, c.name]))
        setDetailVenue(mapVenueResponseToCardItem(venueRes, cityMap))
      })
      .catch(() => {
        if (!cancelled) setDetailVenue(null)
      })
    return () => {
      cancelled = true
    }
  }, [venue_id, venues])

  useEffect(() => {
    if (!selectedVenue || !isAuth || !favoritesUsername) {
      setIsFavorite(false)
      return
    }
    const favorites = favoritesQuery.data ?? []
    const targetId = String(selectedVenue.id)
    setIsFavorite(favorites.some((item) => item.target_id === targetId))
  }, [favoritesQuery.data, favoritesUsername, isAuth, selectedVenue])

  useEffect(() => {
    setFavoriteError(null)
  }, [selectedVenue?.id])

  useEffect(() => {
    loadCities().then((loadedCities) => {
      setCities(loadedCities)
    }).catch((error) => {
      console.error('[VenuesPage] Failed to load cities:', error)
      setCities([])
    })
  }, [])

  const availableCities = useMemo(() => {
    if (cities.length > 0) {
      return cities.map((city) => city.name).sort((a, b) => a.localeCompare(b, 'ru-RU'))
    }
    // Fallback: if API cities not available, extract from venues
    return Array.from(new Set(venues.map((venue) => venue.city))).sort((a, b) =>
      a.localeCompare(b, 'ru-RU'),
    )
  }, [venues, cities])

  const filteredVenues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = venues.filter((venue) => {
      if (cityFilter !== 'all' && venue.city !== cityFilter) {
        return false
      }

      const fromValue = Number(capacityFrom)
      if (capacityFrom && !Number.isNaN(fromValue) && venue.capacity < fromValue) {
        return false
      }

      const toValue = Number(capacityTo)
      if (capacityTo && !Number.isNaN(toValue) && venue.capacity > toValue) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = `${venue.name} ${venue.city}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })

    return filtered
  }, [capacityFrom, capacityTo, cityFilter, search, venues])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, cityFilter, capacityFrom, capacityTo, sortBy, sortDirection])

  const pageCount = venuesQuery.data?.page_count ?? 0
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, pageCount), [currentPage, pageCount])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(searchDraft)
    setCurrentPage(1)
  }

  const openFilters = () => {
    setCityFilterDraft(cityFilter)
    setCapacityFromDraft(capacityFrom)
    setCapacityToDraft(capacityTo)
    setSortByDraft(sortBy)
    setSortDirectionDraft(sortDirection)
    setIsFiltersOpen(true)
  }

  const applyFilters = () => {
    setSearch(searchDraft)
    setCityFilter(cityFilterDraft)
    setCapacityFrom(capacityFromDraft)
    setCapacityTo(capacityToDraft)
    setSortBy(sortByDraft)
    setSortDirection(sortDirectionDraft)
    setCurrentPage(1)
    setIsFiltersOpen(false)
  }

  const resetFilterDrafts = () => {
    setSearchDraft('')
    setCityFilterDraft('all')
    setCapacityFromDraft('')
    setCapacityToDraft('')
    setSortByDraft('rating')
    setSortDirectionDraft('desc')
  }

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  const handleFavoriteToggle = async () => {
    if (!selectedVenue) return
    if (!isAuth || !favoritesUsername) {
      setFavoriteError('Нужно войти, чтобы добавить в избранное.')
      return
    }
    if (isFavoriteBusy) return

    const targetId = String(selectedVenue.id)
    setIsFavoriteBusy(true)
    setFavoriteError(null)

    try {
      if (isFavorite) {
        await removeFavorite('venue', targetId)
        setIsFavorite(false)
      } else {
        await addFavorite('venue', targetId)
        setIsFavorite(true)
      }
      await favoritesQuery.refetch()
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : 'Не удалось обновить избранное.')
    } finally {
      setIsFavoriteBusy(false)
    }
  }

  if (venuesQuery.isLoading || concertsQuery.isLoading || reviewsQuery.isLoading) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  const pageError = venuesQuery.error ?? concertsQuery.error ?? reviewsQuery.error
  if (pageError) {
    return <section className="page"><div className="placeholder">{pageError}</div></section>
  }

  if (selectedVenue) {
    const venueConcerts = concerts
      .filter(
        (concert) =>
          concert.venue.name === selectedVenue.name && concert.venue.city === selectedVenue.city,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const venueConcertIds = new Set(venueConcerts.map((concert) => getConcertIdKey(concert)))
    const venueReviews = reviews
      .filter((review) => venueConcertIds.has(getReviewConcertIdKey(review)))
      .sort((a, b) => b.id - a.id)
    const roundedScore =
      selectedVenue.avg_rating_total === null ? null : Math.round(selectedVenue.avg_rating_total)
    // Задание 13.4: раскладка средней оценки площадки по параметрам (до десятых).
    const venueAvgScores = computeAvgScoresFromReviews(venueReviews)
    const socialLinks = getVenueSocialLinks(selectedVenue.social_links)

    return (
      <section className="page">
        <div className="detailHeaderRow">
          <h1 className="pageTitle">Площадка</h1>
          <Link to="/venues" className="detailBackLink">
            Все площадки
          </Link>
        </div>

        <article className="detailHero venueDetailHero">
          {/* Задание 4.4: реальные изображения в карточке площадки (детальная шапка). */}
          <div className="detailHeroMedia venuePhoto" aria-hidden="true">
            <div className="venuePhotoMedia">
              {selectedVenue.photo_url && (
                <img
                  className="venuePhotoImg"
                  src={selectedVenue.photo_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            {selectedVenue.photo_url && (
              <p className="photoSource">Источник фото: соцсети площадки «{selectedVenue.name}»</p>
            )}
          </div>
          <div className="detailHeroBody">
            <div className="detailHeroTitleRow">
              <h2 className="detailHeroTitle">{selectedVenue.name}</h2>
              <button
                type="button"
                className={`rateHeroFavoriteBtn detailFavoriteBtn ${isFavorite ? 'active' : ''}`}
                onClick={() => void handleFavoriteToggle()}
                disabled={isFavoriteBusy}
                aria-label="В избранное"
                title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                {isFavorite ? '♥' : '♡'}
              </button>
            </div>
            <div className="detailStatsRow">
              <p className="detailStatItem">
                Город: <strong>{selectedVenue.city}</strong>
              </p>
              <p className="detailStatItem">
                Вместимость: <strong>{formatCapacity(selectedVenue.capacity)} чел</strong>
              </p>
              <p className="detailStatItem">
                Концертов: <strong>{venueConcerts.length}</strong>
              </p>
              <p className="detailStatItem">
                Рецензий: <strong>{venueReviews.length}</strong>
              </p>
            </div>
            {favoriteError && <p className="reviewLikeError">{favoriteError}</p>}
            {roundedScore !== null && (
              <RatingBreakdownBadge
                value={roundedScore}
                className="ratingCircle detailRatingCircle"
                ariaLabel="Средняя оценка площадки"
                breakdown={
                  venueAvgScores
                    ? [
                        { label: 'Исполнение', value: venueAvgScores.performance },
                        { label: 'Динамика / трек-лист', value: venueAvgScores.setlist },
                        { label: 'Харизма', value: venueAvgScores.crowd },
                        { label: 'Звук/Визуал', value: venueAvgScores.sound },
                        { label: 'Вайб', value: venueAvgScores.vibe },
                      ]
                    : []
                }
              />
            )}
            {socialLinks.length > 0 && (
              <div className="artistSocialLinks" aria-label="Социальные сети площадки">
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
                    <VenueSocialIcon kind={link.kind} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </article>

        <section className="detailSection">
          <h3 className="rateSectionTitle">Последние концерты</h3>
          {venueConcerts.length > 0 ? (
            <div className="detailConcertScroll" role="list">
              {venueConcerts.map((concert) => (
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
            <div className="placeholder">На этой площадке пока нет концертов</div>
          )}
        </section>

        <section className="detailSection">
          <h3 className="rateSectionTitle">Последние рецензии</h3>
          {venueReviews.length > 0 ? (
            <div className="detailReviewScroll" role="list">
              {venueReviews.map((review) => (
                <div key={review.id} className="detailReviewItem" role="listitem">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder">По этой площадке пока нет рецензий</div>
          )}
        </section>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Площадки</h1>

      <div className="concertControls">
        <div className="concertControlsRow">
          <form className="concertSearchGroup" onSubmit={submitSearch} role="search">
            <input
              className="concertSearch"
              type="search"
              placeholder="Поиск по площадке и городу"
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
          <div className="filtersModal" role="dialog" aria-modal="true" aria-label="Фильтры площадок" onClick={(e) => e.stopPropagation()}>
            <div className="filtersModalHeader">
              <h2 className="filtersModalTitle">Фильтры</h2>
              <button type="button" className="settingsBtn ghost" onClick={() => setIsFiltersOpen(false)}>Закрыть</button>
            </div>
            <div className="filtersModalGrid">
              <label className="filtersField">
                <span>Город</span>
                <select className="concertSelect" value={cityFilterDraft} onChange={(e) => setCityFilterDraft(e.target.value)}>
                  <option value="all">Все города</option>
                  {availableCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </label>
              <label className="filtersField">
                <span>Вместимость от</span>
                <input className="concertSelect concertRangeInput" type="number" min={0} value={capacityFromDraft} onChange={(e) => setCapacityFromDraft(e.target.value)} />
              </label>
              <label className="filtersField">
                <span>Вместимость до</span>
                <input className="concertSelect concertRangeInput" type="number" min={0} value={capacityToDraft} onChange={(e) => setCapacityToDraft(e.target.value)} />
              </label>
              <label className="filtersField">
                <span>Сортировка</span>
                <select className="concertSelect" value={sortByDraft} onChange={(e) => setSortByDraft(e.target.value as VenueSortBy)}>
                  <option value="capacity">Вместимость</option>
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

      {/* Задание 4.4: карточки площадок с фото, мета-данными и рейтингом справа. */}
      {filteredVenues.length > 0 ? (
        <>
          <div className="venueGrid">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="pagination" role="navigation" aria-label="Пагинация площадок">
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
        <div className="placeholder">По выбранным фильтрам площадки не найдены</div>
      )}
    </section>
  )
}

