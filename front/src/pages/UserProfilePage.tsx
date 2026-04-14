import { useParams } from 'react-router-dom'
import { ProfileScreen } from './ProfileScreen'

export function UserProfilePage() {
  // Задание 18.4: публичный профиль загружается по username из URL.
  const params = useParams<{ username: string }>()
  const username = decodeURIComponent(params.username ?? '').trim()

  return <ProfileScreen kind="user" username={username} />
}

