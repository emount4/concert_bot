import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TopBar } from './components/layout/TopBar'
import { ConcertsPage } from './pages/ConcertsPage'
import { ArtistsPage } from './pages/ArtistsPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { VenuesPage } from './pages/VenuesPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import { RateConcertPage } from './pages/RateConcertPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { resolveIsAdmin } from './utils/adminAccess'
import { LoginPage } from './pages/LoginPage'
import { isAuthenticated } from './utils/authMock'
import { RegisterPage } from './pages/RegisterPage'
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
  const isAdmin = resolveIsAdmin()
  const loggedIn = isAuthenticated()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className={isAuthPage ? 'appRoot authMode' : 'appRoot'}>
      {!isAuthPage && <TopBar isAdmin={isAdmin} />}
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to={loggedIn ? '/concerts' : '/login'} replace />} />
          <Route path="/login" element={loggedIn ? <Navigate to="/concerts" replace /> : <LoginPage />} />
          <Route
            path="/register"
            element={loggedIn ? <Navigate to="/concerts" replace /> : <RegisterPage />}
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
            path="/users/:displayName"
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

          <Route path="*" element={<Navigate to={loggedIn ? '/concerts' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
