import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/services/authService'
import { useAuthStore } from '../store/useAuthStore'

function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Email обязателен'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Некорректный email'
  return null
}

function validateUsername(username: string): string | null {
  const trimmed = username.trim()
  if (!trimmed) return 'Имя пользователя обязательно'
  if (trimmed.length < 3) return 'Имя должно содержать минимум 3 символа'
  if (trimmed.length > 20) return 'Имя должно содержать максимум 20 символов'
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Только буквы, цифры и подчеркивание'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Пароль обязателен'
  if (password.length < 6) return 'Пароль должен содержать минимум 6 символов'
  return null
}

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const setCredentials = useAuthStore((state) => state.setCredentials)
  const navigate = useNavigate()

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    const usernameError = validateUsername(username)
    if (usernameError) errors.username = usernameError

    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError

    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError

    if (password !== passwordRepeat) {
      errors.passwordRepeat = 'Пароли не совпадают'
    }

    if (!isTermsAccepted) {
      errors.terms = 'Нужно согласиться с условиями'
    }

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
      const response = await register({ username: username.trim(), email: email.trim(), password })
      setCredentials(response)
      navigate('/concerts', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось зарегистрироваться')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="authPage">
      <article className="authCard">
        <h1 className="authTitle">Регистрация</h1>
        <p className="authSubtitle">Создайте аккаунт и сразу войдите в приложение.</p>

        <form className="authForm" onSubmit={onSubmit}>
          <label className="authField">
            <span>Имя пользователя</span>
            <input
              className="authInput"
              type="text"
              autoComplete="username"
              placeholder="Ваше имя пользователя"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: '' })
              }}
            />
            {fieldErrors.username && <p className="authError">{fieldErrors.username}</p>}
          </label>

          <label className="authField">
            <span>Email</span>
            <input
              className="authInput"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
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
              autoComplete="new-password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
              }}
            />
            {fieldErrors.password && <p className="authError">{fieldErrors.password}</p>}
          </label>

          <label className="authField">
            <span>Повторите пароль</span>
            <input
              className="authInput"
              type="password"
              autoComplete="new-password"
              placeholder="Повторите пароль"
              value={passwordRepeat}
              onChange={(event) => {
                setPasswordRepeat(event.target.value)
                if (fieldErrors.passwordRepeat) setFieldErrors({ ...fieldErrors, passwordRepeat: '' })
              }}
            />
            {fieldErrors.passwordRepeat && <p className="authError">{fieldErrors.passwordRepeat}</p>}
          </label>

          <label className="authConsent">
            <input
              type="checkbox"
              checked={isTermsAccepted}
              onChange={(event) => {
                setIsTermsAccepted(event.target.checked)
                if (fieldErrors.terms) setFieldErrors({ ...fieldErrors, terms: '' })
              }}
            />
            <span>
              Согласен с{' '}
              <a href="/terms.html" target="_blank" rel="noreferrer" className="authLink">
                пользовательским соглашением
              </a>{' '}
              и{' '}
              <a href="/privacy.html" target="_blank" rel="noreferrer" className="authLink">
                политикой конфиденциальности
              </a>
              .
            </span>
          </label>
          {fieldErrors.terms && <p className="authError">{fieldErrors.terms}</p>}

          {error && <p className="authError">{error}</p>}

          <button type="submit" className="authSubmit" disabled={loading}>
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="authSwitchRow">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="authLink">
            Войти
          </Link>
        </p>
      </article>
    </section>
  )
}
