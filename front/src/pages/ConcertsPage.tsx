import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { useAppData } from '../api/AppDataProvider'

type ConcertSortBy = 'date' | 'rating' | 'reviews' | 'title'
type SortDirection = 'desc' | 'asc'

export function ConcertsPage() {
  // Задание 9.1: фильтрация и сортировка списка концертов на фронтенде.
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [onlyRated, setOnlyRated] = useState(false)
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  // Задание 12.4: единый контрол сортировки (поле + стрелка направления).
  const [sortBy, setSortBy] = useState<ConcertSortBy>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const { data, isLoading, error } = useAppData()
  const concerts = data?.concerts ?? []

  const availableCities = useMemo(() => {
    return Array.from(new Set(concerts.map((concert) => concert.venue.city))).sort((a, b) =>
      a.localeCompare(b, 'ru-RU'),
    )
  }, [concerts])

  const filteredConcerts = useMemo(() => {
    const now = new Date()
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = concerts.filter((concert) => {
      if (cityFilter !== 'all' && concert.venue.city !== cityFilter) {
        return false
      }

      if (onlyRated && concert.stats.avg_rating_total === null) {
        return false
      }

      if (upcomingOnly) {
        const concertDate = new Date(concert.date)
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
      let base = 0

      if (sortBy === 'date') {
        base = new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === 'rating') {
        base = (b.stats.avg_rating_total ?? -1) - (a.stats.avg_rating_total ?? -1)
      } else if (sortBy === 'reviews') {
        base = b.stats.reviews_count - a.stats.reviews_count
      } else {
        base = (b.title ?? '').localeCompare(a.title ?? '', 'ru-RU')
      }

      return sortDirection === 'desc' ? base : -base
    })
  }, [cityFilter, concerts, onlyRated, search, sortBy, sortDirection, upcomingOnly])

  if (isLoading) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (error) {
    return <section className="page"><div className="placeholder">{error}</div></section>
  }

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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ConcertSortBy)}
          >
            <option value="date">Сортировка: дата</option>
            <option value="rating">Сортировка: оценка</option>
            <option value="reviews">Сортировка: число рецензий</option>
            <option value="title">Сортировка: название</option>
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
              setOnlyRated(false)
              setUpcomingOnly(false)
              setSortBy('date')
              setSortDirection('asc')
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

