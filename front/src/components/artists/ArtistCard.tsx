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
        {/* Задание 3.4: реальные изображения в карточке артиста (если есть URL). */}
        <div className="artistPhoto" aria-label="Фото артиста">
          {artist.imageUrl && (
            <img
              className="artistPhotoImg"
              src={artist.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

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
