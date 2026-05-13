import { isAxiosError } from 'axios'
import { apiEndpoints } from '../endpoints'
import { authClient, refreshAuthSession } from '../apiClient'
import type { AuthResponse } from '../../types/auth'
import { AuthServiceError } from '../../types/auth'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string
      }
    }
  }
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  init_data?: string
}

export type TgLoginPayload = {
  init_data: string
}

interface ErrorResponse {
  message?: string
  error?: string
}

function getTelegramInitData(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.Telegram?.WebApp?.initData?.trim() || undefined
}

function getErrorMessage(error: AuthServiceError): string {
  // Маппинг типичных сообщений об ошибок к user-friendly версиям
  // Использует regex для поиска по message и code
  const errorPatterns: Array<[RegExp, string]> = [
    // 401 Unauthorized - неверные учетные данные
    [/invalid.*credentials|email.*not.*found|password.*not.*match|password.*incorrect/i, 'Неверный email или пароль'],
    [/unauthorized/i, 'Неверный email или пароль'],

    // 409 Conflict - пользователь уже существует
    [/user.*already.*exist|email.*already.*registered|email.*already.*exist/i, 'Email уже зарегистрирован'],
    [/username.*already.*taken|username.*exist/i, 'Это имя пользователя уже занято'],
    [/telegram.*account.*already.*linked|tg.*already.*linked/i, 'Telegram аккаунт уже привязан'],

    // 400 Bad Request - ошибки валидации
    [/invalid.*email|email.*invalid|email.*format/i, 'Некорректный адрес электронной почты'],
    [/password.*too.*short|password.*minimum|password.*at.*least/i, 'Пароль должен содержать минимум 6 символов'],
    [/password.*too.*weak|password.*strong/i, 'Пароль слишком простой. Используйте прописные и строчные буквы, цифры'],
    [/invalid.*username|username.*invalid|username.*format/i, 'Некорректное имя пользователя. Используйте буквы, цифры и подчеркивание'],
    [/init_data.*empty|init_data.*invalid|init_data.*expired/i, 'Некорректные данные Telegram'],
    [/invalid.*refresh_token|refresh_token.*invalid|refresh_token.*expired/i, 'Сессия истекла. Пожалуйста, войдите снова'],

    // 401 Unauthorized - другие случаи
    [/token.*expired|session.*expired/i, 'Сессия истекла. Пожалуйста, войдите снова'],
    [/invalid.*token/i, 'Сессия истекла. Пожалуйста, войдите снова'],
    [/email.*not.*verified/i, 'Пожалуйста, подтвердите ваш email'],
    [/account.*disabled|account.*deactivated/i, 'Аккаунт отключен. Свяжитесь с поддержкой'],
    [/account.*banned|user.*banned/i, 'Аккаунт заблокирован'],
    [/telegram.*not.*linked|tg.*not.*linked|no.*telegram/i, 'Telegram аккаунт не привязан'],
    [/invalid.*telegram|telegram.*invalid|telegram.*signature/i, 'Некорректные данные Telegram'],

    // 429 Too Many Requests
    [/too.*many.*attempt|rate.*limit|throttle/i, 'Слишком много попыток входа. Попробуйте позже'],

    // 500+ Server errors
    [/internal.*error|server.*error/i, 'Ошибка сервера. Попробуйте позже'],
  ]

  // Проверяем message и code на совпадение с паттернами
  const fullText = `${error.message || ''} ${error.code || ''}`.toLowerCase()

  for (const [pattern, message] of errorPatterns) {
    if (pattern.test(fullText)) {
      return message
    }
  }

  // Fallback по HTTP статус коду
  switch (error.status) {
    case 400:
      return error.message || 'Ошибка валидации данных'
    case 401:
      return error.message || 'Неверный email или пароль'
    case 403:
      return error.message || 'Доступ запрещен'
    case 404:
      return error.message || 'Ресурс не найден'
    case 409:
      return error.message || 'Пользователь уже существует'
    case 429:
      return 'Слишком много попыток входа. Попробуйте позже'
    case 500:
      return 'Ошибка сервера. Попробуйте позже'
    case 503:
      return 'Сервис временно недоступен. Попробуйте позже'
    default:
      return error.message || 'Ошибка аутентификации'
  }
}

function toAuthError(error: unknown): AuthServiceError {
  if (error instanceof AuthServiceError) return error

  if (isAxiosError(error)) {
    const axiosError = error as typeof error & {
      response?: { status?: number; data?: ErrorResponse }
    }

    const data = axiosError.response?.data
    const status = axiosError.response?.status

    // Обработка CORS-ошибки (plain text ответ с 403)
    if (status === 403 && typeof data !== 'object') {
      const authError = new AuthServiceError('Доступ запрещен', {
        status: 403,
        code: 'cors_error',
      })
      return authError
    }

    // Для обычных ошибок используем message и error из response
    // В бэке все ошибки отдаются как JSON { message, error }
    const message = data?.message || data?.error || axiosError.message || 'Auth request failed'
    const authError = new AuthServiceError(message, {
      status,
      code: data?.error, // Используем error как код для маппинга
    })

    // Переопределяем message на user-friendly версию
    authError.message = getErrorMessage(authError)
    return authError
  }

  return new AuthServiceError(error instanceof Error ? error.message : 'Auth request failed')
}

async function requestAuth<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    const response = await request
    return response.data
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return requestAuth(authClient.post<AuthResponse>(apiEndpoints.auth.login, payload))
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const initData = getTelegramInitData()
  return requestAuth(
    authClient.post<AuthResponse>(apiEndpoints.auth.register, {
      ...payload,
      ...(initData ? { init_data: initData } : {}),
    }),
  )
}

export async function tgLogin(payload?: TgLoginPayload): Promise<AuthResponse> {
  const initData = payload?.init_data ?? getTelegramInitData()
  if (!initData) {
    throw new AuthServiceError('Telegram initData not found')
  }

  return requestAuth(
    authClient.post<AuthResponse>(apiEndpoints.auth.tgLogin, {
      init_data: initData,
    }),
  )
}

export async function refresh(): Promise<AuthResponse> {
  try {
    console.log('[authService] Attempting to refresh token (shared)')
    const nextAuth = await refreshAuthSession()
    console.log('[authService] Token refresh successful')
    return nextAuth
  } catch (error) {
    console.warn('[authService] Token refresh failed:', error)
    throw toAuthError(error)
  }
}

export async function logout(): Promise<void> {
  try {
    await authClient.post(apiEndpoints.auth.logout)
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function tgLink(payload: TgLoginPayload): Promise<void> {
  try {
    await authClient.post(apiEndpoints.auth.tgLink, {
      init_data: payload.init_data,
    })
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function tgUnlink(): Promise<void> {
  try {
    await authClient.delete(apiEndpoints.auth.tgLink)
  } catch (error) {
    throw toAuthError(error)
  }
}
