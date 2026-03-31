// Задание 8.1: типы админ-панели (модерация и CRUD сущностей).

export type AdminReviewStatus = 'pending' | 'approved' | 'rejected'

export type AdminReviewAttachment = {
  id: string
  type: 'image' | 'video'
  url: string
}

export type AdminReviewModerationItem = {
  id: number
  authorName: string
  concertTitle: string
  createdAt: string
  overallScore: number
  status: AdminReviewStatus
  text: string
  media?: AdminReviewAttachment[]
}

export type AdminArtist = {
  id: number
  name: string
  description: string
  imageUrl: string | null
}

export type AdminVenue = {
  id: number
  name: string
  city: string
  address: string
  capacity: number
  imageUrl: string | null
}

export type AdminConcert = {
  id: number
  title: string
  dateTime: string
  venueId: number
  artistIds: number[]
  bannerImageUrl: string | null
}

export type AdminAccountRole = 'user' | 'admin' | 'super-admin'

export type AdminAccount = {
  id: number
  displayName: string
  handle: string
  role: AdminAccountRole
  isBanned: boolean
  isCurrent: boolean
}
