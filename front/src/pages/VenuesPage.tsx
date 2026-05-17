import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { VenueCard } from '../components/venues/VenueCard'
import { RatingBreakdownBadge } from '../components/ratings/RatingBreakdownBadge'
import { DATA_SOURCE_MODE } from '../api/config'
import { loadConcerts, loadReviews, loadVenueById, loadCities, loadVenuesList } from '../api/repository'
import { mapVenueResponseToCardItem } from '../types/venue'
import { computeAvgScoresFromReviews } from '../utils/reviewAverages'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import { getConcertIdKey } from '../types/concert'
import { getReviewConcertIdKey } from '../types/review'
import type { City } from '../types/city'
import type { VenueCardItem } from '../types/venue'
import { useQuery } from '../utils/useQuery'

type VenueSortBy = 'capacity' | 'rating' | 'alphabet'
type SortDirection = 'desc' | 'asc'
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
  const [cityFilter, setCityFilter] = useState('all')
  const [capacityFrom, setCapacityFrom] = useState('')
  const [capacityTo, setCapacityTo] = useState('')
  const [sortBy, setSortBy] = useState<VenueSortBy>('rating')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [detailVenue, setDetailVenue] = useState<VenueCardItem | null>(null)

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
    setIsFavorite(false)
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

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

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
                onClick={() => setIsFavorite((v) => !v)}
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
                        { label: 'Звук', value: venueAvgScores.sound },
                        { label: 'Вайб', value: venueAvgScores.vibe },
                      ]
                    : []
                }
              />
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
          <input
            className="concertSearch"
            type="search"
            placeholder="Поиск по площадке и городу"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="concertSelect"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">Все города</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <input
            className="concertSelect concertRangeInput"
            type="number"
            min={0}
            placeholder="Вместимость от"
            value={capacityFrom}
            onChange={(e) => setCapacityFrom(e.target.value)}
          />

          <input
            className="concertSelect concertRangeInput"
            type="number"
            min={0}
            placeholder="Вместимость до"
            value={capacityTo}
            onChange={(e) => setCapacityTo(e.target.value)}
          />

          <select
            className="concertSelect"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as VenueSortBy)}
          >
            <option value="capacity">Сортировка: вместимость</option>
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
              setCityFilter('all')
              setCapacityFrom('')
              setCapacityTo('')
              setSortBy('rating')
              setSortDirection('desc')
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

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

