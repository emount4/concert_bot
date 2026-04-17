import { useCallback, useEffect, useMemo, useState } from 'react'
import { InfoCard } from '../components/info/InfoCard'
import { fetchMockProjectStats, type ProjectStats } from '../mocks/projectStats'

function formatInt(value: number): string {
  return value.toLocaleString('ru-RU')
}

function formatRating(value: number): string {
  return value.toFixed(1)
}

export function AboutPage() {
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    fetchMockProjectStats(controller.signal)
      .then((data) => {
        setStats(data)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        setError('Не удалось загрузить статистику')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const cleanup = load()
    return cleanup
  }, [load])

  const statsCards = useMemo(() => {
    const reviews = stats?.reviewsProcessed ?? 0
    const avg = stats?.avgRating ?? 0
    const artists = stats?.artistsTotal ?? 0
    const cities = stats?.citiesTotal ?? 0

    return [
      { title: 'Обработано рецензий', value: isLoading ? '…' : formatInt(reviews) },
      { title: 'Средний рейтинг по базе', value: isLoading ? '…' : formatRating(avg) },
      { title: 'Артистов в базе', value: isLoading ? '…' : formatInt(artists) },
      { title: 'Городов', value: isLoading ? '…' : formatInt(cities) },
    ]
  }, [isLoading, stats])

  return (
    <section className="page infoPage" aria-label="О проекте">
      <div className="infoPageInner">
        <div className="infoHero">
          <h1 className="infoHeroTitle">О проекте</h1>
          <p className="infoHeroLead">Больше, чем просто отзывы. Мы превращаем впечатления в статистику.</p>
        </div>

        <div className="infoSection" aria-label="Математика рейтинга">
          <h2 className="infoSectionTitle">Математика рейтинга</h2>
          <p className="infoText">
            Каждый отзыв — это 5 оценок по параметрам: <span className="infoInlineCode">Звук</span>,{' '}
            <span className="infoInlineCode">Свет</span>, <span className="infoInlineCode">Исполнение</span>,{' '}
            <span className="infoInlineCode">Атмосфера</span>, <span className="infoInlineCode">Организация</span>.
          </p>
          <p className="infoText">
            Итоговый балл считается как взвешенное среднее: параметр «Организация» имеет повышенный весовой коэффициент
            (например, <span className="infoInlineCode">w = 1.5</span>), чтобы комфорт и безопасность зрителей заметнее
            влияли на итог.
          </p>
          <div className="infoFormula" aria-label="Формула рейтинга">
            Total = (Sound + Light + Performance + Atmosphere + w·Organization) / (4 + w)
          </div>
        </div>

        <div className="infoSection" aria-label="Для кого мы работаем">
          <h2 className="infoSectionTitle">Для кого мы работаем</h2>
          <div className="infoGrid3">
            <InfoCard title="Зрителям">
              Быстро находить лучшие шоу и сравнивать концерты по параметрам, а не только по эмоциям.
            </InfoCard>
            <InfoCard title="Артистам">
              Получать честный фидбек по выступлениям и видеть, где аудитория чувствует просадку.
            </InfoCard>
            <InfoCard title="Площадкам">
              Строить рейтинг гостеприимства: организация, вход, сервис и общее впечатление — всё в одной метрике.
            </InfoCard>
          </div>
        </div>

        <div className="infoSection" aria-label="Команда и миссия">
          <h2 className="infoSectionTitle">Команда и миссия</h2>
          <p className="infoText">
            Мы любим музыку и концерты, но не любим «как-нибудь». Наша цель — повысить качество живых выступлений через
            понятную публичную критику и прозрачные метрики.
          </p>
          <p className="infoText">
            Чем больше данных — тем меньше шума. Мы собираем наблюдения и превращаем их в цифры, чтобы обсуждать
            концерты предметно.
          </p>
        </div>

        <div className="infoSection" aria-label="Живая статистика">
          <h2 className="infoSectionTitle">Живая статистика</h2>

          {error ? (
            <div className="placeholder">
              {error}{' '}
              <button type="button" className="settingsBtn ghost" onClick={load}>
                Повторить
              </button>
            </div>
          ) : null}

          <div className="infoGrid2" aria-label="Карточки статистики">
            {statsCards.map((item) => (
              <InfoCard key={item.title} title={item.title} value={item.value} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
