import { create } from 'zustand'
import { removeRefreshToken } from '../api/tokenService'
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

function toUser(response: AuthResponse): AuthUser {
  return {
    id: response.user_id,
    username: response.username,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuth: false,
  isInitializing: false,
  setInitializing: (value) => set({ isInitializing: value }),
  setCredentials: (response) => {
    set({
      user: toUser(response),
      accessToken: response.access_token,
      isAuth: true,
    })
  },
  setAccessToken: (token) => set({ accessToken: token, isAuth: Boolean(token) }),
  purge: () => {
    removeRefreshToken()
    set({
      user: null,
      accessToken: null,
      isAuth: false,
      isInitializing: false,
    })
  },
}))
