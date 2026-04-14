import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAppData } from '../api/AppDataProvider'
import { setDevAdmin } from '../utils/adminAccess'
import type {
  AdminAccount,
  AdminAccountRole,
  AdminArtist,
  AdminConcert,
  AdminReviewModerationItem,
  AdminReviewStatus,
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

type AdminTab = 'moderation' | 'artists' | 'venues' | 'concerts' | 'accounts'
type ModerationStream = 'pending' | 'approved' | 'rejected'

function roleLabel(role: AdminAccountRole): string {
  if (role === 'super-admin') return 'Главный админ'
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

export function AdminPage({ isAdmin }: AdminPageProps) {
  const { data, isLoading, error } = useAppData()

  if (isLoading || !data) {
    return <section className="page"><div className="placeholder">Загрузка данных...</div></section>
  }

  if (error) {
    return <section className="page"><div className="placeholder">{error}</div></section>
  }

  return <AdminPageContent isAdmin={isAdmin} seed={data.admin} />
}

function AdminPageContent({ isAdmin, seed }: AdminPageProps & { seed: AdminSeed }) {
  // Задание 9.1: модальный выбор площадки и артистов для формы концерта.
  const [tab, setTab] = useState<AdminTab>('moderation')
  const [moderationStream, setModerationStream] = useState<ModerationStream>('pending')

  const [reviews, setReviews] = useState<AdminReviewModerationItem[]>(seed.reviews)
  const [artists, setArtists] = useState<AdminArtist[]>(seed.artists)
  const [venues, setVenues] = useState<AdminVenue[]>(seed.venues)
  const [concerts, setConcerts] = useState<AdminConcert[]>(seed.concerts)
  const [accounts, setAccounts] = useState<AdminAccount[]>(seed.accounts)

  const [artistForm, setArtistForm] = useState({ id: 0, name: '', description: '', photo_url: '' })
  const [venueForm, setVenueForm] = useState({
    id: 0,
    name: '',
    city: '',
    address: '',
    capacity: '0',
    photo_url: '',
  })
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
  const canGrantAdmins = currentAdminAccount?.role === 'super-admin'
  const filteredAdminAccounts = useMemo(() => {
    const normalizedQuery = accountListQuery.trim().toLowerCase()
    if (!normalizedQuery) return accounts

    return accounts.filter((account) =>
      `${account.displayName} ${account.handle} ${account.role}`.toLowerCase().includes(normalizedQuery),
    )
  }, [accountListQuery, accounts])

  function markReview(id: number, status: AdminReviewStatus) {
    setReviews((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
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
    if (!venueForm.name.trim()) return

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
  }

  function removeVenue(id: number) {
    setVenues((prev) => prev.filter((x) => x.id !== id))
  }

  function removeConcert(id: number) {
    setConcerts((prev) => prev.filter((x) => x.id !== id))
  }

  function setAccountBanState(id: number, is_banned: boolean) {
    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== id || account.is_current) return account
        return { ...account, is_banned }
      }),
    )
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
      </div>

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
                    onClick={() => markReview(review.id, 'approved')}
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
            <input
              className="adminInput"
              placeholder="Город"
              value={venueForm.city}
              onChange={(e) => setVenueForm((prev) => ({ ...prev, city: e.target.value }))}
            />
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
    </section>
  )
}

export default AdminPage

