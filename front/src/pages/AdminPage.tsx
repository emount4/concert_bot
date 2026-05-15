import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { setDevAdmin } from '../utils/adminAccess'
import { useBodyScrollLock } from '../utils/useBodyScrollLock'
import {
  addAdminConcertArtist,
  approveAdminReview,
  createAdminConcert,
  deleteAdminConcertArtist,
  deleteAdminConcertHard,
  deleteAdminConcertSoft,
  deleteAdminConcertSuggestion,
  loadAdminAccounts,
  loadAdminConcerts,
  loadAdminConcertSuggestionById,
  loadAdminConcertSuggestions as loadAdminConcertSuggestionsFromApi,
  loadAdminReviews,
  loadAdminVenues,
  restoreAdminConcert,
  restoreVenue,
  updateAdminConcert,
  updateAdminConcertArtist,
} from '../api/repository'
import {
  appendAuditLog,
  ensureAdminStoreSeeded,
  loadAuditLogs,
  loadCities,
  loadProfileChangeRequests,
  removeCity,
  setConcertSuggestionStatus,
  setProfileChangeStatus,
  upsertCity,
  loadArtists,
  upsertArtist,
  removeArtist,
  loadVenues,
  upsertVenue,
  removeVenue as apiRemoveVenue,
} from '../data/adminStore'
import { setProfileOverride } from '../data/profileStore'
import type {
  AdminAccount,
  AdminAccountRole,
  AdminAuditLogEntry,
  AdminCity,
  AdminConcert,
  AdminConcertSuggestion,
  AdminReviewModerationItem,
  AdminReviewStatus,
  AdminProfileChangeRequest,
  AdminVenue,
} from '../types/admin'
import type { AdminArtistResponse } from '../types/artist'

export function AdminPage({ isAdmin }: AdminPageProps) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      setError('Доступ запрещен')
      return
    }
    setError(null)
  }, [isAdmin])

  if (error) {
    return <section className="page"><div className="placeholder">⚠️ {error}</div></section>
  }

  return <AdminPageContent isAdmin={isAdmin} refreshAppData={async () => {}} />
}

type AdminTab = 'moderation' | 'queue' | 'artists' | 'venues' | 'cities' | 'concerts' | 'accounts' | 'logs'
type ModerationStream = 'pending' | 'approved' | 'rejected'
type QueueStream = 'profile' | 'suggestions'

