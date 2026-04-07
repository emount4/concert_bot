# Front ↔ Back contract gaps (по мокам фронта)

Цель: понять, какие данные/эндпоинты бэка уже покрывают фронтовые страницы (которые сейчас сидят на `front/src/data/mock*.ts`), и что нужно добавить/изменить, чтобы можно было убрать моки.

## Важное про нейминг

- Бэкенд DTO сейчас **snake_case** (`starts_at`, `poster_url`, `created_at`…), фронт типы — **camelCase** (`dateTime`, `bannerImageUrl`, `createdAt`…).
- Это не «ошибка», но значит, что для замены моков нужен либо:
  - слой маппинга на фронте (рекомендуется), либо
  - изменение JSON-контракта бэка под camelCase (ломающее/масштабное).

Ниже gaps считаем **по смыслу данных**, а не по регистру полей.

---

## 1) Концерты (ConcertsPage / ConcertCard / RateConcertPage)

### Фронт ожидает
Тип: `Concert` (`front/src/types/concert.ts`)
- `id`, `title`, `dateTime`, `bannerImageUrl`
- `venue { id, name, city, address, imageUrl }`
- `artists: { id, name }[]`
- `stats: { avgOverallScore, reviewsCount }`

### Бэк уже отдаёт
- `GET /concerts` → `{ items: dto.ConcertPublicView[] }`
- `GET /concerts/:id` → `dto.ConcertPublicView`

### Маппинг
- `dateTime` ← `starts_at`
- `bannerImageUrl` ← `poster_url`
- `stats.reviewsCount` ← `reviews_count`
- `stats.avgOverallScore` ← `reviews_avg_score` *(на бэке `float64`, на фронте `number | null`)*

### Статус
- По данным концертов — **в целом ок** (нужен только фронтовый маппинг snake_case→camelCase).

---

## 2) Артисты (ArtistsPage / ArtistCard)

### Фронт ожидает
Тип: `ArtistCardItem` (`front/src/types/artist.ts`)
- `id`, `nickname`, `imageUrl`, `avgConcertScore`

Также страница артиста использует:
- список концертов артиста
- последние рецензии по концертам артиста

### Бэк уже отдаёт
- `GET /artists` → `{ items: dto.ArtistView[] }` (сейчас: `id`, `name`, `image_url`, timestamps)
- `GET /artists/:id` → `dto.ArtistPublicView { artist, concerts[] }`

### GAPs
1) **Нет `avgConcertScore` для карточек артистов**.
2) На фронте поле называется `nickname`, на бэке — `name`.
3) Для detail-страницы фронт показывает «последние рецензии по артисту», а на бэке нет удобного эндпоинта:
   - сейчас можно только косвенно: взять концерты артиста → для каждого `GET /concerts/:id/reviews` и агрегировать на клиенте (дорого/сложно).

### Минимальные варианты выравнивания
- Вариант A (рекомендуемый):
  - оставить `dto.ArtistView.name`, а на фронте маппить `nickname = name`
  - добавить агрегат `avg_concert_score` в ответы `/artists` (или отдельный endpoint для «карточек»)
  - добавить `GET /artists/:id/reviews` (approved) или вернуть `recent_reviews` в `ArtistPublicView`

---

## 3) Площадки (VenuesPage / VenueCard)

### Фронт ожидает
Тип: `VenueCardItem` (`front/src/types/venue.ts`)
- `id`, `name`, `city`, `capacity` *(number, не nullable)*, `imageUrl`, `avgVenueScore`

Также detail-страница площадки показывает:
- концерты площадки
- последние рецензии по концертам площадки

### Бэк уже отдаёт
- `GET /venues` → `{ items: dto.VenueView[] }` (capacity на бэке `*int`)
- `GET /venues/:id` → `dto.VenuePublicView { venue, concerts[] }`

### GAPs
1) **Нет `avgVenueScore` для карточек площадок**.
2) `capacity` на бэке nullable (`*int`), фронт ожидает всегда число.
3) Нет удобного эндпоинта под «последние рецензии по площадке» (аналогично артисту).

### Минимальные варианты выравнивания
- На фронте: `capacity = capacity ?? 0` (или показывать «—»).
- На бэке: добавить агрегат `avg_venue_score` (и, опционально, `reviews_count`) для `/venues`.
- Добавить `GET /venues/:id/reviews` или `recent_reviews` в `VenuePublicView`.

---

## 4) Лента рецензий (ReviewsPage / ReviewCard)

