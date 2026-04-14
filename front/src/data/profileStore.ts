import type { UserProfile } from '../types/profile'

// Задание 19.3: localStorage-overrides для профиля в mock-режиме (применяются после одобрения модерации).

const PROFILE_OVERRIDES_KEY = 'concert_bot.profile.overrides'

type StoredProfileOverrides = Partial<Pick<UserProfile, 'handle' | 'bio' | 'avatar_url' | 'banner_url'>>

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function loadProfileOverrides(): StoredProfileOverrides {
  return safeReadJson<StoredProfileOverrides>(PROFILE_OVERRIDES_KEY, {})
}

export function saveProfileOverrides(next: StoredProfileOverrides): void {
  safeWriteJson(PROFILE_OVERRIDES_KEY, next)
}

export function setProfileOverride(patch: StoredProfileOverrides): void {
  const prev = loadProfileOverrides()
  saveProfileOverrides({ ...prev, ...patch })
}

export function clearProfileOverrides(): void {
  saveProfileOverrides({})
}

export function applyProfileOverrides(base: UserProfile): UserProfile {
  const overrides = loadProfileOverrides()
  return {
    ...base,
    ...overrides,
  }
}

export function getApprovedUsernameOverride(): string | null {
  const overrides = loadProfileOverrides()
  const handle = overrides.handle
  if (!handle) return null

  const normalized = handle.trim().replace(/^@+/, '')
  return normalized ? normalized : null
}
