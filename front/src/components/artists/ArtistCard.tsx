import type { ArtistCardItem } from '../../types/artist'

type ArtistCardProps = {
  artist: ArtistCardItem
}

export function ArtistCard({ artist }: ArtistCardProps) {
  // Задание 3.3: средняя оценка артиста округляется на фронтенде до целого.
  const roundedScore = artist.avgConcertScore === null ? null : Math.round(artist.avgConcertScore)

  return (
    <article className="artistCard">
      <div className="artistPhoto" aria-label="Фото артиста" />

      <div className="artistBody">
        <h2 className="artistNickname">{artist.nickname}</h2>

        {roundedScore !== null && <div className="ratingCircle artistRatingCircle">{roundedScore}</div>}
      </div>
    </article>
  )
}
