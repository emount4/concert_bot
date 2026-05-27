import { ErrorState } from '../components/ui/ErrorState'

export function NotFoundPage() {
  return (
    <section className="page errorPage">
      <ErrorState
        code="404"
        title="Страница не найдена"
        text="Такого адреса нет или страница уже недоступна."
      />
    </section>
  )
}
