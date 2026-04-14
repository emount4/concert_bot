import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'

type TopBarProps = {
  isAdmin: boolean
}

type SideItem = {
  label: string
  to: string
  icon: 'concerts' | 'reviews' | 'artists' | 'venues' | 'settings' | 'profile' | 'admin'
}

function SideIcon({ kind }: { kind: SideItem['icon'] }) {
  // Задание 14.1: навигация в виде левой вертикальной полосы с иконками.
  if (kind === 'concerts') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 7.5h12M6 12h12M6 16.5h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'reviews') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7.5h10M7 11h10M7 14.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 20.5h11l3-3v-12a2 2 0 0 0-2-2h-12a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'artists') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'venues') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 20.5h15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 20.5v-13l5.5-3 5.5 3v13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.5 10.5h5M9.5 13.5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'settings') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.3a3.3 3.3 0 1 0-3.3-3.3 3.3 3.3 0 0 0 3.3 3.3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M19.5 12a7.5 7.5 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L15 3.5h-6l-.3 2.5a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1l.3 2.5h6l.3-2.5a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.6.1-1Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'profile') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12.2a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20.5a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 17.5h11M8 7.5h8M7.5 12.5h9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 20.5h15v-17h-15v17Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export function TopBar({ isAdmin }: TopBarProps) {
  const mainItems = useMemo<SideItem[]>(
    () => [
      { label: 'Концерты', to: '/concerts', icon: 'concerts' },
      { label: 'Рецензии', to: '/reviews', icon: 'reviews' },
      { label: 'Артисты', to: '/artists', icon: 'artists' },
      { label: 'Площадки', to: '/venues', icon: 'venues' },
    ],
    [],
  )

  const secondaryItems = useMemo<SideItem[]>(
    () => [
      { label: 'Мой профиль', to: '/profile', icon: 'profile' },
      { label: 'Настройки', to: '/settings', icon: 'settings' },
      {
        label: isAdmin ? 'Админ‑панель' : 'Админ‑панель (ограничено)',
        to: '/admin',
        icon: 'admin',
      },
    ],
    [isAdmin],
  )

  return (
    <nav className="sideBar" aria-label="Навигация">
      <div className="sideBarGroup" role="list">
        {mainItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'sideBarItem active' : 'sideBarItem')}
            aria-label={item.label}
            role="listitem"
          >
            <SideIcon kind={item.icon} />
            <span className="sideBarLabel">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sideBarGroup sideBarGroupBottom" role="list">
        {secondaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'sideBarItem active' : 'sideBarItem')}
            aria-label={item.label}
            role="listitem"
          >
            <SideIcon kind={item.icon} />
            <span className="sideBarLabel">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
