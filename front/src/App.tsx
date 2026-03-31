import { Navigate, Route, Routes } from 'react-router-dom'
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
import './App.css'

function App() {
  const isAdmin = resolveIsAdmin()

  return (
    <div className="appRoot">
      <TopBar isAdmin={isAdmin} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/concerts" replace />} />
          <Route path="/concerts" element={<ConcertsPage />} />
          <Route path="/concerts/:concertId/rate" element={<RateConcertPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/artists" element={<ArtistsPage />} />
          <Route path="/venues" element={<VenuesPage />} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:displayName" element={<UserProfilePage />} />
          <Route path="/admin" element={<AdminPage isAdmin={isAdmin} />} />

          <Route path="*" element={<Navigate to="/concerts" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
