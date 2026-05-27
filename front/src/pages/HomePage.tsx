import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ConcertCard } from '../components/concerts/ConcertCard'
import { ReviewCard } from '../components/reviews/ReviewCard'
import { ReviewGrid } from '../components/reviews/ReviewGrid'
import {
  SCORE_OPTIONS,
  fetchBestConcerts,
  fetchFreshReviews,
  fetchHomeSocialProof,
  fetchParamConcertsByParam,
  fetchPopularConcerts,
  type ScoreKey,
} from '../api/home'
import { InlineConcertSkeletonRow, InlineReviewSkeletonGrid, InlineStatsSkeleton } from '../components/ui/Skeletons'

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

function formatRank(rank: number) {
  const ordinals = ['Первое', 'Второе', 'Третье', 'Четвертое', 'Пятое']
  const ordinal = ordinals[rank - 1]
  return ordinal ? `${ordinal} место` : `${rank} место`
}

function RankBadge({ rank, size = 28, emphasis = 'normal' }: { rank: number; size?: number; emphasis?: 'normal' | 'large' }) {
  return (
    <span
      className={emphasis === 'large' ? 'homeRankBadge homeRankBadgeLarge' : 'homeRankBadge'}
      style={{ width: size, height: size }}
      aria-label={formatRank(rank)}
      title={formatRank(rank)}
    >
      <svg className="homeRankBadgeIcon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="var(--panel)" stroke="var(--border)" strokeWidth="1.5" />
        <path
          d="M8.4 9.4 6.5 6.2m9.1 3.2 1.9-3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
      <span className="homeRankBadgeText" aria-hidden="true">
        {rank}
      </span>
    </span>
  )
}

