export type DataSourceMode = 'mock' | 'api'

const rawMode = (import.meta.env.VITE_DATA_SOURCE ?? 'mock').toLowerCase()

export const DATA_SOURCE_MODE: DataSourceMode = rawMode === 'api' ? 'api' : 'mock'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050/api/v1'
export const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL ?? ''
export const REVIEW_MEDIA_MAX_SIZE_MB = Number(import.meta.env.VITE_REVIEW_MEDIA_MAX_SIZE_MB ?? 50)
export const REVIEW_MEDIA_MAX_SIZE_BYTES = REVIEW_MEDIA_MAX_SIZE_MB * 1024 * 1024
