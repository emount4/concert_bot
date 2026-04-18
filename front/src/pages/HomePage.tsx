import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import {
  SCORE_OPTIONS,
  fetchBestConcerts,
  fetchFreshReviews,
  fetchHomeSocialProof,
  fetchPopularConcerts,
  fetchTopArtistsByParam,
  fetchTopConcertsByParam,
  fetchTopVenuesByParam,
  type HomeTopRow,
  type ScoreKey,
} from '../mocks/home'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

function useInView<T extends Element>(
  ref: React.RefObject<T | null>,
  { rootMargin = '250px' }: { rootMargin?: string } = {},
) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, ref, rootMargin])

  return inView
}

function formatTopValue(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)
}

function TopRows({ rows }: { rows: HomeTopRow[] }) {
  return (
    <ul className="homeTopList" aria-label="Лидеры">
      {rows.map((row) => (
        <li key={row.key} className="homeTopItem">
          <Link to={row.href} className="homeTopLink">
            <span className="homeTopLabel">{row.label}</span>
            <span className="homeTopMeta">
              <span className="homeTopScore">{formatTopValue(row.value)}</span>
              <span className="homeTopScoreUnit">/10</span>
              <span className="homeTopCount">· {row.count}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function HomePage() {
  const [artistParam, setArtistParam] = useState<ScoreKey>('sound')
  const [venueParam, setVenueParam] = useState<ScoreKey>('sound')
  const [concertParam, setConcertParam] = useState<ScoreKey>('sound')

  const bestConcertsQuery = useQuery({
    queryKey: ['home', 'bestConcerts'],
    queryFn: ({ signal }) => fetchBestConcerts({ signal }),
    staleTime: 60_000,
  })

  const bestConcerts = (bestConcertsQuery.data ?? []).slice(0, 5)

  const popularConcertsQuery = useQuery({
    queryKey: ['home', 'popularConcerts'],
    queryFn: ({ signal }) => fetchPopularConcerts({ signal }),
    staleTime: 60_000,
  })

  const popularConcerts = (popularConcertsQuery.data ?? []).slice(0, 5)

  const topsErrorFallback = (
    <div className="placeholder">Не удалось загрузить рейтинг. Попробуйте обновить страницу.</div>
  )

  const artistTopsQuery = useQuery({
    queryKey: ['home', 'tops', 'artists', artistParam],
    queryFn: ({ signal }) => fetchTopArtistsByParam(artistParam, { signal }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const venueTopsQuery = useQuery({
    queryKey: ['home', 'tops', 'venues', venueParam],
    queryFn: ({ signal }) => fetchTopVenuesByParam(venueParam, { signal }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const concertTopsQuery = useQuery({
    queryKey: ['home', 'tops', 'concerts', concertParam],
    queryFn: ({ signal }) => fetchTopConcertsByParam(concertParam, { signal }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const feedAnchorRef = useRef<HTMLDivElement | null>(null)
  const statsAnchorRef = useRef<HTMLDivElement | null>(null)
  const feedInView = useInView(feedAnchorRef)
  const statsInView = useInView(statsAnchorRef)

  const freshReviewsQuery = useQuery({
    queryKey: ['home', 'freshReviews'],
    queryFn: ({ signal }) => fetchFreshReviews({ signal }),
    enabled: feedInView,
    staleTime: 30_000,
  })

  const socialProofQuery = useQuery({
    queryKey: ['home', 'socialProof'],
    queryFn: ({ signal }) => fetchHomeSocialProof({ signal }),
    enabled: statsInView,
    staleTime: 60_000,
  })

  const scoreOptions = useMemo(() => SCORE_OPTIONS, [])

  return (
    <section className="page homePage" aria-label="Главная">
      <h1 className="pageTitle">Главная</h1>

      <SectionErrorBoundary fallback={topsErrorFallback}>
        <section className="homeSection" aria-label="Лучшие концерты">
          <div className="homeSectionHeader">
            <h2 className="homeSectionTitle">Лучшие по оценке</h2>
            <Link className="homeSectionLink" to="/concerts">
              Смотреть все
            </Link>
          </div>

          {bestConcertsQuery.isLoading && <div className="placeholder">Загрузка рейтинга...</div>}
          {bestConcertsQuery.error && <div className="placeholder">Рейтинг не загрузился</div>}

          {!bestConcertsQuery.isLoading && !bestConcertsQuery.error && (
            <div className="homeCarousel homeCarouselTop5" role="list" aria-label="Лучшие концерты">
              {bestConcerts.map((concert) => (
                <Link
                  key={concert.id}
                  to={`/concerts/${concert.id}/rate`}
                  className="homeCarouselItem homeConcertCompact concertCardLink"
                  role="listitem"
                >
                  <ConcertCard concert={concert} />
                  <div className="homeConcertPlace homeConcertPlaceBig">{concert.venue.name} · {concert.venue.city}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="homeSection" aria-label="Самые популярные концерты">
          <div className="homeSectionHeader">
            <h2 className="homeSectionTitle">Самые популярные</h2>
            <Link className="homeSectionLink" to="/concerts">
              Смотреть все
            </Link>
          </div>

          {popularConcertsQuery.isLoading && <div className="placeholder">Загрузка рейтинга...</div>}
          {popularConcertsQuery.error && <div className="placeholder">Рейтинг не загрузился</div>}

          {!popularConcertsQuery.isLoading && !popularConcertsQuery.error && (
            <div className="homeCarousel homeCarouselTop5" role="list" aria-label="Популярные концерты">
              {popularConcerts.map((concert) => (
                <Link
                  key={concert.id}
                  to={`/concerts/${concert.id}/rate`}
                  className="homeCarouselItem homeConcertCompact concertCardLink"
                  role="listitem"
                >
                  <ConcertCard concert={concert} />
                  <div className="homeConcertPlace homeConcertPlaceBig">{concert.venue.name} · {concert.venue.city}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="homeSection" aria-label="Топы по параметрам">
          <div className="homeSectionHeader">
            <h2 className="homeSectionTitle">Лидеры по параметрам</h2>
          </div>

          <div className="homeTopsGrid">
            <div className="homeTopCol">
              <div className="homeTopHeader">
                <h3 className="homeTopTitle">Артисты</h3>
                <select
                  className="concertSelect homeSelect"
                  value={artistParam}
                  onChange={(e) => setArtistParam(e.target.value as ScoreKey)}
                  aria-label="Параметр для рейтинга артистов"
                >
                  {scoreOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {artistTopsQuery.isLoading && <div className="placeholder">Загрузка...</div>}
              {artistTopsQuery.error && <div className="placeholder">Не удалось загрузить</div>}
              {artistTopsQuery.data && <TopRows rows={artistTopsQuery.data} />}
            </div>

            <div className="homeTopCol">
              <div className="homeTopHeader">
                <h3 className="homeTopTitle">Площадки</h3>
                <select
                  className="concertSelect homeSelect"
                  value={venueParam}
                  onChange={(e) => setVenueParam(e.target.value as ScoreKey)}
                  aria-label="Параметр для рейтинга площадок"
                >
                  {scoreOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {venueTopsQuery.isLoading && <div className="placeholder">Загрузка...</div>}
              {venueTopsQuery.error && <div className="placeholder">Не удалось загрузить</div>}
              {venueTopsQuery.data && <TopRows rows={venueTopsQuery.data} />}
            </div>

            <div className="homeTopCol">
              <div className="homeTopHeader">
                <h3 className="homeTopTitle">Концерты</h3>
                <select
                  className="concertSelect homeSelect"
                  value={concertParam}
                  onChange={(e) => setConcertParam(e.target.value as ScoreKey)}
                  aria-label="Параметр для рейтинга концертов"
                >
                  {scoreOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {concertTopsQuery.isLoading && <div className="placeholder">Загрузка...</div>}
              {concertTopsQuery.error && <div className="placeholder">Не удалось загрузить</div>}
              {concertTopsQuery.data && <TopRows rows={concertTopsQuery.data} />}
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      <section className="homeSection" aria-label="Свежие рецензии">
        <div className="homeSectionHeader">
          <h2 className="homeSectionTitle">Свежие рецензии</h2>
          <Link className="homeSectionLink" to="/reviews">
            Смотреть все
          </Link>
        </div>

        <div ref={feedAnchorRef} />

        {!feedInView && <div className="placeholder">Прокрутите ниже, чтобы загрузить ленту</div>}
        {feedInView && freshReviewsQuery.isLoading && <div className="placeholder">Загрузка ленты...</div>}
        {feedInView && freshReviewsQuery.error && <div className="placeholder">Лента не загрузилась</div>}

        {freshReviewsQuery.data && (
          <div className="reviewGrid" aria-label="Последние рецензии">
            {freshReviewsQuery.data.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>

      <section className="homeSection" aria-label="Глобальная статистика">
        <div className="homeSectionHeader">
          <h2 className="homeSectionTitle">Статистика</h2>
        </div>

        <div ref={statsAnchorRef} />

        {!statsInView && <div className="placeholder">Прокрутите ниже, чтобы загрузить статистику</div>}
        {statsInView && socialProofQuery.isLoading && <div className="placeholder">Загрузка статистики...</div>}
        {statsInView && socialProofQuery.error && <div className="placeholder">Статистика не загрузилась</div>}

        {socialProofQuery.data && (
          <ul className="homeStatList" aria-label="Счетчики платформы">
            <li className="homeStatRow">
              <span className="homeStatRowLabel">Написано рецензий</span>
              <span className="homeStatRowValue">{socialProofQuery.data.reviewsWritten}</span>
            </li>
            <li className="homeStatRow">
              <span className="homeStatRowLabel">Оценено артистов</span>
              <span className="homeStatRowValue">{socialProofQuery.data.artistsRated}</span>
            </li>
            <li className="homeStatRow">
              <span className="homeStatRowLabel">Поставлено лайков</span>
              <span className="homeStatRowValue">{socialProofQuery.data.likesGiven}</span>
            </li>
          </ul>
        )}
      </section>
    </section>
  )
}
