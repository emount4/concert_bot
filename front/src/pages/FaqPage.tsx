import { useEffect, useMemo, useState } from 'react'
import { AccordionItem } from '../components/faq/AccordionItem'

type FaqItem = {
  q: string
  a: string
}

type FaqCategory = {
  id: string
  title: string
  items: FaqItem[]
}

type FaqPayload = {
  categories: FaqCategory[]
}

function matchesQuery(item: FaqItem, query: string): boolean {
  const haystack = `${item.q}\n${item.a}`.toLowerCase()
  return haystack.includes(query)
}

export function FaqPage() {
  const [payload, setPayload] = useState<FaqPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    fetch('/faq.json', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json() as Promise<FaqPayload>
      })
      .then((data) => {
        setPayload(data)
        setActiveCategoryId(data.categories[0]?.id ?? '')
        setIsLoading(false)
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          return
        }
        setError('Не удалось загрузить FAQ')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  const categories = payload?.categories ?? []
  const normalizedQuery = search.trim().toLowerCase()

  const visibleCategories = useMemo(() => {
    if (!payload) return []

    if (normalizedQuery) {
      return payload.categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((it) => matchesQuery(it, normalizedQuery)),
        }))
        .filter((cat) => cat.items.length > 0)
    }

    if (!activeCategoryId) return payload.categories

    return payload.categories.filter((cat) => cat.id === activeCategoryId)
  }, [activeCategoryId, normalizedQuery, payload])

  if (isLoading) {
    return (
      <section className="page infoPage">
        <div className="placeholder">Загрузка FAQ...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page infoPage">
        <div className="placeholder">{error}</div>
      </section>
    )
  }

  return (
    <section className="page infoPage" aria-label="FAQ">
      <div className="infoPageInner">
        <div className="infoHero">
          <h1 className="infoHeroTitle">FAQ</h1>
          <p className="infoHeroLead">Ответы на частые вопросы о рецензиях, контенте и модерации.</p>
        </div>

        <div className="infoSection" aria-label="Поиск по FAQ">
          <h2 className="infoSectionTitle">Поиск</h2>
          <div className="faqSearch">
            <input
              className="faqSearchInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Начните вводить вопрос или ключевое слово"
              aria-label="Поиск по FAQ"
              type="search"
            />
          </div>

          {/* На мобилке — верхний фильтр */}
          <div className="faqTopFilter" role="tablist" aria-label="Категории">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={cat.id === activeCategoryId ? 'faqChip active' : 'faqChip'}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        <div className="faqLayout" aria-label="Список вопросов">
          {/* На десктопе — боковое меню */}
          <aside className="faqNav" aria-label="Категории FAQ">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={cat.id === activeCategoryId ? 'faqNavBtn active' : 'faqNavBtn'}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.title}
              </button>
            ))}
          </aside>

          <div>
            {visibleCategories.map((cat) => (
              <div key={cat.id}>
                <div className="faqCategoryTitle">{cat.title}</div>
                <div className="faqList">
                  {cat.items.map((it, idx) => (
                    <AccordionItem key={`${cat.id}-${idx}`} question={it.q} answer={it.a} />
                  ))}
                </div>
              </div>
            ))}

            {visibleCategories.length === 0 ? (
              <div className="placeholder">Ничего не найдено. Попробуйте другой запрос.</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