export function HomePage() {
  const [concertParam, setConcertParam] = useState<ScoreKey>('sound')

  const bestConcertsQuery = useQuery({
    queryKey: ['home', 'bestConcerts'],
    queryFn: () => fetchBestConcerts(),
    staleTime: 60_000,
  })

  const bestConcerts = (bestConcertsQuery.data ?? []).slice(0, 5)

  const popularConcertsQuery = useQuery({
    queryKey: ['home', 'popularConcerts'],
    queryFn: () => fetchPopularConcerts(),
    staleTime: 60_000,
  })

  const popularConcerts = (popularConcertsQuery.data ?? []).slice(0, 5)

  const topsErrorFallback = (
    <div className="placeholder">Не удалось загрузить рейтинг. Попробуйте обновить страницу.</div>
  )

  const concertTopsQuery = useQuery({
    queryKey: ['home', 'tops', 'concerts', concertParam],
    queryFn: () => fetchParamConcertsByParam(concertParam),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const feedAnchorRef = useRef<HTMLDivElement | null>(null)
  const statsAnchorRef = useRef<HTMLDivElement | null>(null)
  const feedInView = useInView(feedAnchorRef)
  const statsInView = useInView(statsAnchorRef)

  const freshReviewsQuery = useQuery({
    queryKey: ['home', 'freshReviews'],
    queryFn: () => fetchFreshReviews(),
    enabled: feedInView,
    staleTime: 30_000,
  })

  const socialProofQuery = useQuery({
    queryKey: ['home', 'socialProof'],
    queryFn: () => fetchHomeSocialProof(),
    enabled: statsInView,
    staleTime: 60_000,
  })

  const scoreOptions = useMemo(() => SCORE_OPTIONS, [])

  const statItems = useMemo(() => {
    const data = socialProofQuery.data
    if (!data) return [] as Array<{ key: string; label: string; value: number }>

    return [
      { key: 'users', label: 'Зарегистрированных пользователей', value: data.usersRegistered },
      { key: 'concerts', label: 'Концертов', value: data.concertsCount },
      { key: 'artists', label: 'Артистов', value: data.artistsCount },
      { key: 'venues', label: 'Площадок', value: data.venuesCount },
      { key: 'reviews', label: 'Рецензий написано', value: data.reviewsWritten },
    ]
  }, [socialProofQuery.data])

  return (
    <section className="page homePage" aria-label="Главная">
      {/* <h1 className="pageTitle mobilePageTitle">Главная</h1> */}

      <SectionErrorBoundary fallback={topsErrorFallback}>
        <section className="homeSection" aria-label="Лучшие концерты">
          <div className="homeSectionHeader">
            <h2 className="homeSectionTitle">Лучшие по оценке</h2>
            <Link className="homeSectionLink" to="/concerts">
              Смотреть все
            </Link>
          </div>

          {bestConcertsQuery.isLoading && <InlineConcertSkeletonRow />}
          {bestConcertsQuery.error && <div className="placeholder">Рейтинг не загрузился</div>}

          {!bestConcertsQuery.isLoading && !bestConcertsQuery.error && (
            <div className="homeCarousel homeCarouselTop5" role="list" aria-label="Лучшие концерты">
              {bestConcerts.map((concert, index) => (
                <Link
                  key={concert.id}
                  to={`/concerts/${concert.id}/rate`}
                  className="homeCarouselItem homeConcertCompact concertCardLink"
                  role="listitem"
                >
                  <ConcertCard concert={concert} />
                  <div className="homeRankSlot" aria-label="Место концерта в топе">
                    <RankBadge rank={index + 1} size={56} emphasis="large" />
                  </div>
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

          {popularConcertsQuery.isLoading && <InlineConcertSkeletonRow />}
          {popularConcertsQuery.error && <div className="placeholder">Рейтинг не загрузился</div>}

          {!popularConcertsQuery.isLoading && !popularConcertsQuery.error && (
            <div className="homeCarousel homeCarouselTop5" role="list" aria-label="Популярные концерты">
              {popularConcerts.map((concert, index) => (
                <Link
                  key={concert.id}
                  to={`/concerts/${concert.id}/rate`}
                  className="homeCarouselItem homeConcertCompact concertCardLink"
                  role="listitem"
                >
                  <ConcertCard concert={concert} />
                  <div className="homeRankSlot" aria-label="Место концерта в топе">
                    <RankBadge rank={index + 1} size={56} emphasis="large" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="homeSection" aria-label="Топ концертов по параметрам">
          <div className="homeSectionHeader">
            <h2 className="homeSectionTitle">Топ концертов по параметру</h2>
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

          {concertTopsQuery.isLoading && <InlineConcertSkeletonRow />}
          {concertTopsQuery.error && <div className="placeholder">Не удалось загрузить</div>}

          {concertTopsQuery.data && (
            <div className="homeCarousel homeCarouselTop5" role="list" aria-label="Топ концертов по выбранному параметру">
              {concertTopsQuery.data.map((concert, index) => (
                <Link
                  key={concert.id}
                  to={`/concerts/${concert.id}/rate`}
                  className="homeCarouselItem homeConcertCompact concertCardLink"
                  role="listitem"
                >
                  <ConcertCard concert={concert} />
                  <div className="homeRankSlot" aria-label="Место концерта в топе">
                    <RankBadge rank={index + 1} size={56} emphasis="large" />
                  </div>
                </Link>
              ))}
            </div>
          )}
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
        {feedInView && freshReviewsQuery.isLoading && <InlineReviewSkeletonGrid />}
        {feedInView && freshReviewsQuery.error && <div className="placeholder">Лента не загрузилась</div>}

        {freshReviewsQuery.data && (
          <ReviewGrid ariaLabel="Последние рецензии">
            {freshReviewsQuery.data.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ReviewGrid>
        )}
      </section>

      <section className="homeSection" aria-label="Глобальная статистика">
        <div className="homeSectionHeader">
          <h2 className="homeSectionTitle">Статистика</h2>
        </div>

        <div ref={statsAnchorRef} />

        {!statsInView && <div className="placeholder">Прокрутите ниже, чтобы загрузить статистику</div>}
        {statsInView && socialProofQuery.isLoading && <InlineStatsSkeleton />}
        {statsInView && socialProofQuery.error && <div className="placeholder">Статистика не загрузилась</div>}

        {socialProofQuery.data && (
          <div className="stats-container" aria-label="Глобальная статистика платформы">
            {statItems.map((item) => (
              <div
                key={item.key}
                className={item.key === 'reviews' ? 'stat-item stat-item-emphasis' : 'stat-item'}
              >
                <span className="stat-value">{item.value}</span>
                <span className="stat-label">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
