import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAppData } from '../api/AppDataProvider'
import { setDevAdmin } from '../utils/adminAccess'
import { useBodyScrollLock } from '../utils/useBodyScrollLock'
import {
  appendAuditLog,
  ensureAdminStoreSeeded,
  loadAuditLogs,
  loadCities,
  loadConcertSuggestions,
  loadProfileChangeRequests,
  removeCity,
  setConcertSuggestionStatus,
  setProfileChangeStatus,
  upsertCity,
} from '../data/adminStore'
import { setProfileOverride } from '../data/profileStore'
import type {
  AdminAccount,
  AdminAccountRole,
  AdminArtist,
  AdminAuditLogEntry,
  AdminCity,
  AdminConcert,
  AdminConcertSuggestion,
  AdminReviewModerationItem,
  AdminReviewStatus,
  AdminProfileChangeRequest,
  AdminVenue,
} from '../types/admin'

type AdminPageProps = {
  isAdmin: boolean
}
type AdminSeed = {
  reviews: AdminReviewModerationItem[]
  artists: AdminArtist[]
  venues: AdminVenue[]
  concerts: AdminConcert[]
  accounts: AdminAccount[]
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

function suggestionStatusLabel(status: AdminConcertSuggestion['status']): string {
  if (status === 'pending') return 'В очереди'
  if (status === 'created') return 'Создано'
  return 'Отклонено'
}

function suggestionStatusClass(status: AdminConcertSuggestion['status']): 'pending' | 'approved' | 'rejected' {
  if (status === 'created') return 'approved'
  return status
}

export function AdminPage({ isAdmin }: AdminPageProps) {
  const { data, isLoading, error, refresh } = useAppData()

  if (isLoading || !data) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (error) {
    return <section className="page"><div className="placeholder">{error}</div></section>
  }

  return <AdminPageContent isAdmin={isAdmin} seed={data.admin} refreshAppData={refresh} />
}

function AdminPageContent({ isAdmin, seed, refreshAppData }: AdminPageProps & { seed: AdminSeed; refreshAppData: () => Promise<void> }) {
  // Задание 9.1: модальный выбор площадки и артистов для формы концерта.
  const [tab, setTab] = useState<AdminTab>('moderation')
  const [moderationStream, setModerationStream] = useState<ModerationStream>('pending')
  const [queueStream, setQueueStream] = useState<QueueStream>('profile')

  const [reviews, setReviews] = useState<AdminReviewModerationItem[]>(seed.reviews)
  const [artists, setArtists] = useState<AdminArtist[]>(seed.artists)
  const [venues, setVenues] = useState<AdminVenue[]>(seed.venues)
  const [concerts, setConcerts] = useState<AdminConcert[]>(seed.concerts)
  const [accounts, setAccounts] = useState<AdminAccount[]>(seed.accounts)

  const [profileChanges, setProfileChanges] = useState<AdminProfileChangeRequest[]>(() => {
    ensureAdminStoreSeeded()
    return loadProfileChangeRequests()
  })
  const [concertSuggestions, setConcertSuggestions] = useState<AdminConcertSuggestion[]>(() => loadConcertSuggestions())
  const [cities, setCities] = useState<AdminCity[]>(() => loadCities())
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>(() => loadAuditLogs())

  const [artistForm, setArtistForm] = useState({ id: 0, name: '', description: '', photo_url: '' })
  const [venueForm, setVenueForm] = useState({
    id: 0,
    name: '',
    city: '',
    address: '',
    capacity: '0',
    photo_url: '',
  })
  const [cityForm, setCityForm] = useState({ id: 0, name: '', slug: '', timezone: 'Europe/Moscow' })
  const [concertForm, setConcertForm] = useState({
    id: 0,
    title: '',
    date: '',
    venue_id: '0',
    artist_ids: [] as number[],
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
  const [approveDraftText, setApproveDraftText] = useState('')
  const [approveDraftMediaIds, setApproveDraftMediaIds] = useState<string[]>([])

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
      `${venue.name} ${venue.city} ${venue.address} ${venue.capacity}`.toLowerCase().includes(normalizedQuery),
    )
  }, [venueListQuery, venues])
  const filteredAdminConcerts = useMemo(() => {
    const normalizedQuery = concertListQuery.trim().toLowerCase()
    if (!normalizedQuery) return concerts

    return concerts.filter((concert) => {
      const venueName = venues.find((venue) => venue.id === concert.venue_id)?.name ?? ''
      const artistNames = concert.artist_ids
        .map((artistId) => artists.find((artist) => artist.id === artistId)?.name ?? '')
        .join(' ')

      return `${concert.title} ${concert.date} ${venueName} ${artistNames}`
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
    setApproveDraftText(review.text)
    setApproveDraftMediaIds((review.media ?? []).map((m) => m.id))
  }

  function closeApproveDraft() {
    setApproveDraftReview(null)
    setApproveDraftText('')
    setApproveDraftMediaIds([])
  }

  function toggleApproveDraftMedia(id: string, checked: boolean) {
    setApproveDraftMediaIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id]
      }
      return prev.filter((x) => x !== id)
    })
  }

  function applyApproveDraft() {
    if (!approveDraftReview) return

    const nextText = approveDraftText.trim()
    if (!nextText) return

    const keep = new Set(approveDraftMediaIds)
    const beforeText = approveDraftReview.text
    const beforeCount = approveDraftReview.media?.length ?? 0

    setReviews((prev) =>
      prev.map((item) => {
        if (item.id !== approveDraftReview.id) return item

        const filteredMedia = (item.media ?? []).filter((m) => keep.has(m.id))

        return {
          ...item,
          status: 'approved',
          text: nextText,
          media: filteredMedia.length > 0 ? filteredMedia : undefined,
        }
      }),
    )

    if (currentAdminAccount) {
      const mediaAfter = approveDraftMediaIds.length
      const changed = nextText !== beforeText || mediaAfter !== beforeCount
      writeAudit(
        `Модератор ${currentAdminAccount.displayName} одобрил рецензию #${approveDraftReview.id}${changed ? ' с правками' : ''}.`,
      )
    }

    closeApproveDraft()
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

  function createConcertFromSuggestion(suggestionId: string) {
    const suggestion = concertSuggestions.find((x) => x.id === suggestionId) ?? null
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
      poster_url: '',
    })

    setConcertSuggestions((prev) => prev.map((item) => (item.id === suggestionId ? { ...item, status: 'created' } : item)))
    setConcertSuggestionStatus(suggestionId, 'created')

    if (currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} создал концерт на основе предложения #${suggestionId}.`)
    }

    setTab('concerts')
  }

  function saveCity() {
    if (!cityForm.name.trim() || !cityForm.slug.trim() || !cityForm.timezone.trim()) return

    const next = upsertCity({
      id: cityForm.id ? cityForm.id : undefined,
      name: cityForm.name.trim(),
      slug: cityForm.slug.trim(),
      timezone: cityForm.timezone.trim(),
    })

    setCities(loadCities())

    if (currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} сохранил город «${next.name}».`)
    }

    setCityForm({ id: 0, name: '', slug: '', timezone: 'Europe/Moscow' })
  }

  function deleteCity(id: number) {
    const city = cities.find((x) => x.id === id) ?? null
    removeCity(id)
    setCities(loadCities())

    if (city && currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} удалил город «${city.name}».`)
    }
  }

  function saveArtist() {
    if (!artistForm.name.trim()) return

    setArtists((prev) => {
      if (artistForm.id) {
        return prev.map((item) =>
          item.id === artistForm.id
            ? {
                ...item,
                name: artistForm.name,
                description: artistForm.description,
                photo_url: artistForm.photo_url || null,
              }
            : item,
        )
      }

      const nextId = prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1
      return [
        ...prev,
        {
          id: nextId,
          name: artistForm.name,
          description: artistForm.description,
          photo_url: artistForm.photo_url || null,
        },
      ]
    })

    setArtistForm({ id: 0, name: '', description: '', photo_url: '' })
  }

  function saveVenue() {
    if (!venueForm.name.trim() || !venueForm.city.trim()) return

    const capacity = Number(venueForm.capacity) || 0

    setVenues((prev) => {
      if (venueForm.id) {
        return prev.map((item) =>
          item.id === venueForm.id
            ? {
                ...item,
                name: venueForm.name,
                city: venueForm.city,
                address: venueForm.address,
                capacity,
                photo_url: venueForm.photo_url || null,
              }
            : item,
        )
      }

      const nextId = prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1
      return [
        ...prev,
        {
          id: nextId,
          name: venueForm.name,
          city: venueForm.city,
          address: venueForm.address,
          capacity,
          photo_url: venueForm.photo_url || null,
        },
      ]
    })

    setVenueForm({ id: 0, name: '', city: '', address: '', capacity: '0', photo_url: '' })
  }

  function saveConcert() {
    if (!concertForm.title.trim()) return

    const venue_id = Number(concertForm.venue_id) || 0

    setConcerts((prev) => {
      if (concertForm.id) {
        return prev.map((item) =>
          item.id === concertForm.id
            ? {
                ...item,
                title: concertForm.title,
                date: concertForm.date,
                venue_id,
                artist_ids: concertForm.artist_ids,
                poster_url: concertForm.poster_url || null,
              }
            : item,
        )
      }

      const nextId = prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1
      return [
        ...prev,
        {
          id: nextId,
          title: concertForm.title,
          date: concertForm.date,
          venue_id,
          artist_ids: concertForm.artist_ids,
          poster_url: concertForm.poster_url || null,
        },
      ]
    })

    setConcertForm({ id: 0, title: '', date: '', venue_id: '0', artist_ids: [], poster_url: '' })
  }

  function removeArtist(id: number) {
    setArtists((prev) => prev.filter((x) => x.id !== id))
    setConcerts((prev) => prev.map((x) => ({ ...x, artist_ids: x.artist_ids.filter((artistId) => artistId !== id) })))

    const artist = artists.find((x) => x.id === id) ?? null
    if (artist && currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} удалил артиста «${artist.name}».`)
    }
  }

  function removeVenue(id: number) {
    setVenues((prev) => prev.filter((x) => x.id !== id))

    const venue = venues.find((x) => x.id === id) ?? null
    if (venue && currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} удалил площадку «${venue.name}».`)
    }
  }

  function removeConcert(id: number) {
    setConcerts((prev) => prev.filter((x) => x.id !== id))

    const concert = concerts.find((x) => x.id === id) ?? null
    if (concert && currentAdminAccount) {
      writeAudit(`Админ ${currentAdminAccount.displayName} удалил концерт «${concert.title}».`)
    }
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
              {concertSuggestions.length > 0 ? (
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
                      {sugg.artist_name} • {sugg.city_name} • {sugg.venue_name} • {formatDateTime(sugg.date)}
                    </p>
                    <div className="adminItemActions">
                      <button
                        type="button"
                        className="settingsBtn primary"
                        disabled={sugg.status !== 'pending'}
                        onClick={() => createConcertFromSuggestion(sugg.id)}
                      >
                        Создать на основе
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

          {visibleModerationReviews.length > 0 ? (
            visibleModerationReviews.map((review) => (
              <article key={review.id} className="adminItemCard">
                <div className="adminItemTop">
                  <p className="adminItemTitle">{review.concert_title}</p>
                  <span className={`adminStatus adminStatus-${review.status}`}>{statusLabel(review.status)}</span>
                </div>

                <p className="adminItemMeta">
                  <Link to={`/users/${encodeURIComponent(review.author_username ?? review.author_name)}`}>{review.author_name}</Link> • {formatDateTime(review.created_at)} • {review.rating_total}
                </p>
                <p className="adminItemPreview">{review.text}</p>

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

                <textarea
                  className="adminTextarea"
                  value={approveDraftText}
                  onChange={(e) => setApproveDraftText(e.target.value)}
                />

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
                  <button type="button" className="settingsBtn primary" onClick={applyApproveDraft} disabled={!approveDraftText.trim()}>
                    Одобрить
                  </button>
                  <button type="button" className="settingsBtn ghost" onClick={closeApproveDraft}>
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
            />
            <textarea
              className="adminTextarea"
              placeholder="Описание"
              value={artistForm.description}
              onChange={(e) => setArtistForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <label className="adminFileLabel">
              Фото артиста
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onMediaPick(e, (value) => setArtistForm((prev) => ({ ...prev, photo_url: value })))}
              />
            </label>
            {artistForm.photo_url && <img className="adminPreviewImage" src={artistForm.photo_url} alt="Превью" />}
            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveArtist}>
                Сохранить
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => setArtistForm({ id: 0, name: '', description: '', photo_url: '' })}
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
            />

            <div className="adminScrollableList">
              {filteredAdminArtists.length > 0 ? (
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
                      >
                        Изменить
                      </button>
                      <button type="button" className="settingsBtn ghost" onClick={() => removeArtist(artist.id)}>
                        Удалить
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
              value={venueForm.city}
              onChange={(e) => setVenueForm((prev) => ({ ...prev, city: e.target.value }))}
            >
              <option value="">Выберите город</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>
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
            <label className="adminFileLabel">
              Фото площадки
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onMediaPick(e, (value) => setVenueForm((prev) => ({ ...prev, photo_url: value })))}
              />
            </label>
            {venueForm.photo_url && <img className="adminPreviewImage" src={venueForm.photo_url} alt="Превью" />}
            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveVenue}>
                Сохранить
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => setVenueForm({ id: 0, name: '', city: '', address: '', capacity: '0', photo_url: '' })}
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

            <div className="adminScrollableList">
              {filteredAdminVenues.length > 0 ? (
                filteredAdminVenues.map((venue) => (
                  <div key={venue.id} className="adminListRow">
                    <div>
                      <p className="adminListTitle">{venue.name}</p>
                      <p className="adminListMeta">
                        {venue.city} • {venue.capacity} чел
                      </p>
                    </div>
                    <div className="adminRowActions">
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() => {
                          if (currentAdminAccount) {
                            writeAudit(`Админ ${currentAdminAccount.displayName} пересчитал статистику площадки «${venue.name}» (мок).`)
                          }
                        }}
                      >
                        Пересчитать
                      </button>
                      <button
                        type="button"
                        className="settingsBtn ghost"
                        onClick={() =>
                          setVenueForm({
                            id: venue.id,
                            name: venue.name,
                            city: venue.city,
                            address: venue.address,
                            capacity: String(venue.capacity),
                            photo_url: venue.photo_url ?? '',
                          })
                        }
                      >
                        Изменить
                      </button>
                      <button type="button" className="settingsBtn ghost" onClick={() => removeVenue(venue.id)}>
                        Удалить
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
                  onClick={() => setConcertForm((prev) => ({ ...prev, artist_ids: [] }))}
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
              <button type="button" className="settingsBtn primary" onClick={saveConcert}>
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

            <div className="adminScrollableList">
              {filteredAdminConcerts.length > 0 ? (
                filteredAdminConcerts.map((concert) => {
                  const venueName = venues.find((venue) => venue.id === concert.venue_id)?.name ?? 'Без площадки'
                  const artistNames = concert.artist_ids
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
                              artist_ids: concert.artist_ids,
                              poster_url: concert.poster_url ?? '',
                            })
                          }
                        >
                          Изменить
                        </button>
                        <button type="button" className="settingsBtn ghost" onClick={() => removeConcert(concert.id)}>
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
              {filteredAdminAccounts.length > 0 ? (
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
            />
            <input
              className="adminInput"
              placeholder="Slug"
              value={cityForm.slug}
              onChange={(e) => setCityForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
            <input
              className="adminInput"
              placeholder="Timezone"
              value={cityForm.timezone}
              onChange={(e) => setCityForm((prev) => ({ ...prev, timezone: e.target.value }))}
            />
            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveCity}>
                Сохранить
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => setCityForm({ id: 0, name: '', slug: '', timezone: 'Europe/Moscow' })}
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard adminListCardScrollable">
            <div className="adminScrollableList">
              {cities.length > 0 ? (
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
                      >
                        Изменить
                      </button>
                      <button type="button" className="settingsBtn ghost" onClick={() => deleteCity(city.id)}>
                        Удалить
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

