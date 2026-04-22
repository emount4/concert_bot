# Frontend API Contract (derived from current frontend code)

This document is generated from the current frontend implementation under `front/src` and reflects what the UI expects when `VITE_DATA_SOURCE=api`.
The backend in `back/` is explicitly ignored (per request).

## Base URL and transport
- Base URL: `VITE_API_BASE_URL` (default: `http://127.0.0.1:8080/api/v1`)
- Requests use JSON bodies when present and set `Content-Type: application/json`
- Requests include cookies: `credentials: include` (cookie/session auth)
- Non-2xx responses: UI reads `{ "message": "..." }` if present
- HTTP 204 is treated as `null`

## List response envelope
The frontend only uses a minimal list envelope:
```ts
type ListResponse<T> = { items: T[] }
```
Notes:
- `meta` exists in `src/api/dto/contracts.ts` but is not used by UI.

## Identifier nuances
Many entities carry both numeric `id` and optional string `*_id`:
- UI logic uses numeric `id` for lookup/filtering
- For review-related URLs, UI uses `review.review_id ?? review.id`
- Recommendation: always return numeric `id` and string `*_id` when using UUIDs

## Data models (UI-facing types)

```ts
// concerts
export type Artist = {
  artist_id?: string
  id: number
  name: string
}

export type Venue = {
  venue_id?: string
  id: number
  name: string
  city: string
  address: string
  photo_url: string | null
}

export type ConcertStats = {
  avg_rating_total: number | null
  reviews_count: number
}

export type Concert = {
  concert_id?: string
  id: number
  title: string | null
  date: string
  poster_url: string | null
  venue: Venue
  artists: Artist[]
  stats: ConcertStats
}

// artist cards
export type ArtistCardItem = {
  artist_id?: string
  id: number
  name: string
  photo_url: string | null
  avg_rating_total: number | null
}

// venue cards
export type VenueCardItem = {
  venue_id?: string
  id: number
  name: string
  city: string
  capacity: number
  photo_url: string | null
  avg_rating_total: number | null
}

// reviews
export type ReviewScores = {
  performance: number
  setlist: number
  crowd: number
  sound: number
  vibe: number
}

export type ReviewMediaAttachment = {
  id: string
  type: 'image' | 'video'
  url: string
}

export type ReviewLikeUser = {
  name: string
  username?: string
  avatar_url?: string | null
}

export type ReviewCardItem = {
  review_id?: string
  concert_id?: string
  id: number
  concertId: number
  author_name: string
  author_username?: string
  author_avatar_url: string | null
  concert_title: string
  concert_artist: string
  concert_poster_url: string | null
  rating_total: number
  scores: ReviewScores
  text: string
  media?: ReviewMediaAttachment[]
  likes?: ReviewLikeUser[]
}

// profile
export type ProfileReviewStatus = 'approved' | 'pending' | 'rejected'

export type ProfileReviewItem = {
  review_id?: string
  id: number
  concert_title: string
  created_at: string
  status: ProfileReviewStatus
  rejection_reason?: string | null
  rating_total: number
}

export type UserProfile = {
  user_id?: string
  id: number
  displayName: string
  handle: string
  created_at: string
  bio: string
  reviews_count: number
  approved_count: number
  pending_count: number
  avatar_url: string | null
  banner_url?: string | null
  is_active?: boolean
  recent_reviews: ProfileReviewItem[]
}

// admin
export type AdminReviewStatus = 'pending' | 'approved' | 'rejected'

export type AdminReviewAttachment = {
  id: string
  type: 'image' | 'video'
  url: string
}

export type AdminReviewModerationItem = {
  review_id?: string
  id: number
  author_name: string
  author_username?: string
  concert_title: string
  created_at: string
  rating_total: number
  status: AdminReviewStatus
  text: string
  media?: AdminReviewAttachment[]
}

export type AdminArtist = {
  artist_id?: string
  id: number
  name: string
  description: string
  photo_url: string | null
}

export type AdminVenue = {
  venue_id?: string
  id: number
  name: string
  city: string
  address: string
  capacity: number
  photo_url: string | null
}

export type AdminConcert = {
  concert_id?: string
  id: number
  title: string
  date: string
  venue_id: number
  artist_ids: number[]
  poster_url: string | null
}

export type AdminAccountRole = 'user' | 'admin' | 'super_admin' | 'super-admin'

export type AdminAccount = {
  user_id?: string
  id: number
  displayName: string
  handle: string
  role: AdminAccountRole
  is_banned: boolean
  is_current: boolean
}

// admin queue and logs (used in UI, currently mock-only)
export type AdminProfileChangeType = 'username' | 'bio' | 'avatar' | 'banner'
export type AdminProfileChangeStatus = 'pending' | 'approved' | 'rejected'

export type AdminProfileChangeRequest = {
  id: string
  created_at: string
  requested_by_username: string
  requested_by_displayName: string
  type: AdminProfileChangeType
  status: AdminProfileChangeStatus
  old_username?: string | null
  new_username?: string | null
  old_bio?: string | null
  new_bio?: string | null
  old_avatar_url?: string | null
  new_avatar_url?: string | null
  old_banner_url?: string | null
  new_banner_url?: string | null
}

export type AdminConcertSuggestionStatus = 'pending' | 'created' | 'rejected'

export type AdminConcertSuggestion = {
  id: string
  created_at: string
  status: AdminConcertSuggestionStatus
  suggested_by_username: string
  suggested_by_displayName: string
  artist_name: string
  venue_name: string
  city_name: string
  date: string
}

export type AdminCity = {
  id: number
  name: string
  slug: string
  timezone: string
}

export type AdminAuditLogEntry = {
  id: string
  created_at: string
  actor_displayName: string
  actor_role: AdminAccountRole
  message: string
}
```

