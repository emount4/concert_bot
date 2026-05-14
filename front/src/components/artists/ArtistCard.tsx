import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ArtistCardItem } from '../../types/artist'

type ArtistCardProps = {
  artist: ArtistCardItem
}

export function ArtistCard({ artist }: ArtistCardProps) {
  // Задание 3.3: средняя оценка артиста округляется на фронтенде до целого.
  const roundedScore = artist.avg_rating_total === null ? null : Math.round(artist.avg_rating_total)
  const [isPhotoFailed, setIsPhotoFailed] = useState(false)
  const photoUrl = isPhotoFailed ? null : artist.photo_url

  return (
    <Link to={`/artists?artistId=${artist.id}`} className="artistCardLink">
      <article className="artistCard">
        {/* Задание 3.4: реальные изображения в карточке артиста (если есть URL). */}
        <div className="artistPhoto" aria-label="Фото артиста">
          {photoUrl ? (
            <img
              className="artistPhotoImg"
              src={photoUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setIsPhotoFailed(true)}
            />
          ) : (
            <div className="cardMediaFallback">
              <span className="cardMediaFallbackMark" aria-hidden="true">
                ♫
              </span>
              <span>Фото скоро</span>
            </div>
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

