import { create } from 'zustand'
import { removeRefreshToken } from '../api/tokenService'
import { getRoleFromToken } from '../utils/tokenDecoder'
import type { AuthResponse, AuthUser } from '../types/auth'

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  isAuth: boolean
  isInitializing: boolean
  setInitializing: (value: boolean) => void
  setCredentials: (response: AuthResponse) => void
  setAccessToken: (token: string | null) => void
  purge: () => void
}

const ACCESS_TOKEN_KEY = 'concert_bot.access_token'
const USER_KEY = 'concert_bot.user'

function toUser(response: AuthResponse): AuthUser {
  const role = getRoleFromToken(response.access_token)
  return {
    id: response.user_id,
    username: response.username,
    roleId: role?.roleId,
    roleName: role?.roleName,
  }
}

function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Initialize with stored credentials if available
const storedToken = getStoredAccessToken()
const storedUser = getStoredUser()

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  accessToken: storedToken,
  isAuth: Boolean(storedToken),
  isInitializing: false,
  setInitializing: (value) => set({ isInitializing: value }),
  setCredentials: (response) => {
    const user = toUser(response)
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      // localStorage not available
    }
    set({
      user,
      accessToken: response.access_token,
      isAuth: true,
    })
  },
  setAccessToken: (token) => {
    if (token) {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, token)
      } catch {
        // localStorage not available
      }
    }
    set({ accessToken: token, isAuth: Boolean(token) })
  },
  purge: () => {
    removeRefreshToken()
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      // localStorage not available
    }
    set({
      user: null,
      accessToken: null,
      isAuth: false,
      isInitializing: false,
    })
  },
}))
