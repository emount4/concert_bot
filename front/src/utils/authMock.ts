const AUTH_KEY = 'concert_bot.auth'
const USERS_KEY = 'concert_bot.users'
const PENDING_KEY = 'concert_bot.pending_registration'

const DEMO_EMAIL = 'demo@concert.bot'
const DEMO_PASSWORD = 'demo123'
const DEMO_VERIFICATION_CODE = '123456'

type StoredUser = {
  email: string
  password: string
  displayName: string
}

type PendingRegistration = {
  email: string
  password: string
  displayName: string
  code: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResult =
  | { ok: true }
  | {
      ok: false
      message: string
    }

export type RegisterPayload = {
  displayName: string
  email: string
  password: string
}

export type RegisterResult =
  | { ok: true }
  | {
      ok: false
      message: string
    }

export type VerifyCodePayload = {
  email: string
  code: string
}

export type VerifyCodeResult =
  | { ok: true }
  | {
      ok: false
      message: string
    }

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(USERS_KEY)
  if (!raw) {
    const demoUser: StoredUser = {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: 'Demo User',
    }
    window.localStorage.setItem(USERS_KEY, JSON.stringify([demoUser]))
    return [demoUser]
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[]
    if (Array.isArray(parsed)) return parsed
  } catch {}

  return []
}

function writeUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readPendingRegistration(): PendingRegistration | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(PENDING_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as PendingRegistration
  } catch {
    return null
  }
}

function writePendingRegistration(value: PendingRegistration | null): void {
  if (typeof window === 'undefined') return

  if (!value) {
    window.localStorage.removeItem(PENDING_KEY)
    return
  }

  window.localStorage.setItem(PENDING_KEY, JSON.stringify(value))
}

function looksLikeEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email)
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(AUTH_KEY) === '1'
}

export function logout(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_KEY)
}

export async function loginWithEmailPassword(payload: LoginPayload): Promise<LoginResult> {
  // Задание 15.1: моковая авторизация по email/паролю для страницы входа.
  const email = normalize(payload.email)
  const password = payload.password

  await new Promise((resolve) => window.setTimeout(resolve, 350))

  if (!email || !password) {
    return { ok: false, message: 'Заполните email и пароль.' }
  }

  const users = readUsers()
  const user = users.find((item) => item.email === email)

  if (!user || user.password !== password) {
    return {
      ok: false,
      message: 'Неверные данные. Для мока используйте demo@concert.bot / demo123',
    }
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_KEY, '1')
  }

  return { ok: true }
}

export async function registerWithEmail(payload: RegisterPayload): Promise<RegisterResult> {
  // Задание 15.3: моковая регистрация с отложенным подтверждением по 6-значному коду.
  const displayName = payload.displayName.trim()
  const email = normalize(payload.email)
  const password = payload.password

  await new Promise((resolve) => window.setTimeout(resolve, 350))

  if (!displayName || !email || !password) {
    return { ok: false, message: 'Заполните имя, email и пароль.' }
  }

  if (!looksLikeEmail(email)) {
    return { ok: false, message: 'Некорректный email.' }
  }

  if (password.length < 6) {
    return { ok: false, message: 'Пароль должен быть не короче 6 символов.' }
  }

  const users = readUsers()
  if (users.some((item) => item.email === email)) {
    return { ok: false, message: 'Пользователь с таким email уже существует.' }
  }

  writePendingRegistration({
    email,
    password,
    displayName,
    code: DEMO_VERIFICATION_CODE,
  })

  return { ok: true }
}

export async function verifyEmailCode(payload: VerifyCodePayload): Promise<VerifyCodeResult> {
  // Задание 15.4: подтверждение email по коду из 6 цифр (мок).
  const email = normalize(payload.email)
  const code = payload.code.trim()

  await new Promise((resolve) => window.setTimeout(resolve, 300))

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, message: 'Введите код из 6 цифр.' }
  }

  const pending = readPendingRegistration()
  if (!pending || pending.email !== email) {
    return { ok: false, message: 'Не найдена заявка на подтверждение для этого email.' }
  }

  if (pending.code !== code) {
    return { ok: false, message: 'Неверный код подтверждения.' }
  }

  const users = readUsers()
  if (!users.some((item) => item.email === pending.email)) {
    users.push({
      email: pending.email,
      password: pending.password,
      displayName: pending.displayName,
    })
    writeUsers(users)
  }

  writePendingRegistration(null)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_KEY, '1')
  }

  return { ok: true }
}

export function getMockVerificationCodeHint(): string {
  return DEMO_VERIFICATION_CODE
}
