import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  // Задание: каркас приложения (вкладки + меню профиля). Всё пустое, только шаблон.

  // TODO: позже будем получать это с бэкенда (например, /me). Пока заглушка.
  const isAdmin = false

  return (
    <div className="appRoot">
      <TopBar isAdmin={isAdmin} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/concerts" replace />} />
          <Route path="/concerts" element={<EmptyPage title="Концерты" />} />
          <Route path="/reviews" element={<EmptyPage title="Рецензии" />} />
          <Route path="/artists" element={<EmptyPage title="Артисты" />} />
          <Route path="/venues" element={<EmptyPage title="Площадки" />} />

          <Route path="/settings" element={<EmptyPage title="Настройки" />} />
          <Route path="/profile" element={<EmptyPage title="Мой профиль" />} />
          <Route path="/admin" element={<EmptyPage title="Админ‑панель" />} />

          <Route path="*" element={<Navigate to="/concerts" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

function EmptyPage({ title }: { title: string }) {
  return (
    <section className="page">
      <h1 className="pageTitle">{title}</h1>
      <div className="placeholder">Пока пусто</div>
    </section>
  )
}

function TopBar({ isAdmin }: { isAdmin: boolean }) {
  // Задание: отдельная верхняя панель с вкладками.

  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const items = useMemo(() => {
    const base: Array<{ label: string; to: string; adminOnly?: boolean }> = [
      { label: 'Настройки', to: '/settings' },
      { label: 'Мой профиль', to: '/profile' },
      { label: 'Админ‑панель', to: '/admin', adminOnly: true },
    ]
    return base.filter((x) => !x.adminOnly || isAdmin)
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
