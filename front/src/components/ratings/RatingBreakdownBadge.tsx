type RatingBreakdownItem = {
  label: string
  value: number
}

type RatingBreakdownBadgeProps = {
  value: number
  breakdown: RatingBreakdownItem[]
  className: string
  ariaLabel: string
}

function formatOneDecimal(value: number): string {
  return value.toFixed(1)
}

export function RatingBreakdownBadge({ value, breakdown, className, ariaLabel }: RatingBreakdownBadgeProps) {
  // Задание 13.1: тултип-раскладка по параметрам на кружке рейтинга.
  const hasBreakdown = breakdown.length > 0

  return (
    <div className={`${className} ratingBreakdownWrap`} tabIndex={hasBreakdown ? 0 : -1} aria-label={ariaLabel}>
      <span className="ratingBreakdownNumber">{value}</span>

      {hasBreakdown && (
        <div className="ratingBreakdownTooltip" role="tooltip">
          <p className="ratingBreakdownTitle">Средние оценки</p>
          <div className="ratingBreakdownGrid" aria-label="Средние оценки по параметрам">
            {breakdown.map((item) => (
              <div key={item.label} className="ratingBreakdownRow">
                <span className="ratingBreakdownLabel">{item.label}</span>
                <span className="ratingBreakdownValue">{formatOneDecimal(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
