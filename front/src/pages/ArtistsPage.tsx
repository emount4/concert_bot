import { ArtistCard } from '../components/artists/ArtistCard'
import { MOCK_ARTISTS } from '../data/mockArtists'

export function ArtistsPage() {
  return (
    <section className="page">
      {/* <h1 className="pageTitle">Артисты</h1> */}

      {/* Задание 3.4: карточки артистов с фото-заглушкой, ником и средней оценкой. */}
      <div className="artistGrid">
        {MOCK_ARTISTS.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </section>
  )
}
