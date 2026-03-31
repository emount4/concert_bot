import type { VenueCardItem } from '../../types/venue'

type VenueCardProps = {
  venue: VenueCardItem
}

function VenueIcon({ kind }: { kind: 'name' | 'city' | 'capacity' }) {
  if (kind === 'name') {
    return (
      <svg className="metaIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 20.5h15M6.5 20.5v-13l5.5-3 5.5 3v13M9.5 10.5h5M9.5 13.5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'city') {
    return (
      <svg className="metaIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  return (
    <svg className="metaIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 18.5h15M6.5 18.5v-5M10.5 18.5v-8M14.5 18.5v-11M18.5 18.5v-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function formatCapacity(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function VenueCard({ venue }: VenueCardProps) {
  // Задание 4.3: рейтинг площадки отображается кругом, число округляется на фронтенде.
  const roundedScore = venue.avgVenueScore === null ? null : Math.round(venue.avgVenueScore)

  return (
    <article className="venueCard">
      <div className="venuePhoto" aria-label="Фото площадки" />

      <div className="venueBottom">
        <div className="venueInfo">
          <p className="venueMeta venueMetaName">
            <VenueIcon kind="name" />
            <span className="metaText">{venue.name}</span>
          </p>

          <p className="venueMeta">
            <VenueIcon kind="city" />
            <span className="metaText">{venue.city}</span>
          </p>

          <p className="venueMeta">
            <VenueIcon kind="capacity" />
            <span className="metaText">{formatCapacity(venue.capacity)} чел</span>
          </p>
        </div>

        {roundedScore !== null && <div className="ratingCircle">{roundedScore}</div>}
      </div>
    </article>
  )
}
