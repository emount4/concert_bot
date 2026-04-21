import type { Concert } from '../types/concert'
import type { ReviewCardItem, ReviewScores } from '../types/review'
import { MOCK_CONCERTS } from '../data/mockConcerts'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { MOCK_VENUES } from '../data/mockVenues'

export type ScoreKey = keyof ReviewScores

export const SCORE_OPTIONS: Array<{ key: ScoreKey; label: string }> = [
  { key: 'performance', label: 'Исполнение' },
  { key: 'setlist', label: 'Динамика / трек-лист' },
  { key: 'crowd', label: 'Харизма' },
  { key: 'sound', label: 'Звук' },
  { key: 'vibe', label: 'Вайб' },
]

export type HomeSocialProof = {
  usersRegistered: number
  concertsCount: number
  artistsCount: number
  venuesCount: number
  reviewsWritten: number
}

export type HomeTopRow = {
  key: string
  label: string
  value: number
  count: number
  href: string
}

function abortableDelay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function byNumberDescOrNullLast(getValue: (concert: Concert) => number | null) {
  return (a: Concert, b: Concert) => {
    const av = getValue(a)
    const bv = getValue(b)

    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1

    return bv - av
  }
}

export async function fetchBestConcerts({ signal }: { signal?: AbortSignal } = {}): Promise<Concert[]> {
  await abortableDelay(250, signal)

  return MOCK_CONCERTS
    .slice()
    .sort((a, b) => {
      const base = byNumberDescOrNullLast((c) => c.stats.avg_rating_total)(a, b)
      if (base !== 0) return base
      return b.stats.reviews_count - a.stats.reviews_count
    })
    .slice(0, 18)
}

export async function fetchPopularConcerts({ signal }: { signal?: AbortSignal } = {}): Promise<Concert[]> {
  await abortableDelay(300, signal)

  return MOCK_CONCERTS
    .slice()
    .sort((a, b) => {
      const base = b.stats.reviews_count - a.stats.reviews_count
      if (base !== 0) return base
      return (b.stats.avg_rating_total ?? -1) - (a.stats.avg_rating_total ?? -1)
    })
    .slice(0, 18)
}

export async function fetchFreshReviews({ signal }: { signal?: AbortSignal } = {}): Promise<ReviewCardItem[]> {
  await abortableDelay(350, signal)

  return MOCK_REVIEWS.slice().reverse().slice(0, 9)
}

export async function fetchHomeSocialProof({ signal }: { signal?: AbortSignal } = {}): Promise<HomeSocialProof> {
  await abortableDelay(300, signal)

  const reviewsWritten = MOCK_REVIEWS.length

  const concertsCount = MOCK_CONCERTS.length
  const venues = new Set<number>()
  const artists = new Set<number>()

  MOCK_CONCERTS.forEach((concert) => {
    venues.add(concert.venue.id)
    concert.artists.forEach((artist) => artists.add(artist.id))
  })

  let usersRegistered = 1
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem('concert_bot.users')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
          usersRegistered = Math.max(1, parsed.length)
        }
      } catch {
        usersRegistered = 1
      }
    }
  }

  return {
    usersRegistered,
    concertsCount,
    artistsCount: artists.size,
    venuesCount: venues.size,
    reviewsWritten,
  }
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function buildAverages<T extends string | number>(
  rows: Array<{ key: T; value: number }>,
): Map<T, { sum: number; count: number; avg: number }> {
  const agg = new Map<T, { sum: number; count: number }>()

  rows.forEach((row) => {
    const current = agg.get(row.key)
    if (!current) {
      agg.set(row.key, { sum: row.value, count: 1 })
      return
    }

    current.sum += row.value
    current.count += 1
  })

  const out = new Map<T, { sum: number; count: number; avg: number }>()
  agg.forEach((value, key) => {
    out.set(key, { ...value, avg: value.sum / value.count })
  })

  return out
}

export async function fetchTopArtistsByParam(
  param: ScoreKey,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HomeTopRow[]> {
  await abortableDelay(240, signal)

  const concertsById = new Map<number, Concert>(MOCK_CONCERTS.map((concert) => [concert.id, concert]))

  const rows: Array<{ key: number; value: number }> = []

  MOCK_REVIEWS.forEach((review) => {
    const concert = concertsById.get(review.concertId)
    if (!concert) return

    concert.artists.forEach((artist) => {
      rows.push({ key: artist.id, value: review.scores[param] })
    })
  })

  const averages = buildAverages(rows)

  const byId = new Map<number, { name: string }>()
  MOCK_CONCERTS.forEach((concert) => {
    concert.artists.forEach((artist) => {
      if (!byId.has(artist.id)) byId.set(artist.id, { name: artist.name })
    })
  })

  return Array.from(averages.entries())
    .map(([id, agg]) => {
      const meta = byId.get(id)
      return {
        key: `artist-${id}`,
        label: meta?.name ?? `Артист ${id}`,
        value: roundTo(agg.avg, 1),
        count: agg.count,
        href: `/artists?artistId=${id}`,
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

export async function fetchTopVenuesByParam(
  param: ScoreKey,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HomeTopRow[]> {
  await abortableDelay(260, signal)

  const concertsById = new Map<number, Concert>(MOCK_CONCERTS.map((concert) => [concert.id, concert]))

  const rows: Array<{ key: number; value: number }> = []

  MOCK_REVIEWS.forEach((review) => {
    const concert = concertsById.get(review.concertId)
    if (!concert) return

    rows.push({ key: concert.venue.id, value: review.scores[param] })
  })

  const averages = buildAverages(rows)

  const venueByKey = new Map<string, { id: number; label: string }>()
  MOCK_VENUES.forEach((venue) => {
    const key = `${venue.name}::${venue.city}`
    venueByKey.set(key, { id: venue.id, label: `${venue.name} · ${venue.city}` })
  })

  return Array.from(averages.entries())
    .map(([id, agg]) => {
      const fallbackLabel = `Площадка ${id}`
      const fallbackHref = `/venues?venue_id=${id}`

      const concertVenue = MOCK_CONCERTS.find((concert) => concert.venue.id === id)?.venue
      if (!concertVenue) {
        return {
          key: `venue-${id}`,
          label: fallbackLabel,
          value: roundTo(agg.avg, 1),
          count: agg.count,
          href: fallbackHref,
        }
      }

      const match = venueByKey.get(`${concertVenue.name}::${concertVenue.city}`)
      const resolvedId = match?.id ?? id
      const resolvedLabel = match?.label ?? `${concertVenue.name} · ${concertVenue.city}`

      return {
        key: `venue-${resolvedId}`,
        label: resolvedLabel,
        value: roundTo(agg.avg, 1),
        count: agg.count,
        href: `/venues?venue_id=${resolvedId}`,
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

export async function fetchTopConcertsByParam(
  param: ScoreKey,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HomeTopRow[]> {
  await abortableDelay(280, signal)

  const rows: Array<{ key: number; value: number }> = []

  MOCK_REVIEWS.forEach((review) => {
    rows.push({ key: review.concertId, value: review.scores[param] })
  })

  const averages = buildAverages(rows)

  const byId = new Map<number, Concert>(MOCK_CONCERTS.map((concert) => [concert.id, concert]))

  return Array.from(averages.entries())
    .map(([id, agg]) => {
      const concert = byId.get(id)
      const label = concert?.title ?? `Концерт ${id}`

      return {
        key: `concert-${id}`,
        label,
        value: roundTo(agg.avg, 1),
        count: agg.count,
        href: `/concerts/${id}/rate`,
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}
