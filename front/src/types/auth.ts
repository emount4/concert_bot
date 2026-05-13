export interface AuthResponse {
  user_id: string
  username: string
  access_token: string
  refresh_token: string
}

export interface AuthUser {
  id: string
  username: string
  roleId?: number
  roleName?: string
}

export class AuthServiceError extends Error {
  status?: number
  code?: string
  details?: unknown

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown }) {
    super(message)
    this.name = 'AuthServiceError'
    this.status = options?.status
    this.code = options?.code
    this.details = options?.details
  }
}
