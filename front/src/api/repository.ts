import { apiRequest } from './client'
import { DATA_SOURCE_MODE } from './config'
import { apiEndpoints } from './endpoints'
import { MOCK_ADMIN_ACCOUNTS, MOCK_ADMIN_ARTISTS, MOCK_ADMIN_CONCERTS, MOCK_ADMIN_REVIEWS, MOCK_ADMIN_VENUES } from '../data/mockAdmin'
import { MOCK_ARTISTS } from '../data/mockArtists'
import { MOCK_CONCERTS } from '../data/mockConcerts'
import { MOCK_PROFILE } from '../data/mockProfile'
import { MOCK_REVIEWS } from '../data/mockReviews'
import { MOCK_VENUES } from '../data/mockVenues'
import { applyProfileOverrides } from '../data/profileStore'
import type { AdminAccount, AdminArtist, AdminConcert, AdminReviewModerationItem, AdminVenue } from '../types/admin'
import type { ArtistCardItem } from '../types/artist'
import type { Concert } from '../types/concert'
import type { UserProfile } from '../types/profile'
import type { ReviewCardItem } from '../types/review'
import type { VenueCardItem } from '../types/venue'

type ListResponse<T> = { items: T[] }

export type AppBootstrapData = {
  concerts: Concert[]
  artists: ArtistCardItem[]
  venues: VenueCardItem[]
  reviews: ReviewCardItem[]
  profile: UserProfile
  admin: {
    reviews: AdminReviewModerationItem[]
    artists: AdminArtist[]
    venues: AdminVenue[]
    concerts: AdminConcert[]
    accounts: AdminAccount[]
  }
}

function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase()
}

export async function loadAppBootstrapData(): Promise<AppBootstrapData> {
  if (DATA_SOURCE_MODE === 'mock') {
    const baseProfile = MOCK_PROFILE
    const profile = applyProfileOverrides(baseProfile)

    const baseUsername = normalizeUsername(baseProfile.handle)
    const currentUsername = normalizeUsername(profile.handle)

    const reviews: ReviewCardItem[] = MOCK_REVIEWS.map((review) => {
      const reviewUsername = normalizeUsername(review.author_username ?? '')
      if (!baseUsername || !currentUsername || reviewUsername !== baseUsername) return review

      return {
        ...review,
        author_username: currentUsername,
        author_avatar_url: profile.avatar_url,
      }
    })

    const adminAccounts: AdminAccount[] = MOCK_ADMIN_ACCOUNTS.map((acc) => {
      if (!acc.is_current) return acc
      if (!baseUsername || !currentUsername || normalizeUsername(acc.handle) !== baseUsername) return acc
      return { ...acc, handle: `@${currentUsername}` }
    })

    return {
      concerts: MOCK_CONCERTS,
      artists: MOCK_ARTISTS,
      venues: MOCK_VENUES,
      reviews,
      profile,
      admin: {
        reviews: MOCK_ADMIN_REVIEWS,
        artists: MOCK_ADMIN_ARTISTS,
        venues: MOCK_ADMIN_VENUES,
        concerts: MOCK_ADMIN_CONCERTS,
        accounts: adminAccounts,
      },
    }
  }

  const [concerts, artists, venues, reviews, profile, adminReviews, adminArtists, adminVenues, adminConcerts, adminAccounts] =
    await Promise.all([
      apiRequest<ListResponse<Concert>>(apiEndpoints.concerts.list).then((res) => res.items),
      apiRequest<ListResponse<ArtistCardItem>>(apiEndpoints.artists.list).then((res) => res.items),
      apiRequest<ListResponse<VenueCardItem>>(apiEndpoints.venues.list).then((res) => res.items),
      apiRequest<ListResponse<ReviewCardItem>>(apiEndpoints.reviews.list).then((res) => res.items),
      apiRequest<UserProfile>(apiEndpoints.users.me),
      apiRequest<ListResponse<AdminReviewModerationItem>>(apiEndpoints.admin.pendingReviews).then((res) => res.items),
      apiRequest<ListResponse<AdminArtist>>(apiEndpoints.admin.artists).then((res) => res.items),
      apiRequest<ListResponse<AdminVenue>>(apiEndpoints.admin.venues).then((res) => res.items),
      apiRequest<ListResponse<AdminConcert>>(apiEndpoints.admin.concerts).then((res) => res.items),
      apiRequest<ListResponse<AdminAccount>>(apiEndpoints.admin.users).then((res) => res.items),
    ])

  return {
    concerts,
    artists,
    venues,
    reviews,
    profile,
    admin: {
      reviews: adminReviews,
      artists: adminArtists,
      venues: adminVenues,
      concerts: adminConcerts,
      accounts: adminAccounts,
    },
  }
}
