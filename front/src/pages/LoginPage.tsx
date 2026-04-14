import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginWithEmailPassword } from '../utils/authMock'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  // Задание 15.2: страница входа с моковой проверкой email/пароля.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? '/concerts'

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await loginWithEmailPassword({ email, password })
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(redirectTo, { replace: true })
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
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="authField">
            <span>Пароль</span>
            <input
              className="authInput"
              type="password"
              autoComplete="current-password"
              placeholder="Введите пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="authError">{error}</p>}

          <button type="submit" className="authSubmit" disabled={loading}>
            {loading ? 'Проверяем...' : 'Войти'}
          </button>
        </form>

        <p className="authHint">Мок-доступ: demo@concert.bot / demo123</p>

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
