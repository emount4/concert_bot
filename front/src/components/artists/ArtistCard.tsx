import { Link } from 'react-router-dom'
import type { ArtistCardItem } from '../../types/artist'

type ArtistCardProps = {
  artist: ArtistCardItem
}

export function ArtistCard({ artist }: ArtistCardProps) {
  // Задание 3.3: средняя оценка артиста округляется на фронтенде до целого.
  const roundedScore = artist.avgConcertScore === null ? null : Math.round(artist.avgConcertScore)

  return (
    <Link to={`/artists?artistId=${artist.id}`} className="artistCardLink">
      <article className="artistCard">
        <div className="artistPhoto" aria-label="Фото артиста" />

        <div className="artistBody">
          <h2 className="artistNickname">{artist.nickname}</h2>

          <div className="artistRatingSlot">
            {roundedScore !== null && <div className="ratingCircle artistRatingCircle">{roundedScore}</div>}
          </div>
        </div>
      </article>
    </Link>
  )
}
