import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { MOCK_CONCERTS } from '../data/mockConcerts'

type ConcertSort = 'date_desc' | 'date_asc' | 'rating_desc' | 'reviews_desc' | 'title_asc'

export function ConcertsPage() {
  // Задание 9.1: фильтрация и сортировка списка концертов на фронтенде.
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [onlyRated, setOnlyRated] = useState(false)
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [sort, setSort] = useState<ConcertSort>('date_asc')

  const availableCities = useMemo(() => {
    return Array.from(new Set(MOCK_CONCERTS.map((concert) => concert.venue.city))).sort((a, b) =>
      a.localeCompare(b, 'ru-RU'),
    )
  }, [])

  const filteredConcerts = useMemo(() => {
    const now = new Date()
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = MOCK_CONCERTS.filter((concert) => {
      if (cityFilter !== 'all' && concert.venue.city !== cityFilter) {
        return false
      }

      if (onlyRated && concert.stats.avgOverallScore === null) {
        return false
      }

      if (upcomingOnly) {
        const concertDate = new Date(concert.dateTime)
        if (Number.isNaN(concertDate.getTime()) || concertDate < now) {
          return false
        }
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        concert.title ?? '',
        concert.venue.name,
        concert.venue.city,
        ...concert.artists.map((artist) => artist.name),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })

    return filtered.sort((a, b) => {
      if (sort === 'date_desc') {
        return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      }

      if (sort === 'date_asc') {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      }

      if (sort === 'rating_desc') {
        return (b.stats.avgOverallScore ?? -1) - (a.stats.avgOverallScore ?? -1)
      }

      if (sort === 'reviews_desc') {
        return b.stats.reviewsCount - a.stats.reviewsCount
      }

      return (a.title ?? '').localeCompare(b.title ?? '', 'ru-RU')
    })
  }, [cityFilter, onlyRated, search, sort, upcomingOnly])

  return (
    <section className="page">
      <h1 className="pageTitle">Концерты</h1>

      <div className="concertControls">
        <div className="concertControlsRow">
          <input
            className="concertSearch"
            type="search"
            placeholder="Поиск по концерту, артисту или площадке"
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
            value={sort}
            onChange={(e) => setSort(e.target.value as ConcertSort)}
          >
            <option value="date_asc">Сначала ближайшие</option>
            <option value="date_desc">Сначала поздние</option>
            <option value="rating_desc">По оценке</option>
            <option value="reviews_desc">По числу рецензий</option>
            <option value="title_asc">По названию</option>
          </select>
        </div>

        <div className="concertControlsRow">

          <button
            type="button"
            className="settingsBtn ghost"
            onClick={() => {
              setSearch('')
              setCityFilter('all')
              setOnlyRated(false)
              setUpcomingOnly(false)
              setSort('date_asc')
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Задание 1: карточки концертов с пустым местом под афишу и рейтингом справа. */}
      {filteredConcerts.length > 0 ? (
        <div className="concertGrid">
          {filteredConcerts.map((concert) => (
            <Link key={concert.id} to={`/concerts/${concert.id}/rate`} className="concertCardLink">
              <ConcertCard concert={concert} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="placeholder">По выбранным фильтрам концертов не найдено</div>
      )}
    </section>
  )
}
