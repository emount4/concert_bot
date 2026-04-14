export type DataSourceMode = 'mock' | 'api'

const rawMode = (import.meta.env.VITE_DATA_SOURCE ?? 'mock').toLowerCase()

export const DATA_SOURCE_MODE: DataSourceMode = rawMode === 'api' ? 'api' : 'mock'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080/api/v1'
