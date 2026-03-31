type EmptyPageProps = {
  title: string
}

export function EmptyPage({ title }: EmptyPageProps) {
  return (
    <section className="page">
      <h1 className="pageTitle">{title}</h1>
      <div className="placeholder">Пока пусто</div>
    </section>
  )
}
