import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMockVerificationCodeHint, registerWithEmail, verifyEmailCode } from '../utils/authMock'

export function RegisterPage() {
  // Задание 15.5: регистрация и подтверждение email кодом на моках.
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isTermsAccepted, setIsTermsAccepted] = useState(false)
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  async function onRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== passwordRepeat) {
      setError('Пароли не совпадают.')
      return
    }

    if (!isTermsAccepted) {
      setError('Нужно согласиться с пользовательским соглашением и политикой конфиденциальности.')
      return
    }

    setLoading(true)
    const result = await registerWithEmail({ displayName, email, password })
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setStep('verify')
  }

  async function onVerifySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await verifyEmailCode({ email, code })
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate('/concerts', { replace: true })
  }

  return (
    <section className="authPage">
      <article className="authCard">
        <h1 className="authTitle">Регистрация</h1>

        {step === 'register' ? (
          <>
            <p className="authSubtitle">Создайте аккаунт, затем подтвердите email кодом из 6 цифр.</p>

            <form className="authForm" onSubmit={onRegisterSubmit}>
              <label className="authField">
                <span>Имя</span>
                <input
                  className="authInput"
                  type="text"
                  autoComplete="name"
                  placeholder="Ваше имя"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>

              <label className="authField">
                <span>Email</span>
                <input
                  className="authInput"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="authField">
                <span>Пароль</span>
                <input
                  className="authInput"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <label className="authField">
                <span>Повторите пароль</span>
                <input
                  className="authInput"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Повторите пароль"
                  value={passwordRepeat}
                  onChange={(event) => setPasswordRepeat(event.target.value)}
                />
              </label>

              <label className="authConsent">
                <input
                  type="checkbox"
                  checked={isTermsAccepted}
                  onChange={(event) => setIsTermsAccepted(event.target.checked)}
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

              {error && <p className="authError">{error}</p>}

              <button type="submit" className="authSubmit" disabled={loading}>
                {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="authSubtitle">Введите код подтверждения, отправленный на {email}.</p>

            <form className="authForm" onSubmit={onVerifySubmit}>
              <label className="authField">
                <span>Код подтверждения</span>
                <input
                  className="authInput"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 цифр"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </label>

              {error && <p className="authError">{error}</p>}

              <button type="submit" className="authSubmit" disabled={loading}>
                {loading ? 'Проверяем код...' : 'Подтвердить email'}
              </button>
            </form>

            <p className="authHint">Мок-код подтверждения: {getMockVerificationCodeHint()}</p>
          </>
        )}

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
