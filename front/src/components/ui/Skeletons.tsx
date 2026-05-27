type SkeletonGridProps = {
  title?: string
  count?: number
  variant: 'concert' | 'artist' | 'review'
}

type DetailSkeletonProps = {
  title: string
  media?: 'poster' | 'square' | 'wide'
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`uiSkeletonBlock ${className}`} aria-hidden="true" />
}

function ControlsSkeleton() {
  return (
    <div className="skeletonControls" aria-hidden="true">
      <SkeletonBlock className="skeletonSearch" />
      <SkeletonBlock className="skeletonIconButton" />
    </div>
  )
}

function ConcertSkeletonCard() {
  return (
    <article className="skeletonCard skeletonConcertCard" aria-hidden="true">
      <SkeletonBlock className="skeletonPoster" />
      <div className="skeletonCardBody">
        <div className="skeletonCardText">
          <SkeletonBlock className="skeletonLine skeletonLineLg" />
          <SkeletonBlock className="skeletonLine" />
          <SkeletonBlock className="skeletonLine skeletonLineSm" />
          <SkeletonBlock className="skeletonLine skeletonLineMd" />
        </div>
        <SkeletonBlock className="skeletonCircle" />
      </div>
    </article>
  )
}

function ArtistSkeletonCard() {
  return (
    <article className="skeletonCard skeletonArtistCard" aria-hidden="true">
      <SkeletonBlock className="skeletonSquareMedia" />
      <div className="skeletonArtistBody">
        <SkeletonBlock className="skeletonLine skeletonLineMd" />
        <SkeletonBlock className="skeletonCircle" />
      </div>
    </article>
  )
}

function ReviewSkeletonCard() {
  return (
    <article className="skeletonCard skeletonReviewCard" aria-hidden="true">
      <div className="skeletonReviewTop">
        <SkeletonBlock className="skeletonAvatar" />
        <SkeletonBlock className="skeletonLine skeletonLineSm" />
        <SkeletonBlock className="skeletonScore" />
        <SkeletonBlock className="skeletonMiniPoster" />
      </div>
      <div className="skeletonDivider" />
      <SkeletonBlock className="skeletonLine skeletonLineMd" />
      <SkeletonBlock className="skeletonTextLine" />
      <SkeletonBlock className="skeletonTextLine" />
      <SkeletonBlock className="skeletonTextLine skeletonTextLineShort" />
      <div className="skeletonActions">
        <SkeletonBlock className="skeletonIconButton" />
        <SkeletonBlock className="skeletonIconButton" />
        <SkeletonBlock className="skeletonIconButton" />
      </div>
    </article>
  )
}

function skeletonCardForVariant(variant: SkeletonGridProps['variant'], index: number) {
  if (variant === 'artist') return <ArtistSkeletonCard key={index} />
  if (variant === 'review') return <ReviewSkeletonCard key={index} />
  return <ConcertSkeletonCard key={index} />
}

export function SkeletonGrid({ title, count = 8, variant }: SkeletonGridProps) {
  const gridClass = variant === 'artist' ? 'artistGrid' : variant === 'review' ? 'reviewGrid' : 'concertGrid'

  return (
    <section className="page skeletonPage" aria-busy="true" aria-live="polite">
      {title && <h1 className="pageTitle">{title}</h1>}
      {variant !== 'review' && <ControlsSkeleton />}
      <div className={gridClass}>
        {Array.from({ length: count }, (_, index) => skeletonCardForVariant(variant, index))}
      </div>
    </section>
  )
}

export function DetailSkeleton({ title, media = 'poster' }: DetailSkeletonProps) {
  return (
    <section className="page skeletonPage" aria-busy="true" aria-live="polite">
      <h1 className="pageTitle mobilePageTitle">{title}</h1>
      <article className="skeletonDetailHero">
        <SkeletonBlock className={`skeletonDetailMedia skeletonDetailMedia-${media}`} />
        <div className="skeletonDetailBody">
          <SkeletonBlock className="skeletonLine skeletonLineLg" />
          <div className="skeletonChipRow">
            <SkeletonBlock className="skeletonChip" />
            <SkeletonBlock className="skeletonChip" />
            <SkeletonBlock className="skeletonChip skeletonChipShort" />
          </div>
          <SkeletonBlock className="skeletonTextLine" />
          <SkeletonBlock className="skeletonTextLine skeletonTextLineShort" />
          <div className="skeletonDetailFooter">
            <SkeletonBlock className="skeletonCircle" />
            <SkeletonBlock className="skeletonIconButton" />
          </div>
        </div>
      </article>
      <div className="skeletonSection">
        <SkeletonBlock className="skeletonLine skeletonLineMd" />
        <div className="reviewGrid">
          <ReviewSkeletonCard />
          <ReviewSkeletonCard />
        </div>
      </div>
    </section>
  )
}

export function InlineConcertSkeletonRow({ count = 5 }: { count?: number }) {
  return (
    <div className="homeCarousel homeCarouselTop5" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="homeCarouselItem homeConcertCompact">
          <ConcertSkeletonCard />
          <div className="homeRankSlot">
            <SkeletonBlock className="skeletonRankBadge" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InlineReviewSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="reviewGrid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ReviewSkeletonCard key={index} />
      ))}
    </div>
  )
}

export function InlineStatsSkeleton() {
  return (
    <div className="stats-container" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="stat-item">
          <SkeletonBlock className="skeletonStatValue" />
          <SkeletonBlock className="skeletonStatLabel" />
        </div>
      ))}
    </div>
  )
}