### Фронт ожидает
Тип: `ReviewCardItem` (`front/src/types/review.ts`)
- Автор: `authorName`, `authorAvatarUrl`
- Концерт: `concertTitle`, `concertArtist` *(строка)*, `concertPosterUrl`, `concertId`
- Оценки: `overallScore`, `scores { performance,setlist,crowd,sound,vibe }`
- `text`
- `media?: { id, type, url }[]`

### Бэк уже отдаёт (частично)
- `GET /feed` → `dto.FeedItem[]` (нет медиа, нет sub-scores, нет постера, нет артистов)
- `GET /concerts/:id/reviews` → `dto.ConcertReviewItem[]` (нет медиа, нет sub-scores, нет данных концерта/артистов/постера)
- `POST /reviews` принимает sub-scores и `media_urls`, но в `dto.ReviewView` возвращает только `media_urls` + `score` (без sub-scores).

### GAPs (критичные)
1) **Нет ни одного эндпоинта, который прямо возвращает “витринную” карточку рецензии**, как в моках.
2) Sub-scores (execution/setlist/…) существуют в БД и принимаются в `POST /reviews`, но:
   - не возвращаются в `ReviewView`
   - не присутствуют в feed/reviews list
3) `media` на фронте — массив вложений с `type` и `id`, на бэке — просто `media_urls: []string`.
4) Для показа `concertArtist`/`concertPosterUrl` нужен join с концертом (+ артистами).

### Минимальные варианты выравнивания
- Вариант A: расширить `GET /feed` до «витринного» формата (добавить данные концерта+артистов+poster, sub-scores, media).
- Вариант B: добавить новый endpoint (например `GET /reviews/feed` или `GET /review-cards`) и отдельный DTO под `ReviewCardItem`.

---

## 5) Профиль (ProfilePage / /me)

### Фронт ожидает
Тип: `UserProfile` (`front/src/types/profile.ts`)
- summary + `recentReviews[]` (с id)
- Для карточек «мои последние рецензии» фронт использует полноценные `ReviewCardItem`.

### Бэк уже отдаёт
- `GET /me` и `GET /me/profile` (есть summary и `recent_reviews` с `concert_title`, `created_at`, `status`, `overall_score`).

### GAPs
- `GET /me/profile` **не даёт данных, достаточных для отрисовки `ReviewCard`**.

### Минимальные варианты
- Добавить endpoint `GET /me/reviews` (approved + pending, или только свои) в витринном формате `ReviewCardItem`.
- Или сделать `recent_reviews` в профиле «толще» (включить всё для карточки), но это может раздувать ответ.

---

## 6) Публичный профиль пользователя (UserProfilePage)

### Фронт ожидает
- `GET` по пользователю и список его последних рецензий.

### Бэк сейчас
- публичного `/users/:...` нет.

### GAP
- нужен endpoint публичного профиля + список approved рецензий пользователя.

---

## 7) Админка (AdminPage)

### Фронт ожидает (по типам)
- `AdminReviewModerationItem`: authorName, concertTitle, createdAt, overallScore, status, text, media
- `AdminArtist`: есть `description`
- `AdminConcert`: хранит `artistIds[]` (связь концерт-артисты)
- `AdminAccount`: роли/бан

### Бэк сейчас
- `/admin/venues`, `/admin/artists`, `/admin/concerts`, `/admin/reviews`, `/admin/users/:id/ban|unban`

### GAPs
1) `dto.AdminReviewListItem` не содержит `authorName`, `concertTitle`, `media` — только `user_id` и `concert_id`.
2) В `Artist` модели/DTO нет `description`, а фронт его редактирует.
3) Админ-концерты на бэке не управляют связью `artistIds` (join `concert_artists`), а фронт ожидает.
4) Админ-аккаунты: на бэке нет endpoint списка аккаунтов/ролей под UI.

---

## 8) Медиа-аплоад (RateConcertPage attachments)

Фронт сейчас выбирает `File[]` вложений и ожидаемо будет грузить их на бэк.

На бэке пока:
- `POST /reviews` принимает `media_urls` как готовые URL.

GAP
- нужен отдельный upload flow (MinIO), как минимум:
  - presign URL (upload)
  - сохранение ссылок и типизации медиа

---

## Быстрый итог

### Уже близко к использованию (с маппингом snake_case→camelCase)
- список концертов / деталка концерта
- список рецензий концерта (но в урезанном виде)
- /me и /me/profile (как summary)

### Главные блокеры для отказа от моков
- витринный формат рецензии (`ReviewCardItem`) и под него endpoint/DTO
- агрегаты для карточек артистов/площадок (`avgConcertScore`, `avgVenueScore`)
- админка: joined-поля + управление concert↔artist + artist.description
- публичный профиль пользователя
- медиа upload (если хотим реально прикреплять файлы)
