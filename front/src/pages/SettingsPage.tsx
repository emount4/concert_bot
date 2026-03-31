import { useState } from 'react'

type DefaultTab = 'concerts' | 'reviews' | 'artists' | 'venues'

type SettingsState = {
  compactCards: boolean
  enableAnimations: boolean
  followTelegramTheme: boolean
  hapticFeedback: boolean
  openLinksInTelegram: boolean
  mediaDataSaver: boolean
  showCityInCards: boolean
  hideUnratedItems: boolean
  upcomingOnly: boolean
  blurSensitiveText: boolean
  notifyModeration: boolean
  notifyNewConcerts: boolean
  notifyWeeklyDigest: boolean
  defaultTab: DefaultTab
}

const INITIAL_SETTINGS: SettingsState = {
  compactCards: false,
  enableAnimations: true,
  followTelegramTheme: true,
  hapticFeedback: true,
  openLinksInTelegram: true,
  mediaDataSaver: false,
  showCityInCards: true,
  hideUnratedItems: false,
  upcomingOnly: false,
  blurSensitiveText: false,
  notifyModeration: true,
  notifyNewConcerts: false,
  notifyWeeklyDigest: true,
  defaultTab: 'concerts',
}

type BooleanSettingKey =
  | 'compactCards'
  | 'enableAnimations'
  | 'followTelegramTheme'
  | 'hapticFeedback'
  | 'openLinksInTelegram'
  | 'mediaDataSaver'
  | 'showCityInCards'
  | 'hideUnratedItems'
  | 'upcomingOnly'
  | 'blurSensitiveText'
  | 'notifyModeration'
  | 'notifyNewConcerts'
  | 'notifyWeeklyDigest'

function defaultTabLabel(tab: DefaultTab): string {
  if (tab === 'concerts') return 'Концерты'
  if (tab === 'reviews') return 'Рецензии'
  if (tab === 'artists') return 'Артисты'
  return 'Площадки'
}

type ToggleRowProps = {
  title: string
  description: string
  value: boolean
  onToggle: () => void
}

function ToggleRow({ title, description, value, onToggle }: ToggleRowProps) {
  return (
    <div className="settingRow">
      <div className="settingText">
        <p className="settingTitle">{title}</p>
        <p className="settingDescription">{description}</p>
      </div>

      <button
        type="button"
        className={value ? 'switchBtn on' : 'switchBtn'}
        aria-pressed={value}
        onClick={onToggle}
      >
        <span className="switchKnob" />
      </button>
    </div>
  )
}

