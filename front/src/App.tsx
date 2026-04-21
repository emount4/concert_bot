import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import { isAuthenticated } from './utils/authMock'
import { RegisterPage } from './pages/RegisterPage'
import { useAppData } from './api/AppDataProvider'
import './App.css'

type GuardProps = {
  children: React.ReactNode
}

function GuardedRoute({ children }: GuardProps) {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
  }

  return <>{children}</>
}

function App() {
  const location = useLocation()
  const { data } = useAppData()

  // Задание 19.3: доступ к админке определяется ролью (admin/super_admin) с dev-фоллбеком.
  const isAdminRole =
    data?.admin?.accounts?.some(
      (account) =>
        account.is_current && (account.role === 'admin' || account.role === 'super-admin' || account.role === 'super_admin'),
    ) ?? false
  const isAdmin = resolveIsAdmin() || isAdminRole
  const loggedIn = isAuthenticated()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const hideFooter = location.pathname === '/login'

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
          <Route path="/" element={<Navigate to={loggedIn ? '/home' : '/login'} replace />} />
          <Route path="/login" element={loggedIn ? <Navigate to="/home" replace /> : <LoginPage />} />
          <Route
            path="/register"
            element={loggedIn ? <Navigate to="/home" replace /> : <RegisterPage />}
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

          <Route path="*" element={<Navigate to={loggedIn ? '/home' : '/login'} replace />} />
        </Routes>
      </main>

      {!hideFooter && <Footer />}
    </div>
  )
}

export default App
