import { Link } from 'react-router-dom'
import type { ArtistCardItem } from '../../types/artist'

type ArtistCardProps = {
  artist: ArtistCardItem
}

export function ArtistCard({ artist }: ArtistCardProps) {
  // Задание 3.3: средняя оценка артиста округляется на фронтенде до целого.
  const roundedScore = artist.avg_rating_total === null ? null : Math.round(artist.avg_rating_total)

  return (
    <Link to={`/artists?artistId=${artist.id}`} className="artistCardLink">
      <article className="artistCard">
        {/* Задание 3.4: реальные изображения в карточке артиста (если есть URL). */}
        <div className="artistPhoto" aria-label="Фото артиста">
          {artist.photo_url && (
            <img
              className="artistPhotoImg"
              src={artist.photo_url}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <div className="artistBody">
          <h2 className="artistNickname">{artist.name}</h2>

          <div className="artistRatingSlot">
            {roundedScore !== null && <div className="ratingCircle artistRatingCircle">{roundedScore}</div>}
          </div>
        </div>
      </article>
    </Link>
  )
}

