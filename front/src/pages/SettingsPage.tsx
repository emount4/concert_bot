import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../api/AppDataProvider'
import { enqueueProfileChangeRequest, loadProfileChangeRequests } from '../data/adminStore'
import type { AdminProfileChangeRequest } from '../types/admin'
import { changePasswordMock, deleteAccountMock, getCurrentUserEmail, logout } from '../utils/authMock'
import { useBodyScrollLock } from '../utils/useBodyScrollLock'

type ThemeMode = 'light' | 'dark' | 'system'

function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '')
}

function looksLikeUsername(value: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value)
}

function changeTypeTitle(type: AdminProfileChangeRequest['type']): string {
  if (type === 'username') return 'Смена username'
  if (type === 'bio') return 'Обновление bio'
  if (type === 'banner') return 'Смена баннера'
  return 'Смена аватара'
}

function moderationStatusRu(status: AdminProfileChangeRequest['status']): string {
  if (status === 'pending') return 'на проверке'
  if (status === 'approved') return 'одобрено'
  return 'отклонено'
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

function moderationHint() {
  return <span className="settingsBadge">Изменения вступят в силу после модерации</span>
}

export function SettingsPage() {
  // Задание 7.2: страница настроек в 5 блоков (профиль/безопасность/UX/приватность/юридическое) на моках.
  const { data, isLoading, error } = useAppData()
  const navigate = useNavigate()

  const profile = data?.profile ?? null
  const currentEmail = useMemo(() => getCurrentUserEmail() ?? 'demo@concert.bot', [])

  const [profileChangeRequests, setProfileChangeRequests] = useState<AdminProfileChangeRequest[]>([])

  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false)

  useBodyScrollLock(isModerationModalOpen)

  const initialUsername = useMemo(() => normalizeUsername(profile?.handle ?? ''), [profile?.handle])
  const initialBio = useMemo(() => profile?.bio ?? '', [profile?.bio])

  const [usernameDraft, setUsernameDraft] = useState(initialUsername)
  const [usernameCheck, setUsernameCheck] = useState<
    | { state: 'idle' }
    | { state: 'checking' }
    | { state: 'available' }
    | { state: 'taken' }
    | { state: 'invalid'; message: string }
  >({ state: 'idle' })

  const [bioDraft, setBioDraft] = useState(initialBio)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)

  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [language, setLanguage] = useState<'ru'>('ru')

  const [telegramUsername, setTelegramUsername] = useState<string | null>(null)
  const [telegramBusy, setTelegramBusy] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null)
  const [passwordBusy, setPasswordBusy] = useState(false)

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setUsernameDraft(initialUsername)
    setBioDraft(initialBio)

    if (!profile) {
      setProfileChangeRequests([])
      return
    }

    const byDisplayName = loadProfileChangeRequests().filter((req) => req.requested_by_displayName === profile.displayName)
    setProfileChangeRequests(byDisplayName)
  }, [initialUsername, initialBio])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(avatarFile)
    setAvatarPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(bannerFile)
    setBannerPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [bannerFile])

  useEffect(() => {
    if (!isModerationModalOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsModerationModalOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModerationModalOpen])

  async function checkUsernameUnique() {
    // Задание 7.3: проверка уникальности username (мок).
    const normalized = normalizeUsername(usernameDraft)
    setUsernameDraft(normalized)

    if (!normalized) {
      setUsernameCheck({ state: 'invalid', message: 'Введите username.' })
      return
    }

    if (!looksLikeUsername(normalized)) {
      setUsernameCheck({
        state: 'invalid',
        message: 'Допустимы латиница, цифры и _, длина 3–20.',
      })
      return
    }

    setUsernameCheck({ state: 'checking' })
    await new Promise((resolve) => window.setTimeout(resolve, 450))

    const taken = new Set(['admin', 'support', 'concert_bot', 'root', 'moderator'])
    if (normalized === initialUsername) {
      setUsernameCheck({ state: 'available' })
      return
    }

    setUsernameCheck(taken.has(normalized.toLowerCase()) ? { state: 'taken' } : { state: 'available' })
  }

  function submitUsernameChange() {
    const normalized = normalizeUsername(usernameDraft)
    if (!looksLikeUsername(normalized)) {
      setUsernameCheck({
        state: 'invalid',
        message: 'Сначала введите корректный username (латиница/цифры/_).',
      })
      return
    }

    if (usernameCheck.state !== 'available') {
      return
    }

    if (!profile) return

    enqueueProfileChangeRequest({
      requested_by_username: normalizeUsername(profile.handle),
      requested_by_displayName: profile.displayName,
      type: 'username',
      old_username: initialUsername,
      new_username: normalized,
    })
    setProfileChangeRequests(loadProfileChangeRequests().filter((req) => req.requested_by_displayName === profile.displayName))
  }

  function submitBioChange() {
    if (!bioDraft.trim()) {
      return
    }

    if (!profile) return

    enqueueProfileChangeRequest({
      requested_by_username: normalizeUsername(profile.handle),
      requested_by_displayName: profile.displayName,
      type: 'bio',
      old_bio: initialBio,
      new_bio: bioDraft,
    })
    setProfileChangeRequests(loadProfileChangeRequests().filter((req) => req.requested_by_displayName === profile.displayName))
  }

  async function submitAvatarChange() {
    if (!avatarFile) return
    if (!profile) return

    const dataUrl = await fileToDataUrl(avatarFile)
    enqueueProfileChangeRequest({
      requested_by_username: normalizeUsername(profile.handle),
      requested_by_displayName: profile.displayName,
      type: 'avatar',
      old_avatar_url: profile.avatar_url,
      new_avatar_url: dataUrl,
    })
    setProfileChangeRequests(loadProfileChangeRequests().filter((req) => req.requested_by_displayName === profile.displayName))
  }

  async function submitBannerChange() {
    if (!bannerFile) return
    if (!profile) return

    const dataUrl = await fileToDataUrl(bannerFile)
    enqueueProfileChangeRequest({
      requested_by_username: normalizeUsername(profile.handle),
      requested_by_displayName: profile.displayName,
      type: 'banner',
      old_banner_url: profile.banner_url ?? null,
      new_banner_url: dataUrl,
    })
    setProfileChangeRequests(loadProfileChangeRequests().filter((req) => req.requested_by_displayName === profile.displayName))
  }

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function onChangePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Задание 7.4: смена пароля (мок), как техническое ядро.
    event.preventDefault()
    setPasswordStatus(null)
    setPasswordBusy(true)

    const result = await changePasswordMock({ oldPassword, newPassword, newPasswordRepeat })
    setPasswordBusy(false)

    if (!result.ok) {
      setPasswordStatus(result.message)
      return
    }

    setOldPassword('')
    setNewPassword('')
    setNewPasswordRepeat('')
    setPasswordStatus('Пароль обновлён (мок).')
  }

  async function onBindTelegram() {
    // Задание 7.5: привязка Telegram (мок), без реального Mini App/бота.
    setTelegramBusy(true)
    await new Promise((resolve) => window.setTimeout(resolve, 500))
    setTelegramUsername('@mock_user')
    setTelegramBusy(false)
  }

  async function onUnbindTelegram() {
    // Задание 7.6: отвязка Telegram (мок) с предупреждением.
    const ok = window.confirm('Отвязать Telegram? Быстрый вход перестанет работать.')
    if (!ok) return
    setTelegramBusy(true)
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    setTelegramUsername(null)
    setTelegramBusy(false)
  }

  async function onDeleteAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Задание 7.7: удаление аккаунта (мок) с подтверждением паролем.
    event.preventDefault()
    setDeleteError(null)

    if (!deleteConfirm) {
      setDeleteError('Подтвердите необратимость действия.')
      return
    }

    setDeleteBusy(true)
    const result = await deleteAccountMock({ password: deletePassword })
    setDeleteBusy(false)

    if (!result.ok) {
      setDeleteError(result.message)
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Настройки</h1>

      {isLoading && <p className="settingsSummary">Загружаем данные...</p>}
      {error && <p className="settingsError">{error}</p>}

      {!isLoading && !error && (
        <div className="settingsLayout">
          <article className="settingsCard settingsCardWide">
            <h2 className="settingsCardTitle">Публичный профиль (модерируемый)</h2>
            <p className="settingsCardHint">Изменения в публичном профиле применяются после проверки админом.</p>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Username</p>
                <p className="settingDescription">Смена ника с проверкой уникальности. {moderationHint()}</p>
              </div>

              <div className="settingsControl">
                <div className="settingsInline">
                  <input
                    className="settingsInput"
                    type="text"
                    inputMode="text"
                    placeholder="например: mark_reviews"
                    value={usernameDraft}
                    onChange={(e) => {
                      setUsernameDraft(e.target.value)
                      setUsernameCheck({ state: 'idle' })
                    }}
                  />
                  <button type="button" className="settingsBtn ghost" onClick={checkUsernameUnique}>
                    Проверить
                  </button>
                </div>

                {usernameCheck.state === 'checking' && <p className="settingsHint">Проверяем...</p>}
                {usernameCheck.state === 'available' && <p className="settingsOk">Ник свободен.</p>}
                {usernameCheck.state === 'taken' && <p className="settingsError">Ник занят.</p>}
                {usernameCheck.state === 'invalid' && <p className="settingsError">{usernameCheck.message}</p>}

                <button
                  type="button"
                  className="settingsBtn primary"
                  onClick={submitUsernameChange}
                  disabled={usernameCheck.state !== 'available'}
                >
                  Отправить на модерацию
                </button>
              </div>
            </div>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Bio / Описание</p>
                <p className="settingDescription">Короткий текст о себе. {moderationHint()}</p>
              </div>

              <div className="settingsControl">
                <textarea
                  className="settingsTextarea"
                  rows={4}
                  placeholder="Напишите пару слов о себе"
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                />
                <button type="button" className="settingsBtn primary" onClick={submitBioChange} disabled={!bioDraft.trim()}>
                  Отправить на модерацию
                </button>
              </div>
            </div>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Аватарка</p>
                <p className="settingDescription">Загрузка в S3 (мок) с превью старой → новой. {moderationHint()}</p>
              </div>

              <div className="settingsControl">
                <div className="settingsMediaRow">
                  <div className="settingsMediaPreview settingsMediaPreviewAvatar">
                    {avatarPreviewUrl ? (
                      <img className="settingsAvatarImg" src={avatarPreviewUrl} alt="Новая аватарка" />
                    ) : profile?.avatar_url ? (
                      <img className="settingsAvatarImg" src={profile.avatar_url} alt="Текущая аватарка" />
                    ) : (
                      <div className="settingsMediaPlaceholder">Нет</div>
                    )}
                  </div>

                  <label className="settingsBtn ghost">
                    Выбрать файл
                    <input
                      className="settingsFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <button type="button" className="settingsBtn primary" onClick={submitAvatarChange} disabled={!avatarFile}>
                  Загрузить (на модерацию)
                </button>
              </div>
            </div>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Баннер профиля</p>
                <p className="settingDescription">Широкое изображение для шапки профиля. {moderationHint()}</p>
              </div>

              <div className="settingsControl">
                <div className="settingsMediaRow">
                  <div className="settingsMediaPreview settingsMediaPreviewBanner">
                    {bannerPreviewUrl ? (
                      <img className="settingsBannerImg" src={bannerPreviewUrl} alt="Новый баннер" />
                    ) : profile?.banner_url ? (
                      <img className="settingsBannerImg" src={profile.banner_url} alt="Текущий баннер" />
                    ) : (
                      <div className="settingsMediaPlaceholder">Нет</div>
                    )}
                  </div>

                  <label className="settingsBtn ghost">
                    Выбрать файл
                    <input
                      className="settingsFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <button type="button" className="settingsBtn primary" onClick={submitBannerChange} disabled={!bannerFile}>
                  Загрузить (на модерацию)
                </button>
              </div>
            </div>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Статус модерации</p>
                <p className="settingDescription">Текущие заявки на изменение данных профиля.</p>
              </div>

              <div className="settingsControl">
                <div className="settingsInline settingsInlineWide">
                  <p className="settingsHint">Заявок: {profileChangeRequests.length}</p>
                  <button type="button" className="settingsBtn ghost" onClick={() => setIsModerationModalOpen(true)}>
                    Открыть
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article className="settingsCard settingsCardWide">
            <h2 className="settingsCardTitle">Аккаунт и безопасность</h2>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Email</p>
                <p className="settingDescription">Только чтение (MVP).</p>
              </div>
              <div className="settingsControl">
                <input className="settingsInput" type="email" value={currentEmail} readOnly />
              </div>
            </div>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Смена пароля</p>
                <p className="settingDescription">Старый пароль → новый → повтор.</p>
              </div>

              <div className="settingsControl">
                <form className="settingsForm" onSubmit={onChangePasswordSubmit}>
                  <input
                    className="settingsInput"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Старый пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <input
                    className="settingsInput"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Новый пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    className="settingsInput"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Повторите новый пароль"
                    value={newPasswordRepeat}
                    onChange={(e) => setNewPasswordRepeat(e.target.value)}
                  />

                  {passwordStatus && (
                    <p className={passwordStatus.includes('обновл') ? 'settingsOk' : 'settingsError'}>{passwordStatus}</p>
                  )}

                  <button type="submit" className="settingsBtn primary" disabled={passwordBusy}>
                    {passwordBusy ? 'Сохраняем...' : 'Обновить пароль'}
                  </button>
                </form>
              </div>
            </div>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Привязка Telegram</p>
                <p className="settingDescription">
                  Для MVP — мок. В проде здесь будет открытие Mini App или ссылка на бота.
                </p>
              </div>

              <div className="settingsControl">
                {!telegramUsername ? (
                  <button type="button" className="settingsBtn primary" onClick={onBindTelegram} disabled={telegramBusy}>
                    {telegramBusy ? 'Привязываем...' : 'Привязать Telegram'}
                  </button>
                ) : (
                  <div className="settingsInline settingsInlineWide">
                    <p className="settingsHint">Telegram привязан: {telegramUsername}</p>
                    <button type="button" className="settingsBtn ghost" onClick={onUnbindTelegram} disabled={telegramBusy}>
                      Отвязать
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="settingRow">
              <div className="settingText">
                <p className="settingTitle">Выход</p>
                <p className="settingDescription">Завершить текущую сессию на этом устройстве.</p>
              </div>
              <button type="button" className="settingsBtn ghost" onClick={onLogout}>
                Выйти
              </button>
            </div>
          </article>

          <article className="settingsCard">
            <h2 className="settingsCardTitle">Настройки интерфейса (UX)</h2>
            <p className="settingsCardHint">Особенно важно для Telegram Mini App.</p>

            <div className="settingRow settingRowSelect">
              <div className="settingText">
                <p className="settingTitle">Тема оформления</p>
                <p className="settingDescription">Светлая / Тёмная / Системная (под Telegram). Пока — мок.</p>
              </div>

              <label className="selectWrap" aria-label="Тема оформления">
                <select className="settingsSelect" value={themeMode} onChange={(e) => setThemeMode(e.target.value as ThemeMode)}>
                  <option value="light">Светлая</option>
                  <option value="dark">Тёмная</option>
                  <option value="system">Системная</option>
                </select>
              </label>
            </div>

            <div className="settingRow settingRowSelect">
              <div className="settingText">
                <p className="settingTitle">Язык</p>
                <p className="settingDescription">Пока только Русский (задел на будущее).</p>
              </div>

              <label className="selectWrap" aria-label="Язык">
                <select className="settingsSelect" value={language} onChange={() => setLanguage('ru')} disabled>
                  <option value="ru">Русский</option>
                </select>
              </label>
            </div>
          </article>

          <article className="settingsCard">
            <h2 className="settingsCardTitle">Приватность и данные</h2>

            <div className="settingRow">
              <div className="settingText">
                <p className="settingTitle">Список избранного</p>
                <p className="settingDescription">Быстрый переход к своим артистам/площадкам.</p>
              </div>

              <div className="settingsInline">
                <Link to="/artists" className="settingsBtn ghost">
                  Артисты
                </Link>
                <Link to="/venues" className="settingsBtn ghost">
                  Площадки
                </Link>
              </div>
            </div>

            <div className="settingRow settingRowColumn">
              <div className="settingText">
                <p className="settingTitle">Удаление аккаунта</p>
                <p className="settingDescription">
                  <strong className="settingsDangerText">Действие необратимо.</strong> В проде здесь запускается логика анонимизации
                  (затирка данных, но сохранение рецензий). Для MVP — мок.
                </p>
              </div>

              <div className="settingsControl">
                <form className="settingsForm" onSubmit={onDeleteAccountSubmit}>
                  <input
                    className="settingsInput"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Введите пароль для подтверждения"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />

                  <label className="settingsCheckbox">
                    <input type="checkbox" checked={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.checked)} />
                    Я понимаю, что это действие необратимо
                  </label>

                  {deleteError && <p className="settingsError">{deleteError}</p>}

                  <button
                    type="submit"
                    className="settingsBtn danger"
                    disabled={deleteBusy || !deletePassword || !deleteConfirm}
                  >
                    {deleteBusy ? 'Удаляем...' : 'Удалить профиль'}
                  </button>
                </form>
              </div>
            </div>
          </article>

          <article className="settingsCard settingsCardWide">
            <h2 className="settingsCardTitle">Инфо и юридические документы</h2>

            <div className="settingRow">
              <div className="settingText">
                <p className="settingTitle">Дополнительные страницы</p>
                <p className="settingDescription">То, что не поместилось в нижнюю навигацию на мобильных устройствах.</p>
              </div>

              <div className="settingsInline">
                <Link to="/faq" className="settingsBtn ghost">
                  FAQ
                </Link>
                <Link to="/about" className="settingsBtn ghost">
                  О проекте
                </Link>
              </div>
            </div>

            <div className="settingRow">
              <div className="settingText">
                <p className="settingTitle">Версия приложения</p>
                <p className="settingDescription">v1.0.0-mvp</p>
              </div>
              <span className="settingsBadge">MVP</span>
            </div>

            <div className="settingRow">
              <div className="settingText">
                <p className="settingTitle">Пользовательское соглашение</p>
                <p className="settingDescription">Открывается как статический файл.</p>
              </div>
              <a className="settingsBtn ghost" href="/terms.html" target="_blank" rel="noreferrer">
                Открыть
              </a>
            </div>

            <div className="settingRow">
              <div className="settingText">
                <p className="settingTitle">Политика конфиденциальности</p>
                <p className="settingDescription">Открывается как статический файл.</p>
              </div>
              <a className="settingsBtn ghost" href="/privacy.html" target="_blank" rel="noreferrer">
                Открыть
              </a>
            </div>

            <div className="settingRow">
              <div className="settingText">
                <p className="settingTitle">Связаться с нами</p>
                <p className="settingDescription">Email для жалоб и предложений (пример).</p>
              </div>
              <a className="settingsBtn ghost" href="mailto:support@concert.bot">
                support@concert.bot
              </a>
            </div>
          </article>
        </div>
      )}

      {isModerationModalOpen && (
        <div className="settingsModalBackdrop" onClick={() => setIsModerationModalOpen(false)}>
          <article
            className="settingsModalCard"
            role="dialog"
            aria-modal="true"
            aria-label="Статус модерации"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settingsModalHeader">
              <h3 className="settingsModalTitle">Статус модерации</h3>
              <button type="button" className="settingsBtn ghost" onClick={() => setIsModerationModalOpen(false)}>
                Закрыть
              </button>
            </div>

            {profileChangeRequests.length === 0 ? (
              <p className="settingsHint">Пока нет заявок.</p>
            ) : (
              <ul className="settingsList" aria-label="Заявки на модерацию">
                {profileChangeRequests.map((item) => (
                  <li key={item.id} className="settingsListItem">
                    <span className="settingsListTitle">{changeTypeTitle(item.type)}</span>
                    <span className="settingsBadge">{moderationStatusRu(item.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      )}
    </section>
  )
}
