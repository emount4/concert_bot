import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/services/authService'
import { useAuthStore } from '../store/useAuthStore'

type LocationState = {
  from?: {
    pathname?: string
  }
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Email обязателен'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Некорректный email'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Пароль обязателен'
  return null
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const setCredentials = useAuthStore((state) => state.setCredentials)
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? '/concerts'

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError

    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await login({ email: email.trim(), password })
      setCredentials(response)
      navigate(redirectTo, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="authPage">
      <article className="authCard">
        <h1 className="authTitle">Вход</h1>
        <p className="authSubtitle">Войдите, чтобы продолжить работу с приложением.</p>

        <form className="authForm" onSubmit={onSubmit}>
          <label className="authField">
            <span>Email</span>
            <input
              className="authInput"
              type="email"
              autoComplete="email"
              placeholder="demo@concert.bot"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
              }}
            />
            {fieldErrors.email && <p className="authError">{fieldErrors.email}</p>}
          </label>

          <label className="authField">
            <span>Пароль</span>
            <input
              className="authInput"
              type="password"
              autoComplete="current-password"
              placeholder="Введите пароль"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
              }}
            />
            {fieldErrors.password && <p className="authError">{fieldErrors.password}</p>}
          </label>

          {error && <p className="authError">{error}</p>}

          <button type="submit" className="authSubmit" disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="authSwitchRow">
          Нет аккаунта?{' '}
          <Link to="/register" className="authLink">
            Зарегистрироваться
          </Link>
        </p>
      </article>
    </section>
  )
}
