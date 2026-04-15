export type PaginationItem = number | 'ellipsis'

export function buildPaginationItems(currentPage: number, pageCount: number): PaginationItem[] {
  if (!Number.isFinite(pageCount) || pageCount <= 0) {
    return []
  }

  const safePageCount = Math.max(1, Math.floor(pageCount))
  const safeCurrentPage = Math.min(Math.max(1, Math.floor(currentPage)), safePageCount)

  if (safePageCount <= 7) {
    return Array.from({ length: safePageCount }, (_, index) => index + 1)
  }

  if (safeCurrentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', safePageCount]
  }

  if (safeCurrentPage >= safePageCount - 3) {
    return [
      1,
      'ellipsis',
      safePageCount - 4,
      safePageCount - 3,
      safePageCount - 2,
      safePageCount - 1,
      safePageCount,
    ]
  }

  return [1, 'ellipsis', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis', safePageCount]
}
