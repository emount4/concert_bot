import { VenueCard } from '../components/venues/VenueCard'
import { MOCK_VENUES } from '../data/mockVenues'

export function VenuesPage() {
  return (
    <section className="page">
      {/* <h1 className="pageTitle">Площадки</h1> */}

      {/* Задание 4.4: карточки площадок с фото, мета-данными и рейтингом справа. */}
      <div className="venueGrid">
        {MOCK_VENUES.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </section>
  )
}