export function SettingsPage() {
  // Задание 7.1: страница настроек именно для Telegram Mini App.
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  function toggleField(field: BooleanSettingKey) {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  function onSave() {
    // Пока сохраняем только в память страницы; позже заменим на API /api/settings.
    setLastSavedAt(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
  }

  function onReset() {
    setSettings(INITIAL_SETTINGS)
    setLastSavedAt(null)
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Настройки</h1>

      <div className="settingsLayout">
        <article className="settingsCard">
          <h2 className="settingsCardTitle">Telegram Mini App</h2>

          <ToggleRow
            title="Следовать теме Telegram"
            description="Автоматически подстраивать цвета под тему клиента Telegram."
            value={settings.followTelegramTheme}
            onToggle={() => toggleField('followTelegramTheme')}
          />

          <ToggleRow
            title="Тактильный отклик"
            description="Вибро-отклик при важных действиях, если поддерживается устройством."
            value={settings.hapticFeedback}
            onToggle={() => toggleField('hapticFeedback')}
          />

          <ToggleRow
            title="Открывать ссылки внутри Telegram"
            description="Внешние ссылки открываются во встроенном браузере Telegram."
            value={settings.openLinksInTelegram}
            onToggle={() => toggleField('openLinksInTelegram')}
          />

          <ToggleRow
            title="Экономия трафика медиа"
            description="Снижать качество превью и загружать изображения по запросу."
            value={settings.mediaDataSaver}
            onToggle={() => toggleField('mediaDataSaver')}
          />
        </article>

        <article className="settingsCard">
          <h2 className="settingsCardTitle">Лента и карточки</h2>

          <ToggleRow
            title="Компактные карточки"
            description="Уменьшенный вертикальный ритм карточек для плотного списка."
            value={settings.compactCards}
            onToggle={() => toggleField('compactCards')}
          />

          <ToggleRow
            title="Включить анимации"
            description="Плавные переходы и микроанимации в интерфейсе."
            value={settings.enableAnimations}
            onToggle={() => toggleField('enableAnimations')}
          />

          <ToggleRow
            title="Показывать город в карточках"
            description="Город площадки отображается рядом с названием клуба."
            value={settings.showCityInCards}
            onToggle={() => toggleField('showCityInCards')}
          />

          <ToggleRow
            title="Только предстоящие концерты"
            description="Скрывать прошедшие концерты в основных списках."
            value={settings.upcomingOnly}
            onToggle={() => toggleField('upcomingOnly')}
          />

          <ToggleRow
            title="Скрывать карточки без оценки"
            description="Элементы без средней оценки не показываются в лентах."
            value={settings.hideUnratedItems}
            onToggle={() => toggleField('hideUnratedItems')}
          />

          <ToggleRow
            title="Скрывать чувствительный текст"
            description="Размытие потенциально чувствительного контента до нажатия."
            value={settings.blurSensitiveText}
            onToggle={() => toggleField('blurSensitiveText')}
          />
        </article>

        <article className="settingsCard">
          <h2 className="settingsCardTitle">Уведомления в Telegram</h2>

          <ToggleRow
            title="Статус модерации рецензий"
            description="Личное сообщение в Telegram, когда рецензия одобрена или отклонена."
            value={settings.notifyModeration}
            onToggle={() => toggleField('notifyModeration')}
          />

          <ToggleRow
            title="Новые концерты по интересам"
            description="Подборка новых концертов по артистам и площадкам."
            value={settings.notifyNewConcerts}
            onToggle={() => toggleField('notifyNewConcerts')}
          />

          <ToggleRow
            title="Еженедельный дайджест"
            description="Краткая сводка новых рецензий и концертов за неделю."
            value={settings.notifyWeeklyDigest}
            onToggle={() => toggleField('notifyWeeklyDigest')}
          />
        </article>

        <article className="settingsCard settingsCardWide">
          <h2 className="settingsCardTitle">Запуск и данные</h2>

          <div className="settingRow settingRowSelect">
            <div className="settingText">
              <p className="settingTitle">Вкладка по умолчанию</p>
              <p className="settingDescription">Экран, который открывается после запуска мини-приложения.</p>
            </div>

            <label className="selectWrap" aria-label="Вкладка по умолчанию">
              <select
                className="settingsSelect"
                value={settings.defaultTab}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultTab: e.target.value as DefaultTab }))}
              >
                <option value="concerts">Концерты</option>
                <option value="reviews">Рецензии</option>
                <option value="artists">Артисты</option>
                <option value="venues">Площадки</option>
              </select>
            </label>
          </div>

          <div className="settingRow">
            <div className="settingText">
              <p className="settingTitle">Сбросить локальные данные</p>
              <p className="settingDescription">Очистить кеш интерфейса и временные данные на этом устройстве.</p>
            </div>

            <button type="button" className="settingsBtn ghost">
              Очистить кеш
            </button>
          </div>
        </article>
      </div>

      <footer className="settingsFooter">
        <p className="settingsSummary">Вкладка по умолчанию: {defaultTabLabel(settings.defaultTab)}</p>

        <div className="settingsActions">
          <button type="button" className="settingsBtn ghost" onClick={onReset}>
            Сбросить
          </button>
          <button type="button" className="settingsBtn primary" onClick={onSave}>
            Сохранить
          </button>
        </div>
      </footer>

      {lastSavedAt && <p className="settingsSaved">Изменения сохранены в {lastSavedAt}</p>}

      <p className="settingsSummary">Часть параметров применяется сразу, синхронизация с сервером будет подключена позже.</p>
    </section>
  )
}