function roleLabel(role: AdminAccountRole): string {
  if (role === 'super-admin' || role === 'super_admin') return 'Главный админ'
  if (role === 'admin') return 'Админ'
  return 'Пользователь'
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusLabel(status: AdminReviewStatus): string {
  if (status === 'pending') return 'На модерации'
  if (status === 'approved') return 'Одобрено'
  return 'Отклонено'
}

function triStatusLabel(status: 'pending' | 'approved' | 'rejected'): string {
  if (status === 'pending') return 'На модерации'
  if (status === 'approved') return 'Одобрено'
  return 'Отклонено'
}

function readableAdminReviewText(value: unknown): string {
  if (typeof value !== 'string') return 'Текст рецензии недоступен'
  const trimmed = value.trim()
  return trimmed || 'Текст рецензии пуст'
}

function suggestionStatusLabel(status: AdminConcertSuggestion['status']): string {
  if (status === 'pending') return 'В очереди'
  if (status === 'created') return 'Создано'
  return 'Отклонено'
}

function suggestionStatusClass(status: AdminConcertSuggestion['status']): 'pending' | 'approved' | 'rejected' {
  if (status === 'created') return 'approved'
  return status
}

type AdminPageProps = {
  isAdmin: boolean
}

function AdminPageContent({ isAdmin, refreshAppData }: AdminPageProps & { refreshAppData: () => Promise<void> }) {
  // Задание 9.1: модальный выбор площадки и артистов для формы концерта.
  const [tab, setTab] = useState<AdminTab>('moderation')
  const [moderationStream, setModerationStream] = useState<ModerationStream>('pending')
  const [queueStream, setQueueStream] = useState<QueueStream>('profile')

  const [reviews, setReviews] = useState<AdminReviewModerationItem[]>([])
  const [artists, setArtists] = useState<AdminArtistResponse[]>([])
  const [venues, setVenues] = useState<AdminVenue[]>([])
  const [concerts, setConcerts] = useState<AdminConcert[]>([])
  const [accounts, setAccounts] = useState<AdminAccount[]>([])

  const [profileChanges, setProfileChanges] = useState<AdminProfileChangeRequest[]>(() => {
    ensureAdminStoreSeeded()
    return loadProfileChangeRequests()
  })
  const [concertSuggestions, setConcertSuggestions] = useState<AdminConcertSuggestion[]>([])
  
  // Loading states for each section
  const [isLoadingModeration, setIsLoadingModeration] = useState(false)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [loadedModerationStreams, setLoadedModerationStreams] = useState<ModerationStream[]>([])

  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [citiesError, setCitiesError] = useState<string | null>(null)
  const [citySaveError, setCitySaveError] = useState<string | null>(null)
  const [isLoadingSavingCity, setIsLoadingSavingCity] = useState(false)
  const [cityDeleteError, setCityDeleteError] = useState<string | null>(null)
  const [loadingDeleteCityId, setLoadingDeleteCityId] = useState<number | null>(null)
  const [hasLoadedCities, setHasLoadedCities] = useState(false)

  const [isLoadingArtists, setIsLoadingArtists] = useState(false)
  const [artistsError, setArtistsError] = useState<string | null>(null)
  const [artistSaveError, setArtistSaveError] = useState<string | null>(null)
  const [isLoadingSavingArtist, setIsLoadingSavingArtist] = useState(false)
  const [artistDeleteError, setArtistDeleteError] = useState<string | null>(null)
  const [loadingDeleteArtistId, setLoadingDeleteArtistId] = useState<number | null>(null)
  const [hasLoadedArtists, setHasLoadedArtists] = useState(false)

  const [isLoadingVenues, setIsLoadingVenues] = useState(false)
  const [venuesError, setVenuesError] = useState<string | null>(null)
  const [venueSaveError, setVenueSaveError] = useState<string | null>(null)
  const [isLoadingSavingVenue, setIsLoadingSavingVenue] = useState(false)
  const [loadingDeleteVenueId, setLoadingDeleteVenueId] = useState<number | null>(null)
  const [loadingRestoreVenueId, setLoadingRestoreVenueId] = useState<number | null>(null)
  const [venueDeleteError, setVenueDeleteError] = useState<string | null>(null)
  const [hasLoadedVenues, setHasLoadedVenues] = useState(false)

  const [isLoadingConcerts, setIsLoadingConcerts] = useState(false)
  const [concertsError, setConcertsError] = useState<string | null>(null)
  const [concertSaveError, setConcertSaveError] = useState<string | null>(null)
  const [isLoadingSavingConcert, setIsLoadingSavingConcert] = useState(false)
  const [concertDeleteError, setConcertDeleteError] = useState<string | null>(null)
  const [loadingConcertActionId, setLoadingConcertActionId] = useState<string | number | null>(null)
  const [hasLoadedConcerts, setHasLoadedConcerts] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)
  const [hasLoadedSuggestions, setHasLoadedSuggestions] = useState(false)

  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [hasLoadedAccounts, setHasLoadedAccounts] = useState(false)
  
  const [cities, setCities] = useState<AdminCity[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>(() => loadAuditLogs())

  useEffect(() => {
    if (tab !== 'moderation' || loadedModerationStreams.includes(moderationStream) || isLoadingModeration) return

    setIsLoadingModeration(true)
    setModerationError(null)
    void loadAdminReviews({ limit: 20, offset: 0, status: moderationStream })
      .then((loadedReviews) => {
        setReviews((prev) => {
          const otherReviews = prev.filter((review) => review.status !== moderationStream)
          return [...otherReviews, ...loadedReviews]
        })
      })
      .catch((error: unknown) => {
        console.error('[AdminPage] Failed to load moderation reviews:', error)
        setModerationError(error instanceof Error ? error.message : 'Failed to load moderation reviews')
      })
      .finally(() => {
        setIsLoadingModeration(false)
        setLoadedModerationStreams((prev) => (
          prev.includes(moderationStream) ? prev : [...prev, moderationStream]
        ))
      })
  }, [isLoadingModeration, loadedModerationStreams, moderationStream, tab])

  useEffect(() => {
    if (!['cities', 'venues'].includes(tab) || hasLoadedCities || isLoadingCities) return

    setIsLoadingCities(true)
    setCitiesError(null)
    void loadCities()
      .then((loadedCities) => {
        console.log('[AdminPage] Loaded cities:', loadedCities)
        setCities(loadedCities)
      })
      .catch((error: unknown) => {
        console.error('[AdminPage] Failed to load cities:', error)
        const errorMsg = error instanceof Error ? error.message : 'Failed to load cities'
        setCitiesError(errorMsg)
        setCities([])
      })
      .finally(() => {
        setIsLoadingCities(false)
        setHasLoadedCities(true)
      })
  }, [hasLoadedCities, isLoadingCities, tab])

  useEffect(() => {
    if (!['artists', 'concerts'].includes(tab) || hasLoadedArtists || isLoadingArtists) return

    setIsLoadingArtists(true)
    setArtistsError(null)
    void loadArtists()
      .then((loadedArtists) => {
        console.log('[AdminPage] Loaded artists:', loadedArtists)
        setArtists(loadedArtists)
      })
      .catch((error: unknown) => {
        console.error('[AdminPage] Failed to load artists:', error)
        const errorMsg = error instanceof Error ? error.message : 'Failed to load artists'
        setArtistsError(errorMsg)
        setArtists([])
      })
      .finally(() => {
        setIsLoadingArtists(false)
        setHasLoadedArtists(true)
      })
  }, [hasLoadedArtists, isLoadingArtists, tab])

  useEffect(() => {
    if (!['venues', 'concerts'].includes(tab) || hasLoadedVenues || isLoadingVenues) return

    setIsLoadingVenues(true)
    setVenuesError(null)
    void loadVenues()
      .then((loadedVenues) => {
        setVenues(loadedVenues)
      })
      .catch((error: unknown) => {
        console.error('[AdminPage] Failed to load venues:', error)
        setVenuesError(error instanceof Error ? error.message : 'Failed to load venues')
        setVenues([])
      })
      .finally(() => {
        setIsLoadingVenues(false)
        setHasLoadedVenues(true)
      })
  }, [hasLoadedVenues, isLoadingVenues, tab])

  useEffect(() => {
    if (tab !== 'concerts' || hasLoadedConcerts || isLoadingConcerts) return

    setIsLoadingConcerts(true)
    setConcertsError(null)
    void loadAdminConcerts({ include_deleted: true })
      .then((loadedConcerts) => {
        setConcerts(loadedConcerts)
      })
      .catch((error: unknown) => {
        console.error('[AdminPage] Failed to load concerts:', error)
        setConcertsError(error instanceof Error ? error.message : 'Failed to load concerts')
        setConcerts([])
      })
      .finally(() => {
        setIsLoadingConcerts(false)
        setHasLoadedConcerts(true)
      })
  }, [hasLoadedConcerts, isLoadingConcerts, tab])

  useEffect(() => {
    if (tab !== 'queue' || hasLoadedSuggestions || isLoadingSuggestions) return

    setIsLoadingSuggestions(true)
    setSuggestionsError(null)
    void loadAdminConcertSuggestionsFromApi()
      .then((loadedSuggestions) => {
        setConcertSuggestions(loadedSuggestions)
      })
      .catch((error: unknown) => {
        console.error('[AdminPage] Failed to load concert suggestions:', error)
        setSuggestionsError(error instanceof Error ? error.message : 'Failed to load concert suggestions')
        setConcertSuggestions([])
      })
      .finally(() => {
        setIsLoadingSuggestions(false)
        setHasLoadedSuggestions(true)
      })
  }, [hasLoadedSuggestions, isLoadingSuggestions, tab])

  useEffect(() => {
    if (tab !== 'accounts' || hasLoadedAccounts || isLoadingAccounts) return

    setIsLoadingAccounts(true)
    setAccountsError(null)
    void loadAdminAccounts()
      .then((loadedAccounts) => {
        setAccounts(loadedAccounts)
      })
      .catch((error: unknown) => {
        console.error('[AdminPage] Failed to load accounts:', error)
        setAccountsError(error instanceof Error ? error.message : 'Failed to load accounts')
        setAccounts([])
      })
      .finally(() => {
        setIsLoadingAccounts(false)
        setHasLoadedAccounts(true)
      })
  }, [hasLoadedAccounts, isLoadingAccounts, tab])

  const [artistForm, setArtistForm] = useState({ id: 0, name: '', description: '', photo_url: '' })
  const [venueForm, setVenueForm] = useState({
    id: 0,
    name: '',
    city_id: 0,
    address: '',
    capacity: '0',
    photo_url: '',
    description: '',
  })
  const [cityForm, setCityForm] = useState({ id: 0, name: '', slug: '', timezone: 'Europe/Moscow' })
  const [concertForm, setConcertForm] = useState<{
    id: string | number
    title: string
    date: string
    venue_id: string
    artist_ids: number[]
    main_artist_ids: number[]
    poster_url: string
  }>({
    id: 0,
    title: '',
    date: '',
    venue_id: '0',
    artist_ids: [] as number[],
    main_artist_ids: [] as number[],
    poster_url: '',
  })
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false)
  const [isArtistsModalOpen, setIsArtistsModalOpen] = useState(false)
  const [venueSearchQuery, setVenueSearchQuery] = useState('')
  const [artistSearchQuery, setArtistSearchQuery] = useState('')
  const [artistListQuery, setArtistListQuery] = useState('')
  const [venueListQuery, setVenueListQuery] = useState('')
  const [concertListQuery, setConcertListQuery] = useState('')
  const [accountListQuery, setAccountListQuery] = useState('')
  const [activeModerationMedia, setActiveModerationMedia] = useState<AdminReviewModerationItem | null>(null)
  // Задание 10.4: просмотр медиа в модерации по одному элементу.
  const [activeModerationMediaIndex, setActiveModerationMediaIndex] = useState(0)

  const [approveDraftReview, setApproveDraftReview] = useState<AdminReviewModerationItem | null>(null)
  const [approveDraftTitle, setApproveDraftTitle] = useState('')
  const [approveDraftText, setApproveDraftText] = useState('')
  const [approveDraftMediaIds, setApproveDraftMediaIds] = useState<string[]>([])
  const [approveDraftError, setApproveDraftError] = useState<string | null>(null)
  const [isApprovingReview, setIsApprovingReview] = useState(false)

  useBodyScrollLock(Boolean(activeModerationMedia || approveDraftReview || isVenueModalOpen || isArtistsModalOpen))

  const pending_count = useMemo(
    () => reviews.filter((review) => review.status === 'pending').length,
    [reviews],
  )
  const approved_count = useMemo(
    () => reviews.filter((review) => review.status === 'approved').length,
    [reviews],
  )
  const rejectedCount = useMemo(
    () => reviews.filter((review) => review.status === 'rejected').length,
    [reviews],
  )
  const visibleModerationReviews = useMemo(
    () => reviews.filter((review) => review.status === moderationStream),
    [moderationStream, reviews],
  )
  const selectedVenue = useMemo(
    () => venues.find((venue) => String(venue.id) === concertForm.venue_id) ?? null,
    [concertForm.venue_id, venues],
  )
  const selectedArtists = useMemo(
    () => artists.filter((artist) => concertForm.artist_ids.includes(artist.id)),
    [artists, concertForm.artist_ids],
  )
  const filteredVenues = useMemo(() => {
    const normalizedQuery = venueSearchQuery.trim().toLowerCase()
    if (!normalizedQuery) return venues

    return venues.filter((venue) => `${venue.name} ${venue.city}`.toLowerCase().includes(normalizedQuery))
  }, [venueSearchQuery, venues])
  const filteredArtists = useMemo(() => {
    const normalizedQuery = artistSearchQuery.trim().toLowerCase()
    if (!normalizedQuery) return artists

    return artists.filter((artist) => artist.name.toLowerCase().includes(normalizedQuery))
  }, [artistSearchQuery, artists])
  const filteredAdminArtists = useMemo(() => {
    const normalizedQuery = artistListQuery.trim().toLowerCase()
    if (!normalizedQuery) return artists

    return artists.filter((artist) => `${artist.name} ${artist.description}`.toLowerCase().includes(normalizedQuery))
  }, [artistListQuery, artists])
  const filteredAdminVenues = useMemo(() => {
    const normalizedQuery = venueListQuery.trim().toLowerCase()
    if (!normalizedQuery) return venues

    return venues.filter((venue) =>
      `${venue.name} ${venue.city} ${venue.address} ${venue.capacity} ${venue.description ?? ''} ${venue.status ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [venueListQuery, venues])
  const filteredAdminConcerts = useMemo(() => {
    const normalizedQuery = concertListQuery.trim().toLowerCase()
    if (!normalizedQuery) return concerts

    return concerts.filter((concert) => {
      const venueName = concert.venue?.name ?? venues.find((venue) => venue.id === concert.venue_id)?.name ?? ''
      const artistNames = concert.artist_ids
        .map((artistId) => artists.find((artist) => artist.id === artistId)?.name ?? '')
        .join(' ')
      const embeddedArtistNames = (concert.artists ?? []).map((artist) => artist.name).join(' ')

      return `${concert.title} ${concert.date} ${venueName} ${artistNames} ${embeddedArtistNames} ${concert.deleted_at ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [artists, concertListQuery, concerts, venues])
  const activeModerationAttachments = activeModerationMedia?.media ?? []
  const activeModerationAttachment = activeModerationAttachments[activeModerationMediaIndex] ?? null
  const currentAdminAccount = useMemo(() => accounts.find((account) => account.is_current) ?? null, [accounts])
  const canGrantAdmins = currentAdminAccount?.role === 'super-admin' || currentAdminAccount?.role === 'super_admin'
  const canViewAuditLogs = currentAdminAccount?.role === 'super-admin' || currentAdminAccount?.role === 'super_admin'
  const superAdminHandles = useMemo(
    () => accounts.filter((acc) => acc.role === 'super-admin' || acc.role === 'super_admin').map((acc) => acc.handle),
    [accounts],
  )
  const filteredAdminAccounts = useMemo(() => {
    const base = canGrantAdmins
      ? accounts
      : accounts.filter((account) => account.role !== 'super-admin' && account.role !== 'super_admin')

    const normalizedQuery = accountListQuery.trim().toLowerCase()
    if (!normalizedQuery) return base

    return base.filter((account) =>
      `${account.displayName} ${account.handle} ${account.role}`.toLowerCase().includes(normalizedQuery),
    )
  }, [accountListQuery, accounts, canGrantAdmins])

  function writeAudit(message: string) {
    if (!currentAdminAccount) return

    const entry = appendAuditLog({
      actor_displayName: currentAdminAccount.displayName,
      actor_role: currentAdminAccount.role,
      message,
    })
    setAuditLogs((prev) => [entry, ...prev])
  }

  function markReview(id: number, status: AdminReviewStatus) {
    setReviews((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))

    if (currentAdminAccount) {
      writeAudit(`Модератор ${currentAdminAccount.displayName} изменил статус рецензии #${id} на «${statusLabel(status)}».`)
    }
  }

  function openApproveDraft(review: AdminReviewModerationItem) {
    setApproveDraftReview(review)
    setApproveDraftTitle(review.title ?? '')
    setApproveDraftText(review.text)
    setApproveDraftMediaIds((review.media ?? []).map((m) => m.id))
    setApproveDraftError(null)
  }

  function closeApproveDraft() {
    setApproveDraftReview(null)
    setApproveDraftTitle('')
    setApproveDraftText('')
    setApproveDraftMediaIds([])
    setApproveDraftError(null)
    setIsApprovingReview(false)
  }

  function toggleApproveDraftMedia(id: string, checked: boolean) {
    setApproveDraftMediaIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id]
      }
      return prev.filter((x) => x !== id)
    })
  }

  async function applyApproveDraft() {
    if (!approveDraftReview) return

    const nextTitle = approveDraftTitle.trim()
    const nextText = approveDraftText.trim()
    if (!nextTitle || !nextText) {
      setApproveDraftError('Заполните финальный заголовок и текст рецензии.')
      return
    }

    const keep = new Set(approveDraftMediaIds)
    const beforeTitle = approveDraftReview.title ?? ''
    const beforeText = approveDraftReview.text
    const beforeCount = approveDraftReview.media?.length ?? 0
    const reviewKey = approveDraftReview.review_id ?? String(approveDraftReview.id)

    setApproveDraftError(null)
    setIsApprovingReview(true)

    try {
      const updatedReview = await approveAdminReview(reviewKey, {
        final_title: nextTitle,
        final_text: nextText,
        allowed_media_ids: approveDraftMediaIds,
      })

      setReviews((prev) =>
        prev.map((item) => {
          if (item.id !== approveDraftReview.id) return item

          if (updatedReview) return updatedReview

          const filteredMedia = (item.media ?? []).filter((m) => keep.has(m.id))

          return {
            ...item,
            status: 'approved',
            title: nextTitle,
            text: nextText,
            media: filteredMedia.length > 0 ? filteredMedia : undefined,
          }
        }),
      )

      if (currentAdminAccount) {
        const mediaAfter = approveDraftMediaIds.length
        const changed = nextTitle !== beforeTitle || nextText !== beforeText || mediaAfter !== beforeCount
        writeAudit(
          `Модератор ${currentAdminAccount.displayName} одобрил рецензию #${approveDraftReview.id}${changed ? ' с правками' : ''}.`,
        )
      }

      closeApproveDraft()
    } catch (error) {
      setApproveDraftError(error instanceof Error ? error.message : 'Не удалось одобрить рецензию.')
      setIsApprovingReview(false)
    }
  }

  function approveProfileChange(requestId: string) {
    const request = profileChanges.find((x) => x.id === requestId) ?? null
    if (!request) return

    setProfileChanges((prev) => prev.map((item) => (item.id === requestId ? { ...item, status: 'approved' } : item)))
    setProfileChangeStatus(requestId, 'approved')

    if (request.type === 'username' && request.new_username) {
      setProfileOverride({ handle: `@${request.new_username}` })
    }
    if (request.type === 'bio' && request.new_bio !== undefined) {
      setProfileOverride({ bio: request.new_bio ?? '' })
    }
    if (request.type === 'avatar') {
      setProfileOverride({ avatar_url: request.new_avatar_url ?? null })
    }
    if (request.type === 'banner') {
      setProfileOverride({ banner_url: request.new_banner_url ?? null })
    }

    if (currentAdminAccount) {
      writeAudit(`Модератор ${currentAdminAccount.displayName} одобрил изменение профиля (${request.type}) для @${request.requested_by_username}.`)
    }

    void refreshAppData()
  }

  function rejectProfileChange(requestId: string) {
    const request = profileChanges.find((x) => x.id === requestId) ?? null
    if (!request) return

    setProfileChanges((prev) => prev.map((item) => (item.id === requestId ? { ...item, status: 'rejected' } : item)))
    setProfileChangeStatus(requestId, 'rejected')

    if (currentAdminAccount) {
      writeAudit(`Модератор ${currentAdminAccount.displayName} отклонил изменение профиля (${request.type}) для @${request.requested_by_username}.`)
    }
  }

  async function createConcertFromSuggestion(suggestionId: string) {
    let suggestion = concertSuggestions.find((x) => x.id === suggestionId) ?? null
    try {
      suggestion = await loadAdminConcertSuggestionById(suggestionId)
    } catch {
      // Local/mock fallback already has enough fields to prefill the form.
    }

    if (!suggestion) return

    const normalizedVenue = suggestion.venue_name.trim().toLowerCase()
    const matchedVenue = venues.find((venue) => venue.name.trim().toLowerCase().includes(normalizedVenue)) ?? null

    const normalizedArtist = suggestion.artist_name.trim().toLowerCase()
    const matchedArtist = artists.find((artist) => artist.name.trim().toLowerCase().includes(normalizedArtist)) ?? null

    setConcertForm({
      id: 0,
      title: suggestion.artist_name,
      date: suggestion.date,
      venue_id: matchedVenue ? String(matchedVenue.id) : '0',
      artist_ids: matchedArtist ? [matchedArtist.id] : [],
      main_artist_ids: matchedArtist ? [matchedArtist.id] : [],
      poster_url: '',
    })

    setConcertSuggestions((prev) => prev.map((item) => (item.id === suggestionId ? { ...item, status: 'created' } : item)))
    setConcertSuggestionStatus(suggestionId, 'created')

    if (currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} создал концерт на основе предложения #${suggestionId}.`)
    }

    setTab('concerts')
  }

  function removeConcertSuggestion(suggestionId: string) {
    setSuggestionsError(null)

    void deleteAdminConcertSuggestion(suggestionId)
      .then(() => {
        setConcertSuggestions((prev) => prev.filter((item) => item.id !== suggestionId))
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to delete concert suggestion:', error)
        setSuggestionsError(error instanceof Error ? error.message : 'Ошибка при удалении предложения')
      })
  }

  function saveCity() {
    if (!cityForm.name.trim() || !cityForm.slug.trim() || !cityForm.timezone.trim()) return

    setIsLoadingSavingCity(true)
    setCitySaveError(null)

    void upsertCity({
      id: cityForm.id ? cityForm.id : undefined,
      name: cityForm.name.trim(),
      slug: cityForm.slug.trim(),
      timezone: cityForm.timezone.trim(),
    })
      .then((next) => {
        return loadCities().then((updatedCities) => {
          setCities(updatedCities)

          if (currentAdminAccount) {
            writeAudit(`Админ ${currentAdminAccount.displayName} сохранил город «${next.name}».`)
          }

          setCityForm({ id: 0, name: '', slug: '', timezone: 'Europe/Moscow' })
          setCitySaveError(null)
        })
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to save city:', error)
        const errorMsg = error instanceof Error ? error.message : 'Ошибка при сохранении города'
        setCitySaveError(errorMsg)
      })
      .finally(() => {
        setIsLoadingSavingCity(false)
      })
  }

  function deleteCity(id: number) {
    const city = cities.find((x) => x.id === id) ?? null
    
    setLoadingDeleteCityId(id)
    setCityDeleteError(null)

    void removeCity(id)
      .then(() => {
        return loadCities().then((updatedCities) => {
          setCities(updatedCities)

          if (city && currentAdminAccount) {
            writeAudit(`Админ ${currentAdminAccount.displayName} удалил город «${city.name}».`)
          }
          
          setCityDeleteError(null)
        })
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to delete city:', error)
        const errorMsg = error instanceof Error ? error.message : 'Ошибка при удалении города'
        setCityDeleteError(errorMsg)
      })
      .finally(() => {
        setLoadingDeleteCityId(null)
      })
  }

  function saveArtist() {
    if (!artistForm.name.trim()) return

    setIsLoadingSavingArtist(true)
    setArtistSaveError(null)

    void upsertArtist({
      id: artistForm.id !== 0 ? artistForm.id : undefined,
      name: artistForm.name.trim(),
      description: artistForm.description.trim(),
      photo_url: artistForm.photo_url || null,
    })
      .then((next) => {
        return loadArtists().then((updatedArtists) => {
          setArtists(updatedArtists)

          if (currentAdminAccount) {
            writeAudit(`Админ ${currentAdminAccount.displayName} сохранил артиста «${next.name}».`)
          }

          setArtistForm({ id: 0, name: '', description: '', photo_url: '' })
          setArtistSaveError(null)
        })
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to save artist:', error)
        const errorMsg = error instanceof Error ? error.message : 'Ошибка при сохранении артиста'
        setArtistSaveError(errorMsg)
      })
      .finally(() => {
        setIsLoadingSavingArtist(false)
      })
  }

  function saveVenue() {
    if (!venueForm.name.trim() || !venueForm.city_id) return

    const capacity = Number(venueForm.capacity) || 0

    setIsLoadingSavingVenue(true)
    setVenueSaveError(null)

    void upsertVenue({
      id: venueForm.id !== 0 ? venueForm.id : undefined,
      city_id: venueForm.city_id,
      name: venueForm.name.trim(),
      address: venueForm.address.trim(),
      capacity,
      photo_url: venueForm.photo_url || null,
      description: venueForm.description.trim(),
    })
      .then((next) => {
        return loadVenues().then((loadedVenues) => {
          setVenues(loadedVenues)

          if (currentAdminAccount) {
            writeAudit(`Админ ${currentAdminAccount.displayName} сохранил площадку «${next.name}».`)
          }

          setVenueForm({ id: 0, name: '', city_id: 0, address: '', capacity: '0', photo_url: '', description: '' })
          setVenueSaveError(null)
        })
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to save venue:', error)
        setVenueSaveError(error instanceof Error ? error.message : 'Ошибка при сохранении площадки')
      })
      .finally(() => {
        setIsLoadingSavingVenue(false)
      })
  }

  function resetConcertForm() {
    setConcertForm({ id: 0, title: '', date: '', venue_id: '0', artist_ids: [], main_artist_ids: [], poster_url: '' })
  }

  function normalizeConcertDate(value: string): string {
    if (!value) return ''
    if (value.endsWith('Z')) return value
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toISOString()
  }

  function posterKeyFromForm(value: string): string | undefined {
    const trimmed = value.trim()
    if (!trimmed || trimmed.startsWith('blob:')) return undefined
    return trimmed
  }

  async function reloadAdminConcerts() {
    const loadedConcerts = await loadAdminConcerts({ include_deleted: true })
    setConcerts(loadedConcerts)
    return loadedConcerts
  }

  async function syncConcertArtists(concert: AdminConcert, nextArtistIds: number[], mainArtistIds: number[]) {
    const concertId = concert.id
    const prevArtists = concert.artists ?? concert.artist_ids.map((id) => ({ id, name: String(id), is_main: false }))
    const prevIds = new Set(prevArtists.map((artist) => artist.id))
    const nextIds = new Set(nextArtistIds)

    await Promise.all(
      prevArtists
        .filter((artist) => !nextIds.has(artist.id))
        .map((artist) => deleteAdminConcertArtist(concertId, artist.id)),
    )

    await Promise.all(
      nextArtistIds.map((artistId) => {
        const is_main = mainArtistIds.includes(artistId)
        if (!prevIds.has(artistId)) {
          return addAdminConcertArtist(concertId, { artist_id: artistId, is_main })
        }
        return updateAdminConcertArtist(concertId, artistId, { is_main })
      }),
    )
  }

  function saveConcert() {
    const title = concertForm.title.trim()
    const venue_id = Number(concertForm.venue_id) || 0
    const date = normalizeConcertDate(concertForm.date)
    const mainArtistIds =
      concertForm.main_artist_ids.length > 0 ? concertForm.main_artist_ids : [concertForm.artist_ids[0]].filter(Boolean)

    if (!title || !venue_id || !date || concertForm.artist_ids.length === 0 || mainArtistIds.length === 0) {
      setConcertSaveError('Заполните название, дату, площадку и хотя бы одного артиста.')
      return
    }

    setIsLoadingSavingConcert(true)
    setConcertSaveError(null)

    const poster_key = posterKeyFromForm(concertForm.poster_url)

    const run = async () => {
      if (concertForm.id) {
        const existing = concerts.find((item) => item.id === concertForm.id) ?? null
        const updated = await updateAdminConcert(concertForm.id, {
          title,
          date,
          venue_id,
          ...(poster_key ? { poster_key } : {}),
        })
        await syncConcertArtists(existing ?? updated, concertForm.artist_ids, mainArtistIds)
      } else {
        await createAdminConcert({
          title,
          date,
          venue_id,
          ...(poster_key ? { poster_key } : {}),
          artists: concertForm.artist_ids.map((artistId) => ({
            artist_id: artistId,
            is_main: mainArtistIds.includes(artistId),
          })),
        })
      }

      await reloadAdminConcerts()
      resetConcertForm()

      if (currentAdminAccount) {
        writeAudit(`Админ ${currentAdminAccount.displayName} сохранил концерт «${title}».`)
      }
    }

    void run()
      .catch((error) => {
        console.error('[AdminPage] Failed to save concert:', error)
        setConcertSaveError(error instanceof Error ? error.message : 'Ошибка при сохранении концерта')
      })
      .finally(() => {
        setIsLoadingSavingConcert(false)
      })
  }

  function deleteArtistFromAdmin(id: number) {
    const artist = artists.find((x) => x.id === id) ?? null
    
    setLoadingDeleteArtistId(id)
    setArtistDeleteError(null)

    void removeArtist(id)
      .then(() => {
        return loadArtists().then((updatedArtists) => {
          setArtists(updatedArtists)

          if (artist && currentAdminAccount) {
            writeAudit(`Админ ${currentAdminAccount.displayName} удалил артиста «${artist.name}».`)
          }
          
          setArtistDeleteError(null)
        })
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to delete artist:', error)
        const errorMsg = error instanceof Error ? error.message : 'Ошибка при удалении артиста'
        setArtistDeleteError(errorMsg)
      })
      .finally(() => {
        setLoadingDeleteArtistId(null)
      })
  }

  function deleteVenueFromAdmin(id: number) {
    const venue = venues.find((x) => x.id === id) ?? null

    setLoadingDeleteVenueId(id)
    setVenueDeleteError(null)

    void apiRemoveVenue(id)
      .then(() => {
        return loadVenues().then((loadedVenues) => {
          setVenues(loadedVenues)

          if (venue && currentAdminAccount) {
            writeAudit(`Админ ${currentAdminAccount.displayName} удалил площадку «${venue.name}».`)
          }

          setVenueDeleteError(null)
        })
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to delete venue:', error)
        setVenueDeleteError(error instanceof Error ? error.message : 'Ошибка при удалении площадки')
      })
      .finally(() => {
        setLoadingDeleteVenueId(null)
      })
  }

  function restoreVenueFromAdmin(id: number) {
    const venue = venues.find((x) => x.id === id) ?? null

    setLoadingRestoreVenueId(id)
    setVenueDeleteError(null)

    void restoreVenue(id)
      .then(() => loadAdminVenues({ include_deleted: true }))
      .then((loadedVenues) => {
        setVenues(loadedVenues)

        if (venue && currentAdminAccount) {
          writeAudit(`Админ ${currentAdminAccount.displayName} восстановил площадку «${venue.name}».`)
        }
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to restore venue:', error)
        setVenueDeleteError(error instanceof Error ? error.message : 'Ошибка при восстановлении площадки')
      })
      .finally(() => {
        setLoadingRestoreVenueId(null)
      })
  }

  function removeConcert(id: string | number) {
    setLoadingConcertActionId(id)
    setConcertDeleteError(null)

    const concert = concerts.find((x) => x.id === id) ?? null
    void deleteAdminConcertSoft(id)
      .then(() => reloadAdminConcerts())
      .then(() => {
        if (concert && currentAdminAccount) {
          writeAudit(`Админ ${currentAdminAccount.displayName} удалил концерт «${concert.title}».`)
        }
      })
      .catch((error) => {
        console.error('[AdminPage] Failed to delete concert:', error)
        setConcertDeleteError(error instanceof Error ? error.message : 'Ошибка при удалении концерта')
        setConcerts((prev) => prev.filter((x) => x.id !== id))
      })
      .finally(() => {
        setLoadingConcertActionId(null)
      })
    return
    if (concert && currentAdminAccount && Date.now() < 0) {
      // @ts-expect-error unreachable legacy audit branch
      writeAudit(`Админ ${currentAdminAccount.displayName} удалил концерт «${concert.title}».`)
    }
  }

  function hardRemoveConcert(id: string | number) {
    setLoadingConcertActionId(id)
    setConcertDeleteError(null)

    void deleteAdminConcertHard(id)
      .then(() => reloadAdminConcerts())
      .catch((error) => {
        console.error('[AdminPage] Failed to hard delete concert:', error)
        setConcertDeleteError(error instanceof Error ? error.message : 'Ошибка при полном удалении концерта')
      })
      .finally(() => {
        setLoadingConcertActionId(null)
      })
  }

  function restoreConcertFromAdmin(id: string | number) {
    setLoadingConcertActionId(id)
    setConcertDeleteError(null)

    void restoreAdminConcert(id)
      .then(() => reloadAdminConcerts())
      .catch((error) => {
        console.error('[AdminPage] Failed to restore concert:', error)
        setConcertDeleteError(error instanceof Error ? error.message : 'Ошибка при восстановлении концерта')
      })
      .finally(() => {
        setLoadingConcertActionId(null)
      })
  }

  function setAccountBanState(id: number, is_banned: boolean) {
    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== id || account.is_current) return account
        return { ...account, is_banned }
      }),
    )

    const account = accounts.find((x) => x.id === id) ?? null
    if (account && currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} ${is_banned ? 'забанил' : 'разбанил'} пользователя ${account.handle}.`)
    }
  }

  function promoteAccountToAdmin(id: number) {
    if (!canGrantAdmins) return

    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== id) return account
        if (account.role !== 'user') return account
        return { ...account, role: 'admin' }
      }),
    )

    const account = accounts.find((x) => x.id === id) ?? null
    if (account && currentAdminAccount) {
      writeAudit(`Главный админ ${currentAdminAccount.displayName} назначил администратора ${account.handle}.`)
    }
  }

  function demoteAccountToUser(id: number) {
    if (!canGrantAdmins) return

    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== id) return account
        if (account.role !== 'admin') return account
        return { ...account, role: 'user' }
      }),
    )

    const account = accounts.find((x) => x.id === id) ?? null
    if (account && currentAdminAccount) {
      writeAudit(`Главный админ ${currentAdminAccount.displayName} понизил пользователя ${account.handle} до роли «Пользователь».`)
    }
  }

  function onMediaPick(event: React.ChangeEvent<HTMLInputElement>, onSet: (value: string) => void) {
    const file = event.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    onSet(url)
  }

  function toggleArtistInConcert(artistId: number) {
    setConcertForm((prev) => ({
      ...prev,
      artist_ids: prev.artist_ids.includes(artistId)
        ? prev.artist_ids.filter((id) => id !== artistId)
        : [...prev.artist_ids, artistId],
      main_artist_ids: prev.artist_ids.includes(artistId)
        ? prev.main_artist_ids.filter((id) => id !== artistId)
        : prev.main_artist_ids.length > 0
          ? prev.main_artist_ids
          : [artistId],
    }))
  }

  if (!isAdmin) {
    return (
      <section className="page">
        <h1 className="pageTitle">Админ-панель</h1>

        <article className="adminDenied">
          <h2 className="adminDeniedTitle">Доступ только для администратора</h2>
          <p className="adminDeniedText">
            Сейчас у вашего пользователя нет роли администратора. Для продакшена эта роль должна
            приходить с бэкенда (например, из <code>/api/me</code>).
          </p>
          <p className="adminDeniedText">
            Для локальной разработки можно временно разблокировать админку кнопкой ниже.
          </p>

          <div className="adminDeniedActions">
            <button
              type="button"
              className="settingsBtn primary"
              onClick={() => {
                setDevAdmin(true)
                window.location.reload()
              }}
            >
              Включить dev-админа
            </button>
            <button
              type="button"
              className="settingsBtn ghost"
              onClick={() => {
                setDevAdmin(false)
                window.location.reload()
              }}
            >
              Сбросить dev-админа
            </button>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Админ-панель</h1>

      <div className="adminHeader">
        <p className="adminIntro">Модерация рецензий и управление концертами, артистами и площадками.</p>
        <span className="adminBadge">Pending: {pending_count}</span>
      </div>

      <div className="adminTabs" role="tablist" aria-label="Разделы админки">
        <button
          type="button"
          className={tab === 'moderation' ? 'adminTab active' : 'adminTab'}
          onClick={() => setTab('moderation')}
        >
          Модерация
        </button>
        <button
          type="button"
          className={tab === 'queue' ? 'adminTab active' : 'adminTab'}
          onClick={() => setTab('queue')}
        >
          Очередь
        </button>
        <button
          type="button"
          className={tab === 'artists' ? 'adminTab active' : 'adminTab'}
          onClick={() => setTab('artists')}
        >
          Артисты
        </button>
        <button
          type="button"
          className={tab === 'venues' ? 'adminTab active' : 'adminTab'}
          onClick={() => setTab('venues')}
        >
          Площадки
        </button>
        <button
          type="button"
          className={tab === 'cities' ? 'adminTab active' : 'adminTab'}
          onClick={() => setTab('cities')}
        >
          Города
        </button>
        <button
          type="button"
          className={tab === 'concerts' ? 'adminTab active' : 'adminTab'}
          onClick={() => setTab('concerts')}
        >
          Концерты
        </button>
        <button
          type="button"
          className={tab === 'accounts' ? 'adminTab active' : 'adminTab'}
          onClick={() => setTab('accounts')}
        >
          Аккаунты
        </button>
        {canViewAuditLogs && (
          <button
            type="button"
            className={tab === 'logs' ? 'adminTab active' : 'adminTab'}
            onClick={() => setTab('logs')}
          >
            Логи
          </button>
        )}
      </div>

      {tab === 'queue' && (
        <section className="adminSection">
          <div className="adminSubTabs" role="tablist" aria-label="Очереди">
            <button
              type="button"
              className={queueStream === 'profile' ? 'adminSubTab active' : 'adminSubTab'}
              onClick={() => setQueueStream('profile')}
            >
              Модерация профилей ({profileChanges.filter((x) => x.status === 'pending').length})
            </button>
            <button
              type="button"
              className={queueStream === 'suggestions' ? 'adminSubTab active' : 'adminSubTab'}
              onClick={() => setQueueStream('suggestions')}
            >
              Предложения ({concertSuggestions.filter((x) => x.status === 'pending').length})
            </button>
          </div>

          {queueStream === 'profile' && (
            <>
              {profileChanges.length > 0 ? (
                profileChanges.map((req) => (
                  <article key={req.id} className="adminItemCard">
                    <div className="adminItemTop">
                      <p className="adminItemTitle">{req.type === 'username' ? 'Смена username' : req.type === 'bio' ? 'Смена bio' : req.type === 'banner' ? 'Смена баннера' : 'Смена аватара'}</p>
                      <span className={`adminStatus adminStatus-${req.status}`}>{triStatusLabel(req.status)}</span>
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        hidden
                        onClick={() => removeConcertSuggestion(req.id)}
                      >
                        Удалить
                      </button>
                    </div>

                    <p className="adminItemMeta">
                      <Link to={`/users/${encodeURIComponent(req.requested_by_username)}`}>{req.requested_by_displayName}</Link> • {formatDateTime(req.created_at)}
                    </p>

                    {req.type === 'username' && (
                      <p className="adminItemPreview">
                        @{req.old_username ?? '—'} → @{req.new_username ?? '—'}
                      </p>
                    )}
                    {req.type === 'bio' && (
                      <div className="adminDiffBlock">
                        <p className="adminDiffLabel">Старое</p>
                        <p className="adminItemPreview">{req.old_bio ?? '—'}</p>
                        <p className="adminDiffLabel">Новое</p>
                        <p className="adminItemPreview">{req.new_bio ?? '—'}</p>
                      </div>
                    )}
                    {(req.type === 'avatar' || req.type === 'banner') && (
                      <div className="adminMediaDiff">
                        <div className="adminMediaDiffCol">
                          <p className="adminDiffLabel">Было</p>
                          <div className="adminMediaThumb">
                            {(req.type === 'avatar' ? req.old_avatar_url : req.old_banner_url) ? (
                              <img
                                className="adminMediaThumbImg"
                                src={(req.type === 'avatar' ? req.old_avatar_url : req.old_banner_url) as string}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="adminMediaThumbPlaceholder" />
                            )}
                          </div>
                        </div>
                        <div className="adminMediaDiffCol">
                          <p className="adminDiffLabel">Стало</p>
                          <div className="adminMediaThumb">
                            {(req.type === 'avatar' ? req.new_avatar_url : req.new_banner_url) ? (
                              <img
                                className="adminMediaThumbImg"
                                src={(req.type === 'avatar' ? req.new_avatar_url : req.new_banner_url) as string}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="adminMediaThumbPlaceholder" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="adminItemActions">
                        <button type="button" className="settingsBtn primary" onClick={() => approveProfileChange(req.id)}>
                          Принять
                        </button>
                        <button type="button" className="settingsBtn ghost" onClick={() => rejectProfileChange(req.id)}>
                          Отклонить
                        </button>
                        <button
                          type="button"
                          className="settingsBtn ghost"
                          hidden
                          onClick={() => undefined}
                        >
                          Удалить навсегда
                        </button>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="adminEmpty">Заявок на изменение профиля нет.</div>
              )}
            </>
          )}

          {queueStream === 'suggestions' && (
            <>
              {isLoadingSuggestions ? (
                <div className="adminEmpty">Загрузка предложений...</div>
              ) : suggestionsError && concertSuggestions.length === 0 ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ {suggestionsError}
                </div>
              ) : concertSuggestions.length > 0 ? (
                concertSuggestions.map((sugg) => (
                  <article key={sugg.id} className="adminItemCard">
                    <div className="adminItemTop">
                      <p className="adminItemTitle">Предложение концерта</p>
                      <span className={`adminStatus adminStatus-${suggestionStatusClass(sugg.status)}`}>{suggestionStatusLabel(sugg.status)}</span>
                    </div>
                    <p className="adminItemMeta">
                      <Link to={`/users/${encodeURIComponent(sugg.suggested_by_username)}`}>{sugg.suggested_by_displayName}</Link> • {formatDateTime(sugg.created_at)}
                    </p>
                    <p className="adminItemPreview">
                      {[sugg.artist_name, sugg.city_name, sugg.venue_name, formatDateTime(sugg.date)].filter(Boolean).join(' • ')}
                    </p>
                    {sugg.info && <p className="adminItemPreview">{sugg.info}</p>}
                    <div className="adminItemActions">
                      <button
                        type="button"
                        className="settingsBtn primary"
                        disabled={sugg.status !== 'pending'}
                        onClick={() => void createConcertFromSuggestion(sugg.id)}
                      >
                        Создать на основе
                      </button>
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() => removeConcertSuggestion(sugg.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="adminEmpty">Предложений пока нет.</div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'moderation' && (
        <section className="adminSection">
          <div className="adminSubTabs" role="tablist" aria-label="Потоки модерации">
            <button
              type="button"
              className={moderationStream === 'pending' ? 'adminSubTab active' : 'adminSubTab'}
              onClick={() => setModerationStream('pending')}
            >
              Новые ({pending_count})
            </button>
            <button
              type="button"
              className={moderationStream === 'approved' ? 'adminSubTab active' : 'adminSubTab'}
              onClick={() => setModerationStream('approved')}
            >
              Одобренные ({approved_count})
            </button>
            <button
              type="button"
              className={moderationStream === 'rejected' ? 'adminSubTab active' : 'adminSubTab'}
              onClick={() => setModerationStream('rejected')}
            >
              Отклонённые ({rejectedCount})
            </button>
          </div>

          {isLoadingModeration ? (
            <div className="adminEmpty">Загрузка рецензий...</div>
          ) : moderationError ? (
            <div className="adminEmpty" style={{ color: '#f44336' }}>
              ⚠️ {moderationError}
            </div>
          ) : visibleModerationReviews.length > 0 ? (
            visibleModerationReviews.map((review) => (
              <article key={review.id} className="adminItemCard">
                <div className="adminItemTop">
                  <p className="adminItemTitle">{review.concert_title}</p>
                  <span className={`adminStatus adminStatus-${review.status}`}>{statusLabel(review.status)}</span>
                </div>

                <p className="adminItemMeta">
                  <Link to={`/users/${encodeURIComponent(review.author_username ?? review.author_name)}`}>{review.author_name}</Link> • {formatDateTime(review.created_at)} • {review.rating_total}
                </p>
                {review.title && <p className="adminItemTitle">{review.title}</p>}
                <p className="adminItemPreview">{readableAdminReviewText(review.text)}</p>

                <div className="adminItemActions">
                  {review.media && review.media.length > 0 && (
                    <button
                      type="button"
                      className="settingsBtn ghost"
                      onClick={() => {
                        setActiveModerationMediaIndex(0)
                        setActiveModerationMedia(review)
                      }}
                    >
                      Медиа ({review.media.length})
                    </button>
                  )}

                  <button
                    type="button"
                    className="settingsBtn primary"
                    onClick={() => openApproveDraft(review)}
                    disabled={isApprovingReview}
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    className="settingsBtn ghost"
                    onClick={() => markReview(review.id, 'rejected')}
                  >
                    Отклонить
                  </button>
                  <button
                    type="button"
                    className="settingsBtn ghost"
                    onClick={() => markReview(review.id, 'pending')}
                  >
                    Вернуть в pending
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="adminEmpty">В этом потоке сейчас нет рецензий.</div>
          )}

          {activeModerationMedia && (
            <div
              className="adminModalBackdrop"
              onClick={() => {
                setActiveModerationMedia(null)
                setActiveModerationMediaIndex(0)
              }}
            >
              <article className="adminModalCard adminMediaModalCard" onClick={(event) => event.stopPropagation()}>
                <div className="adminModalHeader">
                  <h3 className="adminModalTitle">Медиа рецензии</h3>
                  <button
                    type="button"
                    className="settingsBtn ghost"
                    onClick={() => {
                      setActiveModerationMedia(null)
                      setActiveModerationMediaIndex(0)
                    }}
                  >
                    Закрыть
                  </button>
                </div>

                <p className="adminListMeta">{activeModerationMedia.concert_title}</p>

                {activeModerationAttachment && (
                  <>
                    <div className="adminMediaStage">
                      <button
                        type="button"
                        className="adminMediaArrow"
                        aria-label="Предыдущее вложение"
                        onClick={() => setActiveModerationMediaIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeModerationMediaIndex === 0}
                      >
                        ←
                      </button>

                      <div className="adminMediaItem">
                        {activeModerationAttachment.type === 'video' ? (
                          <video className="adminMediaAsset" src={activeModerationAttachment.url} controls preload="metadata" />
                        ) : (
                          <img className="adminMediaAsset" src={activeModerationAttachment.url} alt="Вложение рецензии" />
                        )}
                      </div>

                      <button
                        type="button"
                        className="adminMediaArrow"
                        aria-label="Следующее вложение"
                        onClick={() =>
                          setActiveModerationMediaIndex((prev) => Math.min(activeModerationAttachments.length - 1, prev + 1))
                        }
                        disabled={activeModerationMediaIndex === activeModerationAttachments.length - 1}
                      >
                        →
                      </button>
                    </div>

                    <p className="adminMediaCounter">
                      {activeModerationMediaIndex + 1} / {activeModerationAttachments.length}
                    </p>
                  </>
                )}
              </article>
            </div>
          )}

          {approveDraftReview && (
            <div className="adminModalBackdrop" onClick={closeApproveDraft}>
              <article className="adminModalCard" onClick={(event) => event.stopPropagation()}>
                <div className="adminModalHeader">
                  <h3 className="adminModalTitle">Одобрение с правками</h3>
                  <button type="button" className="settingsBtn ghost" onClick={closeApproveDraft}>
                    Закрыть
                  </button>
                </div>

                <p className="adminListMeta">
                  {approveDraftReview.concert_title} • {approveDraftReview.author_name} • {approveDraftReview.rating_total}
                </p>

                <input
                  className="adminInput"
                  value={approveDraftTitle}
                  onChange={(e) => setApproveDraftTitle(e.target.value)}
                  placeholder="Финальный заголовок"
                  maxLength={255}
                  disabled={isApprovingReview}
                />
                <textarea
                  className="adminTextarea"
                  value={approveDraftText}
                  onChange={(e) => setApproveDraftText(e.target.value)}
                  disabled={isApprovingReview}
                />

                {approveDraftError && <p className="adminErrorText">{approveDraftError}</p>}

                {approveDraftReview.media && approveDraftReview.media.length > 0 && (
                  <>
                    <p className="adminInlineLabel">Медиа (снимите галочки, чтобы убрать из публикации)</p>
                    <div className="adminModalList" role="list" aria-label="Медиа вложения">
                      {approveDraftReview.media.map((m) => (
                        <label key={m.id} className="adminModalOption" role="listitem">
                          <div className="adminChecklistRow">
                            <input
                              type="checkbox"
                              checked={approveDraftMediaIds.includes(m.id)}
                              onChange={(e) => toggleApproveDraftMedia(m.id, e.target.checked)}
                              disabled={isApprovingReview}
                            />
                            <span className="adminModalOptionTitle">{m.type === 'video' ? 'Видео' : 'Фото'}</span>
                          </div>
                          <span className="adminModalOptionMeta">{m.url}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                <div className="adminItemActions">
                  <button
                    type="button"
                    className="settingsBtn primary"
                    onClick={() => void applyApproveDraft()}
                    disabled={!approveDraftTitle.trim() || !approveDraftText.trim() || isApprovingReview}
                  >
                    {isApprovingReview ? 'Одобряем...' : 'Одобрить'}
                  </button>
                  <button type="button" className="settingsBtn ghost" onClick={closeApproveDraft} disabled={isApprovingReview}>
                    Отмена
                  </button>
                </div>
              </article>
            </div>
          )}
        </section>
      )}

      {tab === 'artists' && (
        <section className="adminSection adminSectionGrid">
          <article className="adminFormCard">
            <h2 className="settingsCardTitle">{artistForm.id ? 'Редактировать артиста' : 'Новый артист'}</h2>
            <input
              className="adminInput"
              placeholder="Имя артиста"
              value={artistForm.name}
              onChange={(e) => setArtistForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isLoadingArtists || isLoadingSavingArtist}
            />
            <textarea
              className="adminTextarea"
              placeholder="Описание"
              value={artistForm.description}
              onChange={(e) => setArtistForm((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isLoadingArtists || isLoadingSavingArtist}
            />
            <label className="adminFileLabel">
              Фото артиста
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onMediaPick(e, (value) => setArtistForm((prev) => ({ ...prev, photo_url: value })))}
                disabled={isLoadingArtists || isLoadingSavingArtist}
              />
            </label>
            {artistForm.photo_url && <img className="adminPreviewImage" src={artistForm.photo_url} alt="Превью" />}
            {artistSaveError && (
              <div style={{ color: '#f44336', fontSize: '14px', marginTop: '8px' }}>
                ⚠️ {artistSaveError}
              </div>
            )}
            {concertSaveError && <p className="adminWarningText">{concertSaveError}</p>}

            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveArtist} disabled={isLoadingArtists || isLoadingSavingArtist}>
                {isLoadingSavingArtist ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => {
                  setArtistForm({ id: 0, name: '', description: '', photo_url: '' })
                  setArtistSaveError(null)
                }}
                disabled={isLoadingArtists || isLoadingSavingArtist}
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard adminListCardScrollable">
            <input
              className="adminInput adminListSearch"
              placeholder="Поиск артистов"
              value={artistListQuery}
              onChange={(e) => setArtistListQuery(e.target.value)}
              disabled={isLoadingArtists}
            />

            <div className="adminScrollableList">
              {isLoadingArtists ? (
                <div className="adminEmpty">Загрузка артистов...</div>
              ) : artistsError ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ {artistsError}
                </div>
              ) : artistDeleteError ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ Ошибка удаления: {artistDeleteError}
                </div>
              ) : filteredAdminArtists.length > 0 ? (
                filteredAdminArtists.map((artist) => (
                  <div key={artist.id} className="adminListRow">
                    <div>
                      <p className="adminListTitle">{artist.name}</p>
                      <p className="adminListMeta">{artist.description}</p>
                    </div>
                    <div className="adminRowActions">
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() => {
                          if (currentAdminAccount) {
                            writeAudit(`Админ ${currentAdminAccount.displayName} пересчитал статистику артиста «${artist.name}» (мок).`)
                          }
                        }}
                        disabled={loadingDeleteArtistId === artist.id}
                      >
                        Пересчитать
                      </button>
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() =>
                          setArtistForm({
                            id: artist.id,
                            name: artist.name,
                            description: artist.description,
                            photo_url: artist.photo_url ?? '',
                          })
                        }
                        disabled={loadingDeleteArtistId === artist.id}
                      >
                        Изменить
                      </button>
                      <button 
                        type="button" 
                        className="settingsBtn ghost" 
                        onClick={() => deleteArtistFromAdmin(artist.id)}
                        disabled={loadingDeleteArtistId === artist.id}
                      >
                        {loadingDeleteArtistId === artist.id ? 'Удаление...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="adminEmpty">Артисты не найдены.</div>
              )}
            </div>
          </article>
        </section>
      )}

      {tab === 'venues' && (
        <section className="adminSection adminSectionGrid">
          <article className="adminFormCard">
            <h2 className="settingsCardTitle">{venueForm.id ? 'Редактировать площадку' : 'Новая площадка'}</h2>
            <input
              className="adminInput"
              placeholder="Название"
              value={venueForm.name}
              onChange={(e) => setVenueForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <select
              className="adminInput"
              value={venueForm.city_id || ''}
              onChange={(e) => setVenueForm((prev) => ({ ...prev, city_id: Number(e.target.value) || 0 }))}
            >
              <option value="">Выберите город</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <input
              className="adminInput"
              placeholder="Адрес"
              value={venueForm.address}
              onChange={(e) => setVenueForm((prev) => ({ ...prev, address: e.target.value }))}
            />
            <input
              className="adminInput"
              type="number"
              placeholder="Вместимость"
              value={venueForm.capacity}
              onChange={(e) => setVenueForm((prev) => ({ ...prev, capacity: e.target.value }))}
            />
            <textarea
              className="adminInput"
              placeholder="Описание (необязательно)"
              rows={2}
              value={venueForm.description}
              onChange={(e) => setVenueForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <label className="adminFileLabel">
              Фото площадки
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onMediaPick(e, (value) => setVenueForm((prev) => ({ ...prev, photo_url: value })))}
              />
            </label>
            {venueForm.photo_url && <img className="adminPreviewImage" src={venueForm.photo_url} alt="Превью" />}
            {venueSaveError && <p className="adminEmpty" style={{ color: '#f44336' }}>{venueSaveError}</p>}
            <div className="adminItemActions">
              <button
                type="button"
                className="settingsBtn primary"
                onClick={saveVenue}
                disabled={isLoadingVenues || isLoadingSavingVenue}
              >
                {isLoadingSavingVenue ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => {
                  setVenueSaveError(null)
                  setVenueForm({ id: 0, name: '', city_id: 0, address: '', capacity: '0', photo_url: '', description: '' })
                }}
                disabled={isLoadingVenues || isLoadingSavingVenue}
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard adminListCardScrollable">
            <input
              className="adminInput adminListSearch"
              placeholder="Поиск площадок"
              value={venueListQuery}
              onChange={(e) => setVenueListQuery(e.target.value)}
            />
            {venueDeleteError && (
              <div className="adminEmpty" style={{ color: '#f44336' }}>
                ⚠️ {venueDeleteError}
              </div>
            )}

            <div className="adminScrollableList">
              {isLoadingVenues ? (
                <div className="adminEmpty">Загрузка площадок...</div>
              ) : venuesError ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ {venuesError}
                </div>
              ) : filteredAdminVenues.length > 0 ? (
                filteredAdminVenues.map((venue) => (
                  <div key={venue.id} className="adminListRow">
                    <div>
                      <p className="adminListTitle">{venue.name}</p>
                      <p className="adminListMeta">
                        {venue.city} • {venue.capacity} чел
                        {venue.status && ` • ${venue.status}`}
                        {venue.stats && (
                          <>
                            {' '}
                            • отзывов {venue.stats.reviews_count}, концертов {venue.stats.concerts_count}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="adminRowActions">
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() => restoreVenueFromAdmin(venue.id)}
                        disabled={loadingRestoreVenueId === venue.id}
                      >
                        {loadingRestoreVenueId === venue.id ? 'Восстановление...' : 'Восстановить'}
                      </button>
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() =>
                          setVenueForm({
                            id: venue.id,
                            name: venue.name,
                            city_id:
                              venue.city_id ?? cities.find((c) => c.name.trim() === venue.city.trim())?.id ?? 0,
                            address: venue.address,
                            capacity: String(venue.capacity),
                            photo_url: venue.photo_url ?? '',
                            description: venue.description ?? '',
                          })
                        }
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() => deleteVenueFromAdmin(venue.id)}
                        disabled={loadingDeleteVenueId === venue.id}
                      >
                        {loadingDeleteVenueId === venue.id ? 'Удаление...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="adminEmpty">Площадки не найдены.</div>
              )}
            </div>
          </article>
        </section>
      )}

      {tab === 'concerts' && (
        <section className="adminSection adminSectionGrid">
          <article className="adminFormCard">
            <h2 className="settingsCardTitle">{concertForm.id ? 'Редактировать концерт' : 'Новый концерт'}</h2>
            <input
              className="adminInput"
              placeholder="Название концерта"
              value={concertForm.title}
              onChange={(e) => setConcertForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              className="adminInput"
              type="datetime-local"
              value={concertForm.date}
              onChange={(e) => setConcertForm((prev) => ({ ...prev, date: e.target.value }))}
            />

            <label className="adminInlineLabel">Площадка</label>
            <div className="adminPickerRow">
              <p className="adminPickerValue">
                {selectedVenue ? `${selectedVenue.name}, ${selectedVenue.city}` : 'Площадка не выбрана'}
              </p>
              <div className="adminPickerActions">
                <button
                  type="button"
                  className="settingsBtn ghost"
                  onClick={() => {
                    setVenueSearchQuery('')
                    setIsVenueModalOpen(true)
                  }}
                >
                  Выбрать
                </button>
                {selectedVenue && (
                  <button
                    type="button"
                    className="settingsBtn ghost"
                    onClick={() => setConcertForm((prev) => ({ ...prev, venue_id: '0' }))}
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>

            <label className="adminInlineLabel">Артисты</label>
            <div className="adminChipWrap">
              {selectedArtists.length > 0 ? (
                selectedArtists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    className="adminChip active"
                    onClick={() => toggleArtistInConcert(artist.id)}
                  >
                    {artist.name} ×
                  </button>
                ))
              ) : (
                <p className="adminListMeta">Артисты не выбраны</p>
              )}
            </div>
            {selectedArtists.length > 0 && (
              <>
                  <label className="adminInlineLabel">Основные артисты</label>
                <div className="adminChipWrap">
                  {selectedArtists.map((artist) => (
                    <button
                      key={`main-${artist.id}`}
                      type="button"
                      className={concertForm.main_artist_ids.includes(artist.id) ? 'adminChip active' : 'adminChip'}
                      onClick={() =>
                        setConcertForm((prev) => ({
                          ...prev,
                          main_artist_ids: prev.main_artist_ids.includes(artist.id)
                            ? prev.main_artist_ids.filter((id) => id !== artist.id)
                            : [...prev.main_artist_ids, artist.id],
                        }))
                      }
                    >
                      {artist.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="adminPickerActions">
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => {
                  setArtistSearchQuery('')
                  setIsArtistsModalOpen(true)
                }}
              >
                Добавить артистов
              </button>
              {selectedArtists.length > 0 && (
                <button
                  type="button"
                  className="settingsBtn ghost"
                  onClick={() => setConcertForm((prev) => ({ ...prev, artist_ids: [], main_artist_ids: [] }))}
                >
                  Очистить выбор
                </button>
              )}
            </div>

            <label className="adminFileLabel">
              Афиша концерта
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  onMediaPick(e, (value) => setConcertForm((prev) => ({ ...prev, poster_url: value })))
                }
              />
            </label>
            {concertForm.poster_url && (
              <img className="adminPreviewImage" src={concertForm.poster_url} alt="Превью афиши" />
            )}

            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveConcert} disabled={isLoadingSavingConcert}>
                Сохранить
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() =>
                  setConcertForm({
                    id: 0,
                    title: '',
                    date: '',
                    venue_id: '0',
                    artist_ids: [],
                    main_artist_ids: [],
                    poster_url: '',
                  })
                }
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard adminListCardScrollable">
            <input
              className="adminInput adminListSearch"
              placeholder="Поиск концертов"
              value={concertListQuery}
              onChange={(e) => setConcertListQuery(e.target.value)}
            />
            {concertDeleteError && <p className="settingsError">{concertDeleteError}</p>}

            <div className="adminScrollableList">
              {isLoadingConcerts ? (
                <div className="adminEmpty">Загрузка концертов...</div>
              ) : concertsError ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ {concertsError}
                </div>
              ) : filteredAdminConcerts.length > 0 ? (
                filteredAdminConcerts.map((concert) => {
                  const venueName = venues.find((venue) => venue.id === concert.venue_id)?.name ?? 'Без площадки'
                  const artistIds = Array.isArray(concert.artist_ids) ? concert.artist_ids : []
                  const artistNames = artistIds
                    .map((artistId) => artists.find((artist) => artist.id === artistId)?.name)
                    .filter(Boolean)
                    .join(', ')

                  return (
                    <div key={concert.id} className="adminListRow">
                      <div>
                        <p className="adminListTitle">{concert.title}</p>
                        <p className="adminListMeta">
                          {formatDateTime(concert.date)} • {venueName}
                        </p>
                        <p className="adminListMeta">{artistNames || 'Артисты не выбраны'}</p>
                      </div>
                      <div className="adminRowActions">
                        <button
                          type="button"
                          className="settingsBtn ghost"
                          onClick={() =>
                            setConcertForm({
                              id: concert.id,
                              title: concert.title,
                              date: concert.date,
                              venue_id: String(concert.venue_id),
                              artist_ids: artistIds,
                              main_artist_ids: (() => {
                                const mainIds = (concert.artists ?? [])
                                  .filter((artist) => artist.is_main)
                                  .map((artist) => artist.id)
                                return mainIds.length > 0 ? mainIds : artistIds.slice(0, 1)
                              })(),
                              poster_url: concert.poster_url ?? '',
                            })
                          }
                        >
                          Изменить
                        </button>
                        {concert.deleted_at && (
                          <button
                            type="button"
                            className="settingsBtn ghost"
                            disabled={loadingConcertActionId === concert.id}
                            onClick={() => restoreConcertFromAdmin(concert.id)}
                          >
                            Восстановить
                          </button>
                        )}
                        <button
                          type="button"
                          className="settingsBtn ghost"
                          disabled={loadingConcertActionId === concert.id}
                          onClick={() => hardRemoveConcert(concert.id)}
                        >
                          Удалить навсегда
                        </button>
                        <button
                          type="button"
                          className="settingsBtn ghost"
                          disabled={loadingConcertActionId === concert.id || Boolean(concert.deleted_at)}
                          onClick={() => removeConcert(concert.id)}
                        >
                          {/* soft delete */}
                          Удалить
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="adminEmpty">Концерты не найдены.</div>
              )}
            </div>
          </article>

          {isVenueModalOpen && (
            <div className="adminModalBackdrop" onClick={() => setIsVenueModalOpen(false)}>
              <article className="adminModalCard" onClick={(event) => event.stopPropagation()}>
                <div className="adminModalHeader">
                  <h3 className="adminModalTitle">Выбор площадки</h3>
                  <button type="button" className="settingsBtn ghost" onClick={() => setIsVenueModalOpen(false)}>
                    Закрыть
                  </button>
                </div>

                <input
                  className="adminInput"
                  placeholder="Поиск по названию или городу"
                  value={venueSearchQuery}
                  onChange={(e) => setVenueSearchQuery(e.target.value)}
                />

                <div className="adminModalList" role="listbox" aria-label="Список площадок">
                  {filteredVenues.length > 0 ? (
                    filteredVenues.map((venue) => {
                      const active = String(venue.id) === concertForm.venue_id
                      return (
                        <button
                          key={venue.id}
                          type="button"
                          className={active ? 'adminModalOption active' : 'adminModalOption'}
                          onClick={() => {
                            setConcertForm((prev) => ({ ...prev, venue_id: String(venue.id) }))
                            setIsVenueModalOpen(false)
                          }}
                        >
                          <span className="adminModalOptionTitle">{venue.name}</span>
                          <span className="adminModalOptionMeta">{venue.city}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="adminEmpty">Ничего не найдено.</div>
                  )}
                </div>
              </article>
            </div>
          )}

          {isArtistsModalOpen && (
            <div className="adminModalBackdrop" onClick={() => setIsArtistsModalOpen(false)}>
              <article className="adminModalCard" onClick={(event) => event.stopPropagation()}>
                <div className="adminModalHeader">
                  <h3 className="adminModalTitle">Выбор артистов</h3>
                  <button type="button" className="settingsBtn ghost" onClick={() => setIsArtistsModalOpen(false)}>
                    Готово
                  </button>
                </div>

                <input
                  className="adminInput"
                  placeholder="Поиск по имени артиста"
                  value={artistSearchQuery}
                  onChange={(e) => setArtistSearchQuery(e.target.value)}
                />

                <p className="adminListMeta">Выбрано: {selectedArtists.length}</p>

                <div className="adminModalList" role="listbox" aria-label="Список артистов">
                  {filteredArtists.length > 0 ? (
                    filteredArtists.map((artist) => {
                      const active = concertForm.artist_ids.includes(artist.id)
                      return (
                        <button
                          key={artist.id}
                          type="button"
                          className={active ? 'adminModalOption active' : 'adminModalOption'}
                          onClick={() => toggleArtistInConcert(artist.id)}
                        >
                          <span className="adminModalOptionTitle">{artist.name}</span>
                          <span className="adminModalOptionMeta">{active ? 'Выбран' : 'Нажмите, чтобы выбрать'}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="adminEmpty">Ничего не найдено.</div>
                  )}
                </div>
              </article>
            </div>
          )}
        </section>
      )}

      {tab === 'accounts' && (
        <section className="adminSection">
          <article className="adminListCard adminListCardScrollable">
            <div className="adminAccountsHead">
              <input
                className="adminInput adminListSearch"
                placeholder="Поиск аккаунтов"
                value={accountListQuery}
                onChange={(e) => setAccountListQuery(e.target.value)}
              />
              {currentAdminAccount && (
                <p className="adminListMeta">
                  Вы: {currentAdminAccount.displayName} ({roleLabel(currentAdminAccount.role)})
                </p>
              )}
              {canGrantAdmins && superAdminHandles.length > 0 && (
                <p className="adminListMeta">Super Admin: {superAdminHandles.join(', ')}</p>
              )}
              {!canGrantAdmins && (
                <p className="adminWarningText">
                  Только главный админ может назначать новых админов.
                </p>
              )}
            </div>

            <div className="adminScrollableList">
              {isLoadingAccounts ? (
                <div className="adminEmpty">Загрузка аккаунтов...</div>
              ) : accountsError ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ {accountsError}
                </div>
              ) : filteredAdminAccounts.length > 0 ? (
                filteredAdminAccounts.map((account) => (
                  <div key={account.id} className="adminListRow">
                    <div>
                      <p className="adminListTitle">{account.displayName}</p>
                      <p className="adminListMeta">{account.handle}</p>
                      <div className="adminAccountMetaRow">
                        <span className="adminStatus">{roleLabel(account.role)}</span>
                        {account.is_banned && <span className="adminStatus adminStatus-rejected">Заблокирован</span>}
                        {account.is_current && <span className="adminStatus adminStatus-approved">Текущий аккаунт</span>}
                      </div>
                    </div>

                    <div className="adminRowActions">
                      {!account.is_current && (
                        <button
                          type="button"
                          className="settingsBtn ghost"
                          onClick={() => setAccountBanState(account.id, !account.is_banned)}
                        >
                          {account.is_banned ? 'Разбанить' : 'Забанить'}
                        </button>
                      )}

                      {account.role === 'user' && (
                        <button
                          type="button"
                          className="settingsBtn primary"
                          disabled={!canGrantAdmins}
                          onClick={() => promoteAccountToAdmin(account.id)}
                        >
                          Сделать админом
                        </button>
                      )}

                      {account.role === 'admin' && !account.is_current && (
                        <button
                          type="button"
                          className="settingsBtn ghost"
                          disabled={!canGrantAdmins}
                          onClick={() => demoteAccountToUser(account.id)}
                        >
                          Понизить до пользователя
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="adminEmpty">Аккаунты не найдены.</div>
              )}
            </div>
          </article>
        </section>
      )}

      {tab === 'cities' && (
        <section className="adminSection adminSectionGrid">
          <article className="adminFormCard">
            <h2 className="settingsCardTitle">{cityForm.id ? 'Редактировать город' : 'Новый город'}</h2>
            <input
              className="adminInput"
              placeholder="Название"
              value={cityForm.name}
              onChange={(e) => setCityForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isLoadingCities || isLoadingSavingCity}
            />
            <input
              className="adminInput"
              placeholder="Slug"
              value={cityForm.slug}
              onChange={(e) => setCityForm((prev) => ({ ...prev, slug: e.target.value }))}
              disabled={isLoadingCities || isLoadingSavingCity}
            />
            <input
              className="adminInput"
              placeholder="Timezone"
              value={cityForm.timezone}
              onChange={(e) => setCityForm((prev) => ({ ...prev, timezone: e.target.value }))}
              disabled={isLoadingCities || isLoadingSavingCity}
            />
            {citySaveError && (
              <div style={{ color: '#f44336', fontSize: '14px', marginTop: '8px' }}>
                ⚠️ {citySaveError}
              </div>
            )}
            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveCity} disabled={isLoadingCities || isLoadingSavingCity}>
                {isLoadingSavingCity ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => {
                  setCityForm({ id: 0, name: '', slug: '', timezone: 'Europe/Moscow' })
                  setCitySaveError(null)
                }}
                disabled={isLoadingCities || isLoadingSavingCity}
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard adminListCardScrollable">
            <div className="adminScrollableList">
              {isLoadingCities ? (
                <div className="adminEmpty">Загрузка городов...</div>
              ) : citiesError ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ {citiesError}
                </div>
              ) : cityDeleteError ? (
                <div className="adminEmpty" style={{ color: '#f44336' }}>
                  ⚠️ Ошибка удаления: {cityDeleteError}
                </div>
              ) : cities.length > 0 ? (
                cities.map((city) => (
                  <div key={city.id} className="adminListRow">
                    <div>
                      <p className="adminListTitle">{city.name}</p>
                      <p className="adminListMeta">
                        {city.slug} • {city.timezone}
                      </p>
                    </div>
                    <div className="adminRowActions">
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() => setCityForm({ id: city.id, name: city.name, slug: city.slug, timezone: city.timezone })}
                        disabled={loadingDeleteCityId === city.id}
                      >
                        Изменить
                      </button>
                      <button 
                        type="button" 
                        className="settingsBtn ghost" 
                        onClick={() => deleteCity(city.id)}
                        disabled={loadingDeleteCityId === city.id}
                      >
                        {loadingDeleteCityId === city.id ? 'Удаление...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="adminEmpty">Города не найдены.</div>
              )}
            </div>
          </article>
        </section>
      )}

      {tab === 'logs' && canViewAuditLogs && (
        <section className="adminSection">
          <article className="adminListCard adminListCardScrollable">
            <p className="adminListMeta">Логи действий модераторов и админов.</p>

            <div className="adminScrollableList">
              {auditLogs.length > 0 ? (
                auditLogs.map((entry) => (
                  <div key={entry.id} className="adminListRow">
                    <div>
                      <p className="adminListTitle">{entry.message}</p>
                      <p className="adminListMeta">
                        {formatDateTime(entry.created_at)} • {entry.actor_displayName} ({roleLabel(entry.actor_role)})
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="adminEmpty">Пока нет записей.</div>
              )}
            </div>
          </article>
        </section>
      )}
    </section>
  )
}

export default AdminPage

