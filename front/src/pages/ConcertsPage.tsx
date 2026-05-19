import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { FilterIcon, SearchIcon } from '../components/common/ControlIcons'
import { loadCities, loadConcerts } from '../api/repository'
import { buildPaginationItems } from '../utils/pagination'
import { scrollToTop } from '../utils/scrollToTop'
import type { City } from '../types/city'
import { useQuery } from '../utils/useQuery'

type ConcertSortBy = 'date' | 'rating' | 'reviews' | 'title'
type SortDirection = 'desc' | 'asc'
const CONCERTS_PAGE_SIZE = 12
const CONCERT_SORT_QUERY: Record<ConcertSortBy, string> = {
  date: 'date',
  rating: 'rating',
  reviews: 'reviews',
  title: 'title',
}

export function ConcertsPage() {
  // Задание 9.1: фильтрация и сортировка списка концертов на фронтенде.
  const [search, setSearch] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [onlyRated, setOnlyRated] = useState(false)
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [cityFilterDraft, setCityFilterDraft] = useState('all')
  const [onlyRatedDraft, setOnlyRatedDraft] = useState(false)
  const [upcomingOnlyDraft, setUpcomingOnlyDraft] = useState(false)
  // Задание 12.4: единый контрол сортировки (поле + стрелка направления).
  const [sortBy, setSortBy] = useState<ConcertSortBy>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [sortByDraft, setSortByDraft] = useState<ConcertSortBy>('date')
  const [sortDirectionDraft, setSortDirectionDraft] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [cities, setCities] = useState<City[]>([])

  const concertsQuery = useQuery(
    ['concerts', 'list', currentPage, sortBy, sortDirection, search, cityFilter, onlyRated, upcomingOnly],
    () =>
      loadConcerts({
        limit: CONCERTS_PAGE_SIZE,
        offset: (currentPage - 1) * CONCERTS_PAGE_SIZE,
        sort: CONCERT_SORT_QUERY[sortBy],
        direction: sortDirection.toUpperCase(),
        search: search.trim() || undefined,
        city: cityFilter === 'all' ? undefined : cityFilter,
        only_rated: onlyRated || undefined,
        upcoming_only: upcomingOnly || undefined,
      }),
  )
  const concerts = concertsQuery.data?.items ?? []

  useEffect(() => {
    loadCities().then((loadedCities) => {
      setCities(loadedCities)
    }).catch((error) => {
      console.error('[ConcertsPage] Failed to load cities:', error)
      setCities([])
    })
  }, [])

  const availableCities = useMemo(() => {
    if (cities.length > 0) {
      return cities.map((city) => city.name).sort((a, b) => a.localeCompare(b, 'ru-RU'))
    }
    // Fallback: if API cities not available, extract from concerts
    return Array.from(new Set(concerts.map((concert) => concert.venue.city))).sort((a, b) =>
      a.localeCompare(b, 'ru-RU'),
    )
  }, [concerts, cities])

  const visibleConcerts = useMemo(() => {
    const now = new Date()
    const normalizedSearch = search.trim().toLowerCase()

    return concerts.filter((concert) => {
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
  }, [cityFilter, concerts, onlyRated, search, upcomingOnly])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, cityFilter, onlyRated, upcomingOnly, sortBy, sortDirection])

  const pageCount = concertsQuery.data?.page_count ?? 0
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, pageCount), [currentPage, pageCount])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(searchDraft)
    setCurrentPage(1)
  }

  const openFilters = () => {
    setCityFilterDraft(cityFilter)
    setOnlyRatedDraft(onlyRated)
    setUpcomingOnlyDraft(upcomingOnly)
    setSortByDraft(sortBy)
    setSortDirectionDraft(sortDirection)
    setIsFiltersOpen(true)
  }

  const applyFilters = () => {
    setSearch(searchDraft)
    setCityFilter(cityFilterDraft)
    setOnlyRated(onlyRatedDraft)
    setUpcomingOnly(upcomingOnlyDraft)
    setSortBy(sortByDraft)
    setSortDirection(sortDirectionDraft)
    setCurrentPage(1)
    setIsFiltersOpen(false)
  }

  const resetFilterDrafts = () => {
    setSearchDraft('')
    setCityFilterDraft('all')
    setOnlyRatedDraft(false)
    setUpcomingOnlyDraft(false)
    setSortByDraft('date')
    setSortDirectionDraft('desc')
  }

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  if (concertsQuery.isLoading) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (concertsQuery.error) {
    return <section className="page"><div className="placeholder">{concertsQuery.error}</div></section>
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Концерты</h1>

      <div className="concertControls">
        <div className="concertControlsRow">
          <form className="concertSearchGroup" onSubmit={submitSearch} role="search">
            <input
              className="concertSearch"
              type="search"
              placeholder="Поиск по концерту, артисту или площадке"
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
          <div className="filtersModal" role="dialog" aria-modal="true" aria-label="Фильтры концертов" onClick={(e) => e.stopPropagation()}>
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
                <span>Сортировка</span>
                <select className="concertSelect" value={sortByDraft} onChange={(e) => setSortByDraft(e.target.value as ConcertSortBy)}>
                  <option value="date">Дата</option>
                  <option value="rating">Оценка</option>
                  <option value="reviews">Число рецензий</option>
                  <option value="title">Название</option>
                </select>
              </label>
              <label className="filtersField">
                <span>Направление</span>
                <button type="button" className="settingsBtn ghost" onClick={() => setSortDirectionDraft((prev) => (prev === 'desc' ? 'asc' : 'desc'))}>
                  {sortDirectionDraft === 'desc' ? 'По убыванию' : 'По возрастанию'}
                </button>
              </label>
              <label className="concertToggle filtersToggle">
                <input type="checkbox" checked={onlyRatedDraft} onChange={(e) => setOnlyRatedDraft(e.target.checked)} />
                Только с оценкой
              </label>
              <label className="concertToggle filtersToggle">
                <input type="checkbox" checked={upcomingOnlyDraft} onChange={(e) => setUpcomingOnlyDraft(e.target.checked)} />
                Будущие концерты
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

      {/* Задание 1: карточки концертов с пустым местом под афишу и рейтингом справа. */}
      {visibleConcerts.length > 0 ? (
        <>
          <div className="concertGrid">
            {visibleConcerts.map((concert) => (
              <Link key={concert.id} to={`/concerts/${concert.id}/rate`} className="concertCardLink">
                <ConcertCard concert={concert} />
              </Link>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="pagination" role="navigation" aria-label="Пагинация концертов">
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
        <div className="placeholder">По выбранным фильтрам концертов не найдено</div>
      )}
    </section>
  )
}

