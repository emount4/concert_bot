export function scrollToTop(behavior: ScrollBehavior = 'auto'): void {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, left: 0, behavior })
}
