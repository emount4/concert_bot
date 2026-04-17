import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToTop } from '../../utils/scrollToTop'

type ScrollToTopProps = {
  behavior?: ScrollBehavior
}

export function ScrollToTop({ behavior = 'auto' }: ScrollToTopProps) {
  const location = useLocation()

  useEffect(() => {
    scrollToTop(behavior)
  }, [behavior, location.pathname, location.search, location.hash])

  return null
}
