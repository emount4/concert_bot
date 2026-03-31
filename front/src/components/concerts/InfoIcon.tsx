type InfoIconKind = 'artist' | 'date' | 'venue'

type InfoIconProps = {
  kind: InfoIconKind
}

export function InfoIcon({ kind }: InfoIconProps) {
  if (kind === 'artist') {
    return (
      <svg className="metaIcon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 20c1.6-3.2 4.2-4.8 8-4.8s6.4 1.6 8 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'date') {
    return (
      <svg className="metaIcon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 3.5v4M17 3.5v4M3.5 10.5h17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className="metaIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
