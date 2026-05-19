import { useParams } from 'react-router-dom'
import { ProfileScreen } from './ProfileScreen'

export function ProfilePage() {
  const params = useParams<{ username?: string }>()
  const username = decodeURIComponent(params.username ?? '').trim()

  if (username) {
    return <ProfileScreen kind="user" username={username} />
  }

  return <ProfileScreen kind="me" />
}
