import { apiRequest } from './client'
import { DATA_SOURCE_MODE } from './config'
import { apiEndpoints } from './endpoints'
import { loadConcerts, loadReviews, loadVenuesList } from './repository'
import {
  fetchBestConcerts as fetchMockBestConcerts,
  fetchFreshReviews as fetchMockFreshReviews,
  fetchHomeSocialProof as fetchMockHomeSocialProof,
  fetchPopularConcerts as fetchMockPopularConcerts,
  fetchTopArtistsByParam as fetchMockTopArtistsByParam,
  fetchTopConcertsByParam as fetchMockTopConcertsByParam,
  fetchTopVenuesByParam as fetchMockTopVenuesByParam,
  type HomeSocialProof,
  type HomeTopRow,
  type ScoreKey,
} from '../mocks/home'
import { getConcertIdKey, type Concert } from '../types/concert'
import type { Artist } from '../types/artist'
import type { VenueResponse } from '../types/venue'

type GlobalStatsResponse = {
  users_count: number
  concerts_count: number
  artists_count: number
  venues_count: number
  reviews_count: number
}

const SCORE_SORT: Record<ScoreKey, string> = {
  performance: 'p1',
  setlist: 'p2',
  crowd: 'p3',
  sound: 'p4',
  vibe: 'p5',
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function scoreValueFromStats(stats: Record<string, unknown> | undefined, param: ScoreKey): number {
  if (!stats) return 0
  const sort = SCORE_SORT[param]
  const direct = stats[`avg_${sort}`]
  if (typeof direct === 'number') return roundTo(direct, 1)

  const reviewsCount = typeof stats.reviews_count === 'number' ? stats.reviews_count : 0
  const sum = stats[`sum_${sort}`]
  if (typeof sum === 'number' && reviewsCount > 0) return roundTo(sum / reviewsCount, 1)

  const total = stats.avg_rating_total ?? stats.sum_rating_total
  if (typeof total === 'number') return roundTo(total, 1)
  return 0
}

function reviewsCountFromStats(stats: Record<string, unknown> | undefined): number {
  return typeof stats?.reviews_count === 'number' ? stats.reviews_count : 0
}

function topConcertRow(concert: Concert, param: ScoreKey): HomeTopRow {
  return {
    key: `concert-${getConcertIdKey(concert)}`,
    label: concert.title ?? 'Концерт',
    value: scoreValueFromStats(concert.stats as unknown as Record<string, unknown>, param),
    count: concert.stats.reviews_count,
    href: `/concerts/${getConcertIdKey(concert)}/rate`,
  }
}

function topArtistRow(artist: Artist, param: ScoreKey): HomeTopRow {
  return {
    key: `artist-${artist.id}`,
    label: artist.name,
    value: scoreValueFromStats(artist.stats as unknown as Record<string, unknown> | undefined, param),
    count: reviewsCountFromStats(artist.stats as unknown as Record<string, unknown> | undefined),
    href: `/artists?artistId=${artist.id}`,
  }
}

function topVenueRow(venue: VenueResponse, param: ScoreKey): HomeTopRow {
  const city = venue.city?.name ? ` · ${venue.city.name}` : ''
  return {
    key: `venue-${venue.id}`,
    label: `${venue.name}${city}`,
    value: scoreValueFromStats(venue.stats as unknown as Record<string, unknown> | undefined, param),
    count: reviewsCountFromStats(venue.stats as unknown as Record<string, unknown> | undefined),
    href: `/venues?venue_id=${venue.id}`,
  }
}

export async function fetchBestConcerts(): Promise<Concert[]> {
  if (DATA_SOURCE_MODE === 'mock') return fetchMockBestConcerts()
  const response = await loadConcerts({ limit: 5, offset: 0, sort: 'rating', direction: 'DESC' })
  return response.items
}

export async function fetchPopularConcerts(): Promise<Concert[]> {
  if (DATA_SOURCE_MODE === 'mock') return fetchMockPopularConcerts()
  const response = await loadConcerts({ limit: 5, offset: 0, sort: 'reviews', direction: 'DESC' })
  return response.items
}

export async function fetchFreshReviews() {
  if (DATA_SOURCE_MODE === 'mock') return fetchMockFreshReviews()
  const response = await loadReviews({ limit: 9, offset: 0, sort: 'created_at', direction: 'DESC' })
  return response.items
}

export async function fetchHomeSocialProof(): Promise<HomeSocialProof> {
  if (DATA_SOURCE_MODE === 'mock') return fetchMockHomeSocialProof()

  const response = await apiRequest<GlobalStatsResponse>(apiEndpoints.stats.global)
  return {
    usersRegistered: response.users_count,
    concertsCount: response.concerts_count,
    artistsCount: response.artists_count,
    venuesCount: response.venues_count,
    reviewsWritten: response.reviews_count,
  }
}

export async function fetchTopConcertsByParam(param: ScoreKey): Promise<HomeTopRow[]> {
  if (DATA_SOURCE_MODE === 'mock') return fetchMockTopConcertsByParam(param)
  const response = await loadConcerts({ limit: 8, offset: 0, sort: SCORE_SORT[param], direction: 'DESC' })
  return response.items.map((concert) => topConcertRow(concert, param))
}

export async function fetchParamConcertsByParam(param: ScoreKey): Promise<Concert[]> {
  const response = await loadConcerts({
    limit: DATA_SOURCE_MODE === 'mock' ? undefined : 5,
    offset: 0,
    sort: SCORE_SORT[param],
    direction: 'DESC',
  })

  return response.items
    .slice()
    .sort((a, b) => scoreValueFromStats(b.stats as unknown as Record<string, unknown>, param) - scoreValueFromStats(a.stats as unknown as Record<string, unknown>, param))
    .slice(0, 5)
}

export async function fetchTopArtistsByParam(param: ScoreKey): Promise<HomeTopRow[]> {
  if (DATA_SOURCE_MODE === 'mock') return fetchMockTopArtistsByParam(param)
  const sort = SCORE_SORT[param]
  const response = await apiRequest<{ items: Artist[] }>(
    `${apiEndpoints.artists.list}?limit=8&offset=0&sort=${encodeURIComponent(sort)}&direction=DESC`,
  )
  return response.items.map((artist) => topArtistRow(artist, param))
}

export async function fetchTopVenuesByParam(param: ScoreKey): Promise<HomeTopRow[]> {
  if (DATA_SOURCE_MODE === 'mock') return fetchMockTopVenuesByParam(param)
  const response = await loadVenuesList({ limit: 8, offset: 0, sort: SCORE_SORT[param], direction: 'DESC' })
  return response.items.map((venue) => topVenueRow(venue, param))
}

export { SCORE_OPTIONS, type HomeSocialProof, type HomeTopRow, type ScoreKey } from '../mocks/home'
