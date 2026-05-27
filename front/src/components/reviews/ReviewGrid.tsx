import { Children, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'

type ReviewGridProps = {
  children: ReactNode
  className?: string
  ariaLabel?: string
}

function getReviewGridColumnCount(): number {
  if (typeof window === 'undefined') return 3
  if (window.matchMedia('(max-width: 640px)').matches) return 1
  if (window.matchMedia('(max-width: 1024px)').matches) return 2
  return 3
}

export function ReviewGrid({ children, className, ariaLabel }: ReviewGridProps) {
  const [columnCount, setColumnCount] = useState(getReviewGridColumnCount)
  const items = Children.toArray(children)

  useEffect(() => {
    const updateColumnCount = () => setColumnCount(getReviewGridColumnCount())

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)

    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => [] as ReactNode[])

    items.forEach((item, index) => {
      nextColumns[index % columnCount].push(item)
    })

    return nextColumns
  }, [columnCount, items])

  return (
    <div
      className={className ? `reviewGrid ${className}` : 'reviewGrid'}
      aria-label={ariaLabel}
      style={{ '--review-grid-columns': columnCount } as CSSProperties}
    >
      {columns.map((column, index) => (
        <div key={index} className="reviewGridColumn">
          {column}
        </div>
      ))}
    </div>
  )
}
