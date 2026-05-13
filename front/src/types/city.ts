export type City = {
  city_id: number
  name: string
  slug: string
  timezone: string
  created_at: string
}

export type CreateCityPayload = {
  name: string
  slug?: string
  timezone: string
}

export type UpdateCityPayload = {
  name?: string
  slug?: string
  timezone?: string
}
