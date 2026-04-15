import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../../api/AppDataProvider'
import { logout } from '../../utils/authMock'
import { resolveIsAdmin } from '../../utils/adminAccess'
import type { AdminAccountRole } from '../../types/admin'

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

function isAdminRole(role: AdminAccountRole | null): boolean {
  return role === 'admin' || role === 'super-admin' || role === 'super_admin'
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

export function Header() {
  // Задание 19.2: фиксированный Header с dropdown профиля и логаутом.
  const { data } = useAppData()
  const navigate = useNavigate()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const displayName = data?.profile?.displayName ?? 'Профиль'
  const avatarUrl = data?.profile?.avatar_url ?? null

  const myUsername = useMemo(() => {
    const handle = data?.profile?.handle
    return handle ? normalizeUsername(handle) : null
  }, [data?.profile?.handle])

  const profileHref = myUsername ? `/profile/${encodeURIComponent(myUsername)}` : '/profile'

  const showAdminPanel = useMemo(() => {
    const role = data?.admin?.accounts?.find((account) => account.is_current)?.role ?? null
    return resolveIsAdmin() || isAdminRole(role)
  }, [data?.admin?.accounts])

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

  function onLogout() {
    setIsOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="appHeader" aria-label="Шапка">
      <div className="appHeaderInner">
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
    </header>
  )
}
