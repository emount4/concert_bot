export type DataSourceMode = 'mock' | 'api'

const rawMode = (import.meta.env.VITE_DATA_SOURCE ?? 'mock').toLowerCase()

export const DATA_SOURCE_MODE: DataSourceMode = rawMode === 'api' ? 'api' : 'mock'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050/api/v1'
