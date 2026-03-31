import { useMemo, useState } from 'react'
import {
  MOCK_ADMIN_ARTISTS,
  MOCK_ADMIN_CONCERTS,
  MOCK_ADMIN_REVIEWS,
  MOCK_ADMIN_VENUES,
} from '../data/mockAdmin'
import { setDevAdmin } from '../utils/adminAccess'
import type {
  AdminArtist,
  AdminConcert,
  AdminReviewModerationItem,
  AdminReviewStatus,
  AdminVenue,
} from '../types/admin'

type AdminPageProps = {
  isAdmin: boolean
}

type AdminTab = 'moderation' | 'artists' | 'venues' | 'concerts'
type ModerationStream = 'pending' | 'approved' | 'rejected'

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
  // Задание 9.1: модальный выбор площадки и артистов для формы концерта.
  const [tab, setTab] = useState<AdminTab>('moderation')
  const [moderationStream, setModerationStream] = useState<ModerationStream>('pending')

  const [reviews, setReviews] = useState<AdminReviewModerationItem[]>(MOCK_ADMIN_REVIEWS)
  const [artists, setArtists] = useState<AdminArtist[]>(MOCK_ADMIN_ARTISTS)
  const [venues, setVenues] = useState<AdminVenue[]>(MOCK_ADMIN_VENUES)
  const [concerts, setConcerts] = useState<AdminConcert[]>(MOCK_ADMIN_CONCERTS)

  const [artistForm, setArtistForm] = useState({ id: 0, name: '', description: '', imageUrl: '' })
  const [venueForm, setVenueForm] = useState({
    id: 0,
    name: '',
    city: '',
    address: '',
    capacity: '0',
    imageUrl: '',
  })
  const [concertForm, setConcertForm] = useState({
    id: 0,
    title: '',
    dateTime: '',
    venueId: '0',
    artistIds: [] as number[],
    bannerImageUrl: '',
  })
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false)
  const [isArtistsModalOpen, setIsArtistsModalOpen] = useState(false)
  const [venueSearchQuery, setVenueSearchQuery] = useState('')
  const [artistSearchQuery, setArtistSearchQuery] = useState('')

  const pendingCount = useMemo(
    () => reviews.filter((review) => review.status === 'pending').length,
    [reviews],
  )
  const approvedCount = useMemo(
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
    () => venues.find((venue) => String(venue.id) === concertForm.venueId) ?? null,
    [concertForm.venueId, venues],
  )
  const selectedArtists = useMemo(
    () => artists.filter((artist) => concertForm.artistIds.includes(artist.id)),
    [artists, concertForm.artistIds],
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
                imageUrl: artistForm.imageUrl || null,
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
          imageUrl: artistForm.imageUrl || null,
        },
      ]
    })

    setArtistForm({ id: 0, name: '', description: '', imageUrl: '' })
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
                imageUrl: venueForm.imageUrl || null,
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
          imageUrl: venueForm.imageUrl || null,
        },
      ]
    })

    setVenueForm({ id: 0, name: '', city: '', address: '', capacity: '0', imageUrl: '' })
  }

  function saveConcert() {
    if (!concertForm.title.trim()) return

    const venueId = Number(concertForm.venueId) || 0

    setConcerts((prev) => {
      if (concertForm.id) {
        return prev.map((item) =>
          item.id === concertForm.id
            ? {
                ...item,
                title: concertForm.title,
                dateTime: concertForm.dateTime,
                venueId,
                artistIds: concertForm.artistIds,
                bannerImageUrl: concertForm.bannerImageUrl || null,
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
          dateTime: concertForm.dateTime,
          venueId,
          artistIds: concertForm.artistIds,
          bannerImageUrl: concertForm.bannerImageUrl || null,
        },
      ]
    })

    setConcertForm({ id: 0, title: '', dateTime: '', venueId: '0', artistIds: [], bannerImageUrl: '' })
  }

  function removeArtist(id: number) {
    setArtists((prev) => prev.filter((x) => x.id !== id))
    setConcerts((prev) => prev.map((x) => ({ ...x, artistIds: x.artistIds.filter((artistId) => artistId !== id) })))
  }

  function removeVenue(id: number) {
    setVenues((prev) => prev.filter((x) => x.id !== id))
  }

  function removeConcert(id: number) {
    setConcerts((prev) => prev.filter((x) => x.id !== id))
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
      artistIds: prev.artistIds.includes(artistId)
        ? prev.artistIds.filter((id) => id !== artistId)
        : [...prev.artistIds, artistId],
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
        <span className="adminBadge">Pending: {pendingCount}</span>
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
      </div>

      {tab === 'moderation' && (
        <section className="adminSection">
          <div className="adminSubTabs" role="tablist" aria-label="Потоки модерации">
            <button
              type="button"
              className={moderationStream === 'pending' ? 'adminSubTab active' : 'adminSubTab'}
              onClick={() => setModerationStream('pending')}
            >
              Новые ({pendingCount})
            </button>
            <button
              type="button"
              className={moderationStream === 'approved' ? 'adminSubTab active' : 'adminSubTab'}
              onClick={() => setModerationStream('approved')}
            >
              Одобренные ({approvedCount})
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
                  <p className="adminItemTitle">{review.concertTitle}</p>
                  <span className={`adminStatus adminStatus-${review.status}`}>{statusLabel(review.status)}</span>
                </div>

                <p className="adminItemMeta">
                  {review.authorName} • {formatDateTime(review.createdAt)} • {review.overallScore}
                </p>
                <p className="adminItemPreview">{review.text}</p>

                <div className="adminItemActions">
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
                onChange={(e) => onMediaPick(e, (value) => setArtistForm((prev) => ({ ...prev, imageUrl: value })))}
              />
            </label>
            {artistForm.imageUrl && <img className="adminPreviewImage" src={artistForm.imageUrl} alt="Превью" />}
            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveArtist}>
                Сохранить
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => setArtistForm({ id: 0, name: '', description: '', imageUrl: '' })}
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard">
            {artists.map((artist) => (
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
                        imageUrl: artist.imageUrl ?? '',
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
            ))}
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
                onChange={(e) => onMediaPick(e, (value) => setVenueForm((prev) => ({ ...prev, imageUrl: value })))}
              />
            </label>
            {venueForm.imageUrl && <img className="adminPreviewImage" src={venueForm.imageUrl} alt="Превью" />}
            <div className="adminItemActions">
              <button type="button" className="settingsBtn primary" onClick={saveVenue}>
                Сохранить
              </button>
              <button
                type="button"
                className="settingsBtn ghost"
                onClick={() => setVenueForm({ id: 0, name: '', city: '', address: '', capacity: '0', imageUrl: '' })}
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard">
            {venues.map((venue) => (
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
                        imageUrl: venue.imageUrl ?? '',
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
            ))}
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
              value={concertForm.dateTime}
              onChange={(e) => setConcertForm((prev) => ({ ...prev, dateTime: e.target.value }))}
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
                    onClick={() => setConcertForm((prev) => ({ ...prev, venueId: '0' }))}
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
                  onClick={() => setConcertForm((prev) => ({ ...prev, artistIds: [] }))}
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
                  onMediaPick(e, (value) => setConcertForm((prev) => ({ ...prev, bannerImageUrl: value })))
                }
              />
            </label>
            {concertForm.bannerImageUrl && (
              <img className="adminPreviewImage" src={concertForm.bannerImageUrl} alt="Превью афиши" />
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
                    dateTime: '',
                    venueId: '0',
                    artistIds: [],
                    bannerImageUrl: '',
                  })
                }
              >
                Очистить
              </button>
            </div>
          </article>

          <article className="adminListCard">
            {concerts.map((concert) => {
              const venueName = venues.find((venue) => venue.id === concert.venueId)?.name ?? 'Без площадки'
              const artistNames = concert.artistIds
                .map((artistId) => artists.find((artist) => artist.id === artistId)?.name)
                .filter(Boolean)
                .join(', ')

              return (
                <div key={concert.id} className="adminListRow">
                  <div>
                    <p className="adminListTitle">{concert.title}</p>
                    <p className="adminListMeta">
                      {formatDateTime(concert.dateTime)} • {venueName}
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
                          dateTime: concert.dateTime,
                          venueId: String(concert.venueId),
                          artistIds: concert.artistIds,
                          bannerImageUrl: concert.bannerImageUrl ?? '',
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
            })}
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
                      const active = String(venue.id) === concertForm.venueId
                      return (
                        <button
                          key={venue.id}
                          type="button"
                          className={active ? 'adminModalOption active' : 'adminModalOption'}
                          onClick={() => {
                            setConcertForm((prev) => ({ ...prev, venueId: String(venue.id) }))
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
                      const active = concertForm.artistIds.includes(artist.id)
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
    </section>
  )
}
