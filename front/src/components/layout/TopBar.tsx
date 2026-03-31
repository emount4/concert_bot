import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

type TopBarProps = {
  isAdmin: boolean
}

type MenuItem = {
  label: string
  to: string
}

export function TopBar({ isAdmin }: TopBarProps) {
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const items = useMemo(() => {
    const base: MenuItem[] = [
      { label: 'Настройки', to: '/settings' },
      { label: 'Мой профиль', to: '/profile' },
      {
        label: isAdmin ? 'Админ‑панель' : 'Админ‑панель (ограничено)',
        to: '/admin',
      },
    ]

    return base
  }, [isAdmin])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!open) return
      const t = e.target
      if (!(t instanceof Node)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  return (
    <header className="topBar">
      <div className="topBarInner">
        <div className="topBarLeft" aria-hidden="true" />

        <nav className="tabs" aria-label="Навигация">
          <NavLink to="/concerts" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Концерты
          </NavLink>
          <NavLink to="/reviews" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Рецензии
          </NavLink>
          <NavLink to="/artists" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Артисты
          </NavLink>
          <NavLink to="/venues" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Площадки
          </NavLink>
        </nav>

        <div className="profile" ref={menuRef}>
          <button
            type="button"
            className="profileBtn"
            aria-label="Профиль"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          />

          {open && (
            <div className="menu" role="menu">
              {items.map((it) => (
                <button
                  key={it.to}
                  type="button"
                  className="menuItem"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    navigate(it.to)
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
