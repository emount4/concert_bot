import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { TopBar } from './components/layout/TopBar'
import { Header } from './components/layout/Header'
import { BottomTabBar } from './components/layout/BottomTabBar'
import { Footer } from './components/layout/Footer'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { ConcertsPage } from './pages/ConcertsPage'
import { ArtistsPage } from './pages/ArtistsPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { VenuesPage } from './pages/VenuesPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import { RateConcertPage } from './pages/RateConcertPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { AboutPage } from './pages/AboutPage'
import { FaqPage } from './pages/FaqPage'
import { HomePage } from './pages/HomePage'
import { resolveIsAdmin } from './utils/adminAccess'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { useAppData } from './api/AppDataProvider'
import { refresh, tgLogin } from './api/services/authService'
import { useAuthStore } from './store/useAuthStore'
import './App.css'

type GuardProps = {
  children: React.ReactNode
}

function GuardedRoute({ children }: GuardProps) {
  const location = useLocation()
  const isAuth = useAuthStore((state) => state.isAuth)

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
  }

  return <>{children}</>
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data } = useAppData()
  const isAuth = useAuthStore((state) => state.isAuth)
  const isInitializing = useAuthStore((state) => state.isInitializing)
  const [showBootstrap, setShowBootstrap] = useState(false)
  const showTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const shownAtRef = useRef<number | null>(null)
  const setInitializing = useAuthStore((state) => state.setInitializing)
  const setCredentials = useAuthStore((state) => state.setCredentials)
  const purge = useAuthStore((state) => state.purge)

  // Задание 19.3: доступ к админке определяется ролью (admin/super_admin) с dev-фоллбеком.
  const isAdminRole =
    data?.admin?.accounts?.some(
      (account) =>
        account.is_current && (account.role === 'admin' || account.role === 'super-admin' || account.role === 'super_admin'),
    ) ?? false
  const isAdmin = resolveIsAdmin() || isAdminRole
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const hideFooter = location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    const showDelayMs = 150
    const minVisibleMs = 350

    if (isInitializing) {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }

      if (showTimerRef.current === null) {
        showTimerRef.current = window.setTimeout(() => {
          shownAtRef.current = Date.now()
          setShowBootstrap(true)
          showTimerRef.current = null
        }, showDelayMs)
      }

      return
    }

    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }

    if (!showBootstrap) {
      return
    }

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : minVisibleMs
    const remaining = Math.max(minVisibleMs - elapsed, 0)

    hideTimerRef.current = window.setTimeout(() => {
      setShowBootstrap(false)
      hideTimerRef.current = null
    }, remaining)

    return () => {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [isInitializing, showBootstrap])

  useEffect(() => {
    let active = true

    async function bootstrapAuth() {
      try {
        setInitializing(true)
        console.log('[Auth] Starting bootstrap...')

        const initData = window.Telegram?.WebApp?.initData?.trim()
        if (initData) {
          console.log('[Auth] Found initData, attempting tgLogin')
          try {
            const response = await tgLogin({ init_data: initData })
            console.log('[Auth] tgLogin successful')
            if (active) {
              setCredentials(response)
            }
            return
          } catch (error) {
            console.warn('[Auth] tgLogin failed, falling back to refresh token:', error)
          }
        }

        console.log('[Auth] Attempting refresh')
        try {
          const response = await refresh()
          console.log('[Auth] Refresh successful')
          if (active) {
            setCredentials(response)
          }
        } catch (error) {
          console.warn('[Auth] Refresh failed:', error)
          if (active) {
            purge()
            navigate('/login', { replace: true })
          }
        }
      } catch (error) {
        console.error('[Auth] Bootstrap error:', error)
        if (active) {
          purge()
          navigate('/login', { replace: true })
        }
      } finally {
        if (active) {
          console.log('[Auth] Bootstrap complete')
          setInitializing(false)
        }
      }
    }

    // Таймаут 8 секунд для защиты от зависаний
    const timeoutId = window.setTimeout(() => {
      if (active) {
        console.error('[Auth] Bootstrap timeout - too long to complete')
        purge()
        setInitializing(false)
        navigate('/login', { replace: true })
      }
    }, 8000)

    void bootstrapAuth()

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [navigate, purge, setCredentials, setInitializing])

  if (showBootstrap) {
    return (
      <div className="appBootstrap">
        <div className="appBootstrapCard" role="status" aria-live="polite">
          <div className="appBootstrapSpinner" aria-hidden="true" />
          <p className="appBootstrapTitle">Входим в аккаунт...</p>
          <p className="appBootstrapText">Проверяем сессию и обновляем токены.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={isAuthPage ? 'appRoot authMode' : 'appRoot'}>
      <ScrollToTop />
      {!isAuthPage && (
        <>
          <TopBar />
          <Header />
          <BottomTabBar />
        </>
      )}
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to={isAuth ? '/home' : '/login'} replace />} />
          <Route path="/login" element={isAuth ? <Navigate to="/home" replace /> : <LoginPage />} />
          <Route
            path="/register"
            element={isAuth ? <Navigate to="/home" replace /> : <RegisterPage />}
          />

          <Route
            path="/home"
            element={
              <GuardedRoute>
                <HomePage />
              </GuardedRoute>
            }
          />

          <Route
            path="/concerts"
            element={
              <GuardedRoute>
                <ConcertsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/concerts/:concertId/rate"
            element={
              <GuardedRoute>
                <RateConcertPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <GuardedRoute>
                <ReviewsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/artists"
            element={
              <GuardedRoute>
                <ArtistsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/venues"
            element={
              <GuardedRoute>
                <VenuesPage />
              </GuardedRoute>
            }
          />

          <Route
            path="/about"
            element={
              <GuardedRoute>
                <AboutPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/faq"
            element={
              <GuardedRoute>
                <FaqPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <GuardedRoute>
                <SettingsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <GuardedRoute>
                <ProfilePage />
              </GuardedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <GuardedRoute>
                <ProfilePage />
              </GuardedRoute>
            }
          />
          <Route
            path="/users/:username"
            element={
              <GuardedRoute>
                <UserProfilePage />
              </GuardedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <GuardedRoute>
                <AdminPage isAdmin={isAdmin} />
              </GuardedRoute>
            }
          />

          <Route path="*" element={<Navigate to={isAuth ? '/home' : '/login'} replace />} />
        </Routes>
      </main>

      {!hideFooter && <Footer />}
    </div>
  )
}

export default App
