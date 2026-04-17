type InfoCardProps = {
  title: string
  value?: string
  children?: React.ReactNode
}

export function InfoCard({ title, value, children }: InfoCardProps) {
  return (
    <div className="infoCard">
      <p className="infoCardTitle">{title}</p>
      {value ? <div className="infoCardValue">{value}</div> : null}
      {children ? <div className="infoCardBody">{children}</div> : null}
    </div>
  )
}
