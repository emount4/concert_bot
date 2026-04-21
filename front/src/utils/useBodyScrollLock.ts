import { useEffect } from 'react'

type BodyWithDataset = HTMLBodyElement & { dataset: { modalCount?: string } }

const LOCK_CLASS = 'modalOpen'

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    if (typeof document === 'undefined') return

    const body = document.body as BodyWithDataset
    const current = Number(body.dataset.modalCount ?? '0')
    const next = current + 1
    body.dataset.modalCount = String(next)
    body.classList.add(LOCK_CLASS)

    return () => {
      const currentCount = Number(body.dataset.modalCount ?? '1')
      const updated = currentCount - 1

      if (updated <= 0) {
        delete body.dataset.modalCount
        body.classList.remove(LOCK_CLASS)
      } else {
        body.dataset.modalCount = String(updated)
      }
    }
  }, [locked])
}
