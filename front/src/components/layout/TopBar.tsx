import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'

type SideItem = {
  label: string
  to: string
  icon: 'home' | 'concerts' | 'reviews' | 'artists' | 'venues' | 'about' | 'faq'
}

function SideIcon({ kind }: { kind: SideItem['icon'] }) {
  // Задание 14.1: навигация в виде левой вертикальной полосы с иконками.
  if (kind === 'home') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4.5 11.2 12 5l7.5 6.2V20a1.7 1.7 0 0 1-1.7 1.7h-3.6V14a2.2 2.2 0 0 0-2.2-2.2h0A2.2 2.2 0 0 0 9.8 14v7.7H6.2A1.7 1.7 0 0 1 4.5 20Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

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
        <path
          d="M12 14a3.2 3.2 0 0 0 3.2-3.2V6.2a3.2 3.2 0 0 0-6.4 0v4.6A3.2 3.2 0 0 0 12 14Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M6.8 10.5a5.2 5.2 0 0 0 10.4 0M12 15.7v4.8M8.7 20.5h6.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (kind === 'venues') {
    return (
      <svg className="sideIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 20.5V8.7L12 4l7 4.7v11.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M3.8 20.5h16.4M8.5 20.5v-7h7v7M9 9.5h.01M12 9.5h.01M15 9.5h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
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
      { label: 'Главная', to: '/home', icon: 'home' },
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