## Endpoints actually called in API mode
These are the only endpoints the current frontend calls when `VITE_DATA_SOURCE=api`:

### GET /concerts
Response: `ListResponse<Concert>`

### GET /artists
Response: `ListResponse<ArtistCardItem>`

### GET /venues
Response: `ListResponse<VenueCardItem>`

### GET /reviews
Response: `ListResponse<ReviewCardItem>`
Notes:
- `review.rating_total` is required (UI displays it directly)
- `review.scores` is required (UI renders all five values)
- `review.concertId` must match `concert.id` for filtering

### GET /users/me
Response: `UserProfile`
Notes:
- `handle` is used as the username (often includes '@' in mocks)
- `recent_reviews` drives moderation status in profile UI

### GET /admin/reviews/pending
Response: `ListResponse<AdminReviewModerationItem>`

### GET /admin/artists
Response: `ListResponse<AdminArtist>`

### GET /admin/venues
Response: `ListResponse<AdminVenue>`

### GET /admin/concerts
Response: `ListResponse<AdminConcert>`

### GET /admin/users
Response: `ListResponse<AdminAccount>`
Notes:
- `is_current` is used to find the current admin account
- roles are checked against `admin`, `super-admin`, or `super_admin`

### GET /reviews/{reviewId}/likers
Response: `ReviewLikeUser[]` OR `ListResponse<ReviewLikeUser>`
Notes:
- Frontend accepts either a plain array or `{ items: [...] }`
- `reviewId` can be a number or string; endpoint uses encoded path
- `ReviewLikeUser.name` is required; `username` is used for profile links if provided

## Endpoints declared but NOT used by frontend yet
These exist in `src/api/endpoints.ts` but are not called by current UI. Use them for future wiring.
Where possible, request/response shapes are inferred from mock code or DTOs.

### Auth
- POST /auth/register
  - Suggested body (from `authMock`): `{ displayName, email, password }`
  - Suggested response: `{ ok: true }` or `{ ok: false, message }`

- POST /auth/verify-email
  - Suggested body (from `authMock`): `{ email, code }`
  - Suggested response: `{ ok: true }` or `{ ok: false, message }`

- POST /auth/login
  - Suggested body (from `authMock`): `{ email, password }`
  - Suggested response: `{ ok: true }` or `{ ok: false, message }`

- POST /auth/refresh
  - Body: not specified in UI

- POST /auth/logout
  - Body: not specified in UI (204 is safe)

- POST /auth/tg-web-app/login
- POST /auth/tg-web-app/bind
  - Not specified in UI

### Users
- GET /users/profile/{username}
  - Not used by UI. Profile UI currently builds data locally from app bootstrap.

- PATCH /users/me
  - Not used by UI. Settings page updates are mock-only.

- GET /users/notifications
  - Not used by UI.

### Cities
- GET /cities
  - Not used by UI (admin city management is mock-only).

### Concerts
- GET /concerts/{id}
  - Not used by UI (details are derived from bootstrap list).

- POST /concerts/suggest
  - Not used by UI. Related UI for suggestions is mock-only in admin queue.

### Reviews
- GET /reviews/{id}
  - Not used by UI.

- POST /reviews
  - Not used by UI yet. If you wire it, Rate page collects:
    - `concertId`
    - `scores` (performance, setlist, crowd, sound, vibe)
    - `text`
    - optional `title` (currently unused)
    - optional media attachments (see presign below)

- POST /reviews/{id}/like
  - Not used by UI. Like toggling is local-only for now.

- POST /reviews/media/presign-upload
  - Not used by UI. If implemented, should return upload URLs and final `ReviewMediaAttachment` URLs.

### Favorites
- GET /favorites
- POST /favorites
- DELETE /favorites/{targetId}
  - Not used by UI. Favorites are built from mocks in profile screen.

### Admin
- GET /admin/profiles/pending
- POST/PATCH /admin/profiles/{moderationId}/resolve
- GET /admin/artists/{id}
- GET /admin/venues/{id}
- GET /admin/concerts/{id}
- POST/PATCH /admin/reviews/{id}/approve
- POST/PATCH /admin/reviews/{id}/reject
- POST/PATCH /admin/users/{id}/ban
- POST/PATCH /admin/users/{id}/role
- GET /admin/logs

None of the above are called by UI yet; admin actions are mock-only. If you wire them, align payloads with the admin types above.

## Quick checklist for backend compatibility
- Serve list endpoints with `{ items: [...] }`
- Include both numeric `id` and string `*_id` if you use UUIDs
- Keep date/time as ISO strings (UI parses with `new Date()`)
- Ensure `ReviewCardItem` contains all required fields (`scores`, `rating_total`, `author_name`, `concertId`)
- For likers endpoint, accept string or numeric path id and return array or `{ items }`
