import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArtistCard } from '../components/artists/ArtistCard'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { MOCK_ARTISTS } from '../data/mockArtists'
import { MOCK_CONCERTS } from '../data/mockConcerts'
import { MOCK_REVIEWS } from '../data/mockReviews'

type ArtistSort = 'rating_desc' | 'reviews_desc' | 'concerts_desc' | 'name_asc'
type ArtistRatingFilter = 'all' | 'rated' | 'unrated'
type ArtistActivityFilter = 'all' | 'with_concerts' | 'with_reviews'

export function ArtistsPage() {
  // Задание 12.2: поиск, фильтрация и сортировка списка артистов как в концертах.
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<ArtistRatingFilter>('all')
  const [activityFilter, setActivityFilter] = useState<ArtistActivityFilter>('all')
  const [sort, setSort] = useState<ArtistSort>('rating_desc')

  const [searchParams] = useSearchParams()
  const artistId = Number(searchParams.get('artistId'))
  const selectedArtist = Number.isFinite(artistId)
    ? MOCK_ARTISTS.find((item) => item.id === artistId) ?? null
    : null

  const artistStats = useMemo(() => {
    const reviewsByConcertId = new Map<number, number>()
    for (const review of MOCK_REVIEWS) {
      reviewsByConcertId.set(review.concertId, (reviewsByConcertId.get(review.concertId) ?? 0) + 1)
    }

    const out = new Map<number, { concertsCount: number; reviewsCount: number }>()
    for (const artist of MOCK_ARTISTS) {
      const concerts = MOCK_CONCERTS.filter((concert) =>
        concert.artists.some((concertArtist) => concertArtist.id === artist.id),
      )
      const reviewsCount = concerts.reduce(
        (sum, concert) => sum + (reviewsByConcertId.get(concert.id) ?? 0),
        0,
      )
      out.set(artist.id, { concertsCount: concerts.length, reviewsCount })
    }

    return out
  }, [])

  const filteredArtists = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = MOCK_ARTISTS.filter((artist) => {
      const stats = artistStats.get(artist.id) ?? { concertsCount: 0, reviewsCount: 0 }

      if (ratingFilter === 'rated' && artist.avgConcertScore === null) {
        return false
      }

      if (ratingFilter === 'unrated' && artist.avgConcertScore !== null) {
        return false
      }

      if (activityFilter === 'with_concerts' && stats.concertsCount === 0) {
        return false
      }

      if (activityFilter === 'with_reviews' && stats.reviewsCount === 0) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return artist.nickname.toLowerCase().includes(normalizedSearch)
    })

    return filtered.sort((a, b) => {
      const aStats = artistStats.get(a.id) ?? { concertsCount: 0, reviewsCount: 0 }
      const bStats = artistStats.get(b.id) ?? { concertsCount: 0, reviewsCount: 0 }

      if (sort === 'rating_desc') {
        return (b.avgConcertScore ?? -1) - (a.avgConcertScore ?? -1)
      }

      if (sort === 'reviews_desc') {
        return bStats.reviewsCount - aStats.reviewsCount
      }

      if (sort === 'concerts_desc') {
        return bStats.concertsCount - aStats.concertsCount
      }

      return a.nickname.localeCompare(b.nickname, 'ru-RU')
    })
  }, [activityFilter, artistStats, ratingFilter, search, sort])

  if (selectedArtist) {
    const artistConcerts = MOCK_CONCERTS
      .filter((concert) => concert.artists.some((artist) => artist.id === selectedArtist.id))
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    const artistConcertIds = new Set(artistConcerts.map((concert) => concert.id))
    const artistReviews = MOCK_REVIEWS
      .filter((review) => artistConcertIds.has(review.concertId))
      .sort((a, b) => b.id - a.id)
    const roundedScore =
      selectedArtist.avgConcertScore === null ? null : Math.round(selectedArtist.avgConcertScore)

    return (
      <section className="page">
        <div className="detailHeaderRow">
          <h1 className="pageTitle">Артист</h1>
          <Link to="/artists" className="detailBackLink">
            Все артисты
          </Link>
        </div>

        <article className="detailHero">
          <div className="detailHeroMedia artistPhoto" aria-hidden="true" />
          <div className="detailHeroBody">
            <h2 className="detailHeroTitle">{selectedArtist.nickname}</h2>
            <div className="detailStatsRow">
              <p className="detailStatItem">
                Концертов: <strong>{artistConcerts.length}</strong>
              </p>
              <p className="detailStatItem">
                Рецензий: <strong>{artistReviews.length}</strong>
              </p>
            </div>
            {roundedScore !== null && <div className="ratingCircle detailRatingCircle">{roundedScore}</div>}
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
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as ArtistRatingFilter)}
          >
            <option value="all">Все рейтинги</option>
            <option value="rated">Только с оценкой</option>
            <option value="unrated">Без оценки</option>
          </select>

          <select
            className="concertSelect"
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as ArtistActivityFilter)}
          >
            <option value="all">Любая активность</option>
            <option value="with_concerts">Только с концертами</option>
            <option value="with_reviews">Только с рецензиями</option>
          </select>

          <select
            className="concertSelect"
            value={sort}
            onChange={(e) => setSort(e.target.value as ArtistSort)}
          >
            <option value="rating_desc">По оценке</option>
            <option value="reviews_desc">По числу рецензий</option>
            <option value="concerts_desc">По числу концертов</option>
            <option value="name_asc">По имени</option>
          </select>
        </div>

        <div className="concertControlsRow">
          <button
            type="button"
            className="settingsBtn ghost"
            onClick={() => {
              setSearch('')
              setRatingFilter('all')
              setActivityFilter('all')
              setSort('rating_desc')
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Задание 3.4: карточки артистов с фото-заглушкой, ником и средней оценкой. */}
      {filteredArtists.length > 0 ? (
        <div className="artistGrid">
          {filteredArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="placeholder">По выбранным фильтрам артисты не найдены</div>
      )}
    </section>
  )
}
