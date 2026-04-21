import { Link, useLocation } from 'react-router-dom'

type TabItem = {
  label: string
  to: string
  icon: 'home' | 'concerts' | 'reviews' | 'artists' | 'profile'
  isActive: (pathname: string) => boolean
}

function TabIcon({ kind }: { kind: TabItem['icon'] }) {
  if (kind === 'home') {
    return (
      <svg className="bottomTabIcon" viewBox="0 0 24 24" aria-hidden="true">
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
      <svg className="bottomTabIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 7.5h12M6 12h12M6 16.5h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (kind === 'reviews') {
    return (
      <svg className="bottomTabIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 7.5h10M7 11h10M7 14.5h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6.5 20.5h11l3-3v-12a2 2 0 0 0-2-2h-12a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (kind === 'artists') {
    return (
      <svg className="bottomTabIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M5.5 20.5a6.5 6.5 0 0 1 13 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg className="bottomTabIcon" viewBox="0 0 24 24" aria-hidden="true">
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
  )
}

function startsWithSegment(pathname: string, segment: string): boolean {
  return pathname === segment || pathname.startsWith(`${segment}/`)
}

export function BottomTabBar() {
  const { pathname } = useLocation()

  const tabs: TabItem[] = [
    { label: 'Главная', to: '/home', icon: 'home', isActive: (path) => startsWithSegment(path, '/home') },
    { label: 'Концерты', to: '/concerts', icon: 'concerts', isActive: (path) => startsWithSegment(path, '/concerts') },
    { label: 'Рецензии', to: '/reviews', icon: 'reviews', isActive: (path) => startsWithSegment(path, '/reviews') },
    { label: 'Артисты', to: '/artists', icon: 'artists', isActive: (path) => startsWithSegment(path, '/artists') },
    {
      label: 'Профиль',
      to: '/profile',
      icon: 'profile',
      isActive: (path) => startsWithSegment(path, '/profile') || startsWithSegment(path, '/settings') || startsWithSegment(path, '/users'),
    },
  ]

  return (
    <nav className="bottomTabBar" aria-label="Нижняя навигация">
      <div className="bottomTabBarInner" role="list">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={active ? 'bottomTabItem active' : 'bottomTabItem'}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.label}
              role="listitem"
            >
              <TabIcon kind={tab.icon} />
              <span className="bottomTabLabel">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
