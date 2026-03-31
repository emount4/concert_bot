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
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

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

  const navItems = useMemo(
    () => [
      { label: 'Концерты', to: '/concerts' },
      { label: 'Рецензии', to: '/reviews' },
      { label: 'Артисты', to: '/artists' },
      { label: 'Площадки', to: '/venues' },
    ],
    [],
  )

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target
      if (!(t instanceof Node)) return

      if (open && !menuRef.current?.contains(t)) {
        setOpen(false)
      }

      if (mobileOpen && !mobileMenuRef.current?.contains(t)) {
        setMobileOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [mobileOpen, open])

  return (
    <header className="topBar">
      <div className="topBarInner">
        <div className="topBarLeft" ref={mobileMenuRef}>
          <button
            type="button"
            className="burgerBtn"
            aria-label="Открыть меню"
            aria-haspopup="menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="burgerLine" />
            <span className="burgerLine" />
            <span className="burgerLine" />
          </button>

          {mobileOpen && (
            <div className="mobileMenu" role="menu">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'mobileMenuItem active' : 'mobileMenuItem')}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="mobileMenuDivider" />

              {items.map((it) => (
                <button
                  key={it.to}
                  type="button"
                  className="mobileMenuItem asButton"
                  role="menuitem"
                  onClick={() => {
                    setMobileOpen(false)
                    navigate(it.to)
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="tabs" aria-label="Навигация">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
              {item.label}
            </NavLink>
          ))}
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
