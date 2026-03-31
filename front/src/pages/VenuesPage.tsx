import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { MOCK_CONCERTS } from '../data/mockConcerts'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { VenueCard } from '../components/venues/VenueCard'
import { MOCK_VENUES } from '../data/mockVenues'

type VenueSort = 'rating_desc' | 'reviews_desc' | 'concerts_desc' | 'capacity_desc' | 'name_asc'
type VenueRatingFilter = 'all' | 'rated' | 'unrated'

function formatCapacity(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function VenuesPage() {
  // Задание 12.3: поиск, фильтрация и сортировка списка площадок как в концертах.
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState<VenueRatingFilter>('all')
  const [sort, setSort] = useState<VenueSort>('rating_desc')

  const [searchParams] = useSearchParams()
  const venueId = Number(searchParams.get('venueId'))
  const selectedVenue = Number.isFinite(venueId)
    ? MOCK_VENUES.find((item) => item.id === venueId) ?? null
    : null

  const venueStats = useMemo(() => {
    const reviewsByConcertId = new Map<number, number>()
    for (const review of MOCK_REVIEWS) {
      reviewsByConcertId.set(review.concertId, (reviewsByConcertId.get(review.concertId) ?? 0) + 1)
    }

    const out = new Map<number, { concertsCount: number; reviewsCount: number }>()
    for (const venue of MOCK_VENUES) {
      const concerts = MOCK_CONCERTS.filter(
        (concert) => concert.venue.name === venue.name && concert.venue.city === venue.city,
      )
      const reviewsCount = concerts.reduce(
        (sum, concert) => sum + (reviewsByConcertId.get(concert.id) ?? 0),
        0,
      )
      out.set(venue.id, { concertsCount: concerts.length, reviewsCount })
    }

    return out
  }, [])

  const availableCities = useMemo(() => {
    return Array.from(new Set(MOCK_VENUES.map((venue) => venue.city))).sort((a, b) =>
      a.localeCompare(b, 'ru-RU'),
    )
  }, [])

  const filteredVenues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = MOCK_VENUES.filter((venue) => {
      if (cityFilter !== 'all' && venue.city !== cityFilter) {
        return false
      }

      if (ratingFilter === 'rated' && venue.avgVenueScore === null) {
        return false
      }

      if (ratingFilter === 'unrated' && venue.avgVenueScore !== null) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = `${venue.name} ${venue.city}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })

    return filtered.sort((a, b) => {
      const aStats = venueStats.get(a.id) ?? { concertsCount: 0, reviewsCount: 0 }
      const bStats = venueStats.get(b.id) ?? { concertsCount: 0, reviewsCount: 0 }

      if (sort === 'rating_desc') {
        return (b.avgVenueScore ?? -1) - (a.avgVenueScore ?? -1)
      }

      if (sort === 'reviews_desc') {
        return bStats.reviewsCount - aStats.reviewsCount
      }

      if (sort === 'concerts_desc') {
        return bStats.concertsCount - aStats.concertsCount
      }

      if (sort === 'capacity_desc') {
        return b.capacity - a.capacity
      }

      return a.name.localeCompare(b.name, 'ru-RU')
    })
  }, [cityFilter, ratingFilter, search, sort, venueStats])

  if (selectedVenue) {
    const venueConcerts = MOCK_CONCERTS
      .filter(
        (concert) =>
          concert.venue.name === selectedVenue.name && concert.venue.city === selectedVenue.city,
      )
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    const venueConcertIds = new Set(venueConcerts.map((concert) => concert.id))
    const venueReviews = MOCK_REVIEWS
      .filter((review) => venueConcertIds.has(review.concertId))
      .sort((a, b) => b.id - a.id)
    const roundedScore =
      selectedVenue.avgVenueScore === null ? null : Math.round(selectedVenue.avgVenueScore)

    return (
      <section className="page">
        <div className="detailHeaderRow">
          <h1 className="pageTitle">Площадка</h1>
          <Link to="/venues" className="detailBackLink">
            Все площадки
          </Link>
        </div>

        <article className="detailHero">
          <div className="detailHeroMedia venuePhoto" aria-hidden="true" />
          <div className="detailHeroBody">
            <h2 className="detailHeroTitle">{selectedVenue.name}</h2>
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
            {roundedScore !== null && <div className="ratingCircle detailRatingCircle">{roundedScore}</div>}
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

          <select
            className="concertSelect"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as VenueRatingFilter)}
          >
            <option value="all">Все рейтинги</option>
            <option value="rated">Только с оценкой</option>
            <option value="unrated">Без оценки</option>
          </select>

          <select
            className="concertSelect"
            value={sort}
            onChange={(e) => setSort(e.target.value as VenueSort)}
          >
            <option value="rating_desc">По оценке</option>
            <option value="reviews_desc">По числу рецензий</option>
            <option value="concerts_desc">По числу концертов</option>
            <option value="capacity_desc">По вместимости</option>
            <option value="name_asc">По названию</option>
          </select>
        </div>

        <div className="concertControlsRow">
          <button
            type="button"
            className="settingsBtn ghost"
            onClick={() => {
              setSearch('')
              setCityFilter('all')
              setRatingFilter('all')
              setSort('rating_desc')
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Задание 4.4: карточки площадок с фото, мета-данными и рейтингом справа. */}
      {filteredVenues.length > 0 ? (
        <div className="venueGrid">
          {filteredVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : (
        <div className="placeholder">По выбранным фильтрам площадки не найдены</div>
      )}
    </section>
  )
}
