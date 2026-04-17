import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'

type SideItem = {
  label: string
  to: string
  icon: 'concerts' | 'reviews' | 'artists' | 'venues' | 'about' | 'faq'
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

  if (kind === 'about') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M12 10.8v6.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 7.7h.01" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'faq') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 18.5h8l3 3v-3.2a3.2 3.2 0 0 0 3-3.2V8a4 4 0 0 0-4-4H7A4 4 0 0 0 3 8v6.3a4.2 4.2 0 0 0 4 4.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M10.2 9.3a2.1 2.1 0 0 1 3.6 1.5c0 1.6-1.8 1.8-1.8 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M12 16.8h.01" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  return null
}

export function TopBar() {
  // Задание 19.1: в сайдбаре остаются только контентные разделы (без профиля/настроек/админки).
  const mainItems = useMemo<SideItem[]>(
    () => [
      { label: 'Концерты', to: '/concerts', icon: 'concerts' },
      { label: 'Рецензии', to: '/reviews', icon: 'reviews' },
      { label: 'Артисты', to: '/artists', icon: 'artists' },
      { label: 'Площадки', to: '/venues', icon: 'venues' },
      { label: 'FAQ', to: '/faq', icon: 'faq' },
      { label: 'О проекте', to: '/about', icon: 'about' },
    ],
    [],
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
    </nav>
  )
}
