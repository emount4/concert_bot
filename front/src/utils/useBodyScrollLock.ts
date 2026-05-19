import { useEffect } from 'react'

type BodyWithDataset = HTMLBodyElement & {
  dataset: {
    modalCount?: string
    modalPaddingRight?: string
  }
}

const LOCK_CLASS = 'modalOpen'

function getScrollbarWidth(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
}

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    if (typeof document === 'undefined') return

    const body = document.body as BodyWithDataset
    const current = Number(body.dataset.modalCount ?? '0')
    const next = current + 1

    if (current === 0) {
      const scrollbarWidth = getScrollbarWidth()
      body.dataset.modalPaddingRight = body.style.paddingRight

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    body.dataset.modalCount = String(next)
    body.classList.add(LOCK_CLASS)

    return () => {
      const currentCount = Number(body.dataset.modalCount ?? '1')
      const updated = currentCount - 1

      if (updated <= 0) {
        body.style.paddingRight = body.dataset.modalPaddingRight ?? ''
        delete body.dataset.modalCount
        delete body.dataset.modalPaddingRight
        body.classList.remove(LOCK_CLASS)
      } else {
        body.dataset.modalCount = String(updated)
      }
    }
  }, [locked])
}
