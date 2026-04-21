import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppData } from '../../api/AppDataProvider'
import { logout } from '../../utils/authMock'
import { resolveIsAdmin } from '../../utils/adminAccess'
import { useBodyScrollLock } from '../../utils/useBodyScrollLock'
import type { AdminAccountRole } from '../../types/admin'

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

function isAdminRole(role: AdminAccountRole | null): boolean {
  return role === 'admin' || role === 'super-admin' || role === 'super_admin'
}

function resolveSectionTitle(pathname: string): string {
  if (pathname === '/home' || pathname.startsWith('/home/')) return 'Главная'
  if (pathname === '/concerts' || pathname.startsWith('/concerts/')) return 'Концерты'
  if (pathname === '/reviews' || pathname.startsWith('/reviews/')) return 'Рецензии'
  if (pathname === '/artists' || pathname.startsWith('/artists/')) return 'Артисты'
  if (pathname === '/venues' || pathname.startsWith('/venues/')) return 'Площадки'
  if (pathname === '/about' || pathname.startsWith('/about/')) return 'О проекте'
  if (pathname === '/faq' || pathname.startsWith('/faq/')) return 'FAQ'
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'Админ‑панель'
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return 'Настройки'
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return 'Профиль'
  if (pathname === '/users' || pathname.startsWith('/users/')) return 'Профиль'
  return ''
}

function ShieldIcon() {
  return (
    <svg className="profileMenuItemIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5 19 6.6v5.7c0 4.8-3 8.5-7 9.9-4-1.4-7-5.1-7-9.9V6.6L12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.3l2.2 2.2L15.7 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SuggestIcon() {
  return (
    <svg className="suggestConcertBtnIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 12h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Header() {
  // Задание 19.2: фиксированный Header с dropdown профиля и логаутом.
  const { data } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)

  const suggestTitleId = useId()

  const [suggestDraft, setSuggestDraft] = useState({
    artist: '',
    concert: '',
    city: '',
    venue: '',
    date: '',
    link: '',
    note: '',
  })

  const displayName = data?.profile?.displayName ?? 'Профиль'
  const avatarUrl = data?.profile?.avatar_url ?? null

  const myUsername = useMemo(() => {
    const handle = data?.profile?.handle
    return handle ? normalizeUsername(handle) : null
  }, [data?.profile?.handle])

  const profileHref = myUsername ? `/profile/${encodeURIComponent(myUsername)}` : '/profile'

  const sectionTitle = useMemo(() => resolveSectionTitle(location.pathname), [location.pathname])

  const showAdminPanel = useMemo(() => {
    const role = data?.admin?.accounts?.find((account) => account.is_current)?.role ?? null
    return resolveIsAdmin() || isAdminRole(role)
  }, [data?.admin?.accounts])

  useBodyScrollLock(isSuggestOpen)

  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current
      if (!root) return
      if (event.target instanceof Node && !root.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isSuggestOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSuggestOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSuggestOpen])

  function onLogout() {
    setIsOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  function openSuggestModal() {
    setIsOpen(false)
    setIsSuggestOpen(true)
  }

  function closeSuggestModal() {
    setIsSuggestOpen(false)
    setSuggestDraft({ artist: '', concert: '', city: '', venue: '', date: '', link: '', note: '' })
  }

  return (
    <header className="appHeader" aria-label="Шапка">
      <div className="appHeaderInner">
        {sectionTitle ? <h2 className="appHeaderSectionTitle">{sectionTitle}</h2> : null}
        <button
          type="button"
          className="suggestConcertBtn"
          aria-label="Предложить концерт"
          onClick={openSuggestModal}
        >
          <SuggestIcon />
          <span>Предложить концерт</span>
        </button>
        <div className="profileMenu" ref={rootRef}>
          <button
            type="button"
            className={isOpen ? 'profileMenuBtn open' : 'profileMenuBtn'}
            aria-label="Открыть меню профиля"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className="profileMenuAvatar" aria-hidden="true">
              {avatarUrl ? (
                <img
                  className="profileMenuAvatarImg"
                  src={avatarUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg className="profileMenuAvatarFallback" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M5 20.5a7 7 0 0 1 14 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
          </button>

          {isOpen && (
            <div className="profileMenuPopover" role="menu" aria-label="Меню профиля">
              <div className="profileMenuInfo">
                <p className="profileMenuName">{displayName}</p>
              </div>

              <div className="profileMenuDivider" />

              <Link
                to={profileHref}
                className="profileMenuItem"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                Мой профиль
              </Link>
              <Link
                to="/settings"
                className="profileMenuItem"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                Настройки
              </Link>

              {showAdminPanel && (
                <Link
                  to="/admin"
                  className="profileMenuItem admin"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldIcon />
                  Админ‑панель
                </Link>
              )}

              <button type="button" className="profileMenuItem" role="menuitem" onClick={onLogout}>
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>

      {isSuggestOpen && (
        <div
          className="settingsModalBackdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSuggestModal()
          }}
        >
          <div className="settingsModalCard" role="dialog" aria-modal="true" aria-labelledby={suggestTitleId}>
            <div className="settingsModalHeader">
              <h3 className="settingsModalTitle" id={suggestTitleId}>
                Предложить концерт
              </h3>
              <button type="button" className="settingsBtn ghost" onClick={closeSuggestModal}>
                Закрыть
              </button>
            </div>

            <p className="settingsHint">Все поля — свободного ввода. Отправка пока работает как заглушка (без API).</p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                closeSuggestModal()
              }}
            >
              <div className="settingsControl" style={{ width: '100%', maxWidth: 560 }}>
                <input
                  className="settingsInput"
                  type="text"
                  placeholder="Артист"
                  value={suggestDraft.artist}
                  onChange={(e) => setSuggestDraft((prev) => ({ ...prev, artist: e.target.value }))}
                />
                <input
                  className="settingsInput"
                  type="text"
                  placeholder="Концерт / тур / название события"
                  value={suggestDraft.concert}
                  onChange={(e) => setSuggestDraft((prev) => ({ ...prev, concert: e.target.value }))}
                />
                <div className="settingsInline">
                  <input
                    className="settingsInput"
                    type="text"
                    placeholder="Город"
                    value={suggestDraft.city}
                    onChange={(e) => setSuggestDraft((prev) => ({ ...prev, city: e.target.value }))}
                  />
                  <input
                    className="settingsInput"
                    type="text"
                    placeholder="Площадка"
                    value={suggestDraft.venue}
                    onChange={(e) => setSuggestDraft((prev) => ({ ...prev, venue: e.target.value }))}
                  />
                </div>
                <input
                  className="settingsInput"
                  type="text"
                  placeholder="Дата и время (как удобно)"
                  value={suggestDraft.date}
                  onChange={(e) => setSuggestDraft((prev) => ({ ...prev, date: e.target.value }))}
                />
                <input
                  className="settingsInput"
                  type="text"
                  placeholder="Ссылка на афишу / источник"
                  value={suggestDraft.link}
                  onChange={(e) => setSuggestDraft((prev) => ({ ...prev, link: e.target.value }))}
                />
                <textarea
                  className="settingsTextarea"
                  rows={4}
                  placeholder="Комментарий (необязательно)"
                  value={suggestDraft.note}
                  onChange={(e) => setSuggestDraft((prev) => ({ ...prev, note: e.target.value }))}
                />

                <div className="settingsActions">
                  <button type="button" className="settingsBtn ghost" onClick={closeSuggestModal}>
                    Отмена
                  </button>
                  <button type="submit" className="settingsBtn primary">
                    Отправить
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
