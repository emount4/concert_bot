# API контракт фронтенда (актуально по текущему коду)

Документ собран по реальному коду фронтенда в `front/src`.
Код в `back/` не используется и сознательно игнорируется.

## 1. Режимы и транспорт

### Переключение режима
- `VITE_DATA_SOURCE=mock|api`
- В режиме `api` фронт реально вызывает только то, что перечислено в разделе **2**.

### Base URL и формат запросов
- Base URL: `VITE_API_BASE_URL` (по умолчанию `http://127.0.0.1:8080/api/v1`)
- JSON-тело: если есть body, то ставится `Content-Type: application/json`
- Аутентификация: `credentials: include` (cookie/session)
- 204: считается `null`
- Ошибки: если ответ не 2xx, фронт читает `{ "message": "..." }`

### Формат списков
```ts
type ListResponse<T> = { items: T[] }
```
Примечание: `meta` есть в `src/api/dto/contracts.ts`, но фронтом не используется.

### Нюансы ID
- Почти везде есть числовой `id` и опциональный строковый `*_id`
- В ссылках на лайки фронт использует `review.review_id ?? review.id`
- Рекомендация: всегда возвращайте числовой `id` и строковый `*_id` (если UUID)

### Формат дат
- Везде ISO строки, которые проходят через `new Date(...)`

## 2. Что фронт реально вызывает в режиме API (без правок фронта)

Эти запросы идут автоматически при загрузке приложения.

### GET /concerts
Принимает: ничего (query не используется).
Отдает: `{ items: Concert[] }`

### GET /artists
Принимает: ничего.
Отдает: `{ items: ArtistCardItem[] }`

### GET /venues
Принимает: ничего.
Отдает: `{ items: VenueCardItem[] }`

### GET /reviews
Принимает: ничего.
Отдает: `{ items: ReviewCardItem[] }`
Нюансы:
- `review.concertId` должен совпадать с `concert.id` (иначе фильтры не работают)
- `review.scores` обязательны (UI отображает все 5 значений)
- `review.rating_total` обязателен (UI показывает число)
- `review.author_username` очень желателен (нужен для профилей)

### GET /users/me
Принимает: ничего.
Отдает: `UserProfile`
Нюансы:
- `handle` используется как username; допускается формат `@name`
- `recent_reviews` управляет статусом модерации в профиле

### GET /admin/reviews/pending
Принимает: ничего.
Отдает: `{ items: AdminReviewModerationItem[] }`
Нюанс: UI сам фильтрует по `status` (pending/approved/rejected), поэтому можно отдавать все статусы.

### GET /admin/artists
Принимает: ничего.
Отдает: `{ items: AdminArtist[] }`

### GET /admin/venues
Принимает: ничего.
Отдает: `{ items: AdminVenue[] }`

### GET /admin/concerts
Принимает: ничего.
Отдает: `{ items: AdminConcert[] }`

### GET /admin/users
Принимает: ничего.
Отдает: `{ items: AdminAccount[] }`
Нюансы:
- `is_current=true` нужен, чтобы определить текущего админа
- `role` проверяется на `admin`, `super-admin`, `super_admin`

### GET /reviews/{reviewId}/likers
Принимает: `reviewId` (строка или число).
Отдает: либо `ReviewLikeUser[]`, либо `{ items: ReviewLikeUser[] }`.
Нюансы:
- `ReviewLikeUser.name` обязателен
- `username` нужен для ссылки на профиль (если нет, будет ссылка по `name`)

## 3. Что сейчас на моках (нужно реализовать и подключить в фронте)

Ниже перечислены фичи, которые в UI есть, но работают через mock. Чтобы заменить моки на API, нужно:
1) реализовать эндпоинты; 2) заменить mock-функции на вызовы API.

### 3.1 Авторизация и регистрация

#### POST /auth/register
Принимает:
```json
{ "displayName": "...", "email": "...", "password": "..." }
```
Отдает (сейчас ждется логика как у mock):
```json
{ "ok": true }
```
или
```json
{ "ok": false, "message": "..." }
```

#### POST /auth/verify-email
Принимает:
```json
{ "email": "...", "code": "123456" }
```
Отдает:
```json
{ "ok": true }
```
или
```json
{ "ok": false, "message": "..." }
```

#### POST /auth/login
Принимает:
```json
{ "email": "...", "password": "..." }
```
Отдает:
```json
{ "ok": true }
```
или
```json
{ "ok": false, "message": "..." }
```

#### POST /auth/refresh
Принимает: нет.
Отдает: новый session/cookie.

#### POST /auth/logout
Принимает: нет.
Отдает: 204.

#### POST /auth/tg-web-app/login
#### POST /auth/tg-web-app/bind
В фронте нет параметров, но страницы настроек ожидают привязку Telegram.
Рекомендуется возвращать `tg_username` или аналог, чтобы показать в UI.

### 3.2 Профиль и настройки

#### PATCH /users/me
В `api/endpoints.ts` объявлен, но не используется.
Рекомендуемый body (минимум для UI):
```json
{ "handle": "@name", "bio": "...", "avatar_url": "...", "banner_url": "..." }
```
Отдает: `UserProfile`.

#### Изменения профиля через модерацию
В UI есть очередь изменений профиля (тип `AdminProfileChangeRequest`).
Сейчас заявки создаются локально. Для продакшена нужен эндпоинт создания заявок, например:
```
POST /users/profile-change
```
Принимает:
```json
{
  "requested_by_username": "...",
  "requested_by_displayName": "...",
  "type": "username|bio|avatar|banner",
  "old_username": "...",
  "new_username": "...",
  "old_bio": "...",
  "new_bio": "...",
  "old_avatar_url": "...",
  "new_avatar_url": "...",
  "old_banner_url": "...",
  "new_banner_url": "..."
}
```
Отдает: `AdminProfileChangeRequest`.

#### Смена пароля
В UI есть форма смены пароля, сейчас mock.
Рекомендуемый эндпоинт:
```
POST /auth/change-password
```
Принимает:
```json
{ "oldPassword": "...", "newPassword": "...", "newPasswordRepeat": "..." }
```
Отдает:
```json
{ "ok": true }
```
или
```json
{ "ok": false, "message": "..." }
```

#### Удаление аккаунта
Рекомендуемый эндпоинт:
```
POST /auth/delete-account
```
Принимает:
```json
{ "password": "..." }
```
Отдает:
```json
{ "ok": true }
```
или
```json
{ "ok": false, "message": "..." }
```

### 3.3 Рецензии

#### POST /reviews
Форма на странице оценки уже есть.
Принимает:
```json
{
  "concertId": 123,
  "title": "...",
  "text": "...",
  "scores": { "performance": 1, "setlist": 1, "crowd": 1, "sound": 1, "vibe": 1 },
  "media_ids": ["..."]
}
```
Отдает: созданный `ReviewCardItem`.
Нюансы:
- UI показывает счетчик символов (ориентир 300–8500)
- `rating_total` можно посчитать на бэке (формула есть в UI)

#### POST /reviews/media/presign-upload
В UI есть прикрепление файлов и модалка.
Рекомендуемый формат:
Принимает:
```json
{ "files": [{ "name": "...", "size": 123, "type": "image/png" }] }
```
Отдает:
```json
{
  "items": [
    { "id": "...", "type": "image", "upload_url": "...", "url": "..." }
  ]
}
```
`id/type/url` должны совпадать с `ReviewMediaAttachment`.

#### POST /reviews/{id}/like
В UI сейчас лайк локальный. Для сервера нужен toggle.
Принимает: пусто или `{ "liked": true }`.
Отдает: например `{ "liked": true, "likes_count": 12 }`.

### 3.4 Избранное
В UI избранное сейчас из моков.
Эндпоинты из `api/endpoints.ts`:

#### GET /favorites
Отдает список `FavoriteDto` (см. ниже) или `{ items: FavoriteDto[] }`.

#### POST /favorites
Принимает:
```json
{ "target_id": "...", "target_type": "concert|artist|venue" }
```
Отдает: созданный Favorite.

#### DELETE /favorites/{targetId}
Принимает: `targetId`.
Отдает: 204.

### 3.5 Предложения концертов
В UI есть админ-очередь предложений, сейчас mock.
Эндпоинт объявлен:

#### POST /concerts/suggest
Принимает:
```json
{
  "artist_name": "...",
  "venue_name": "...",
  "city_name": "...",
  "date": "2026-05-14T19:30:00Z",
  "info": "..."
}
```
Отдает: `AdminConcertSuggestion` (обычно со статусом `pending`).

### 3.6 Админка (модерация и CRUD)

#### POST/PATCH /admin/reviews/{id}/approve
Принимает:
```json
{ "text": "...", "media_ids": ["..."] }
```
Отдает: обновленный `AdminReviewModerationItem`.

#### POST/PATCH /admin/reviews/{id}/reject
Принимает (рекомендовано):
```json
{ "rejection_reason": "..." }
```
Отдает: обновленный `AdminReviewModerationItem`.

#### GET /admin/profiles/pending
Отдает: `{ items: AdminProfileChangeRequest[] }`.

#### POST/PATCH /admin/profiles/{moderationId}/resolve
Принимает:
```json
{ "status": "approved|rejected" }
```
Отдает: обновленный `AdminProfileChangeRequest`.

#### CRUD артистов/площадок/концертов
Эндпоинты объявлены частично (list + byId). Для UI нужны операции:
- создать
- обновить
- удалить

Рекомендуемые тела:
```json
// AdminArtist
{ "name": "...", "description": "...", "photo_url": "..." }

// AdminVenue
{ "name": "...", "city": "...", "address": "...", "capacity": 1200, "photo_url": "..." }

// AdminConcert
{ "title": "...", "date": "2026-05-10T19:30:00Z", "venue_id": 201, "artist_ids": [101], "poster_url": "..." }
```

#### Управление аккаунтами
Эндпоинты объявлены:
- POST/PATCH /admin/users/{id}/ban  (body `{ "is_banned": true|false }`)
- POST/PATCH /admin/users/{id}/role (body `{ "role": "admin"|"user" }`)

#### Логи
#### GET /admin/logs
Отдает: `{ items: AdminAuditLogEntry[] }`.

### 3.7 Города
#### GET /cities
Отдает: `{ items: AdminCity[] }`.

В админке есть CRUD городов, но API для создания/редактирования/удаления не объявлен.
Рекомендуемые операции:
- POST /admin/cities
- PATCH /admin/cities/{id}
- DELETE /admin/cities/{id}

## 4. Статические файлы (не API)

Фронт напрямую запрашивает/открывает эти файлы:

### GET /faq.json
Ожидаемый формат:
```json
{
  "categories": [
    { "id": "...", "title": "...", "items": [{ "q": "...", "a": "..." }] }
  ]
}
```

### GET /terms.html
### GET /privacy.html
### GET /moderation.html

## 5. Справочник типов (UI)

### Concert
- `id: number`
- `concert_id?: string`
- `title: string | null`
- `date: string` (ISO)
- `poster_url: string | null`
- `venue: Venue`
- `artists: Artist[]`
- `stats: { avg_rating_total: number | null, reviews_count: number }`

### Venue
- `id: number`
- `venue_id?: string`
- `name: string`
- `city: string`
- `address: string`
- `photo_url: string | null`

### Artist
- `id: number`
- `artist_id?: string`
- `name: string`

### ArtistCardItem
- `id: number`
- `artist_id?: string`
- `name: string`
- `photo_url: string | null`
- `avg_rating_total: number | null`

### VenueCardItem
- `id: number`
- `venue_id?: string`
- `name: string`
- `city: string`
- `capacity: number`
- `photo_url: string | null`
- `avg_rating_total: number | null`

### ReviewCardItem
- `id: number`
- `review_id?: string`
- `concertId: number`
- `concert_id?: string`
- `author_name: string`
- `author_username?: string`
- `author_avatar_url: string | null`
- `concert_title: string`
- `concert_artist: string`
- `concert_poster_url: string | null`
- `rating_total: number`
- `scores: { performance, setlist, crowd, sound, vibe }`
- `text: string`
- `media?: ReviewMediaAttachment[]`
- `likes?: ReviewLikeUser[]`

### ReviewMediaAttachment
- `id: string`
- `type: "image" | "video"`
- `url: string`

### ReviewLikeUser
- `name: string`
- `username?: string`
- `avatar_url?: string | null`

### UserProfile
- `id: number`
- `user_id?: string`
- `displayName: string`
- `handle: string`
- `created_at: string`
- `bio: string`
- `reviews_count: number`
- `approved_count: number`
- `pending_count: number`
- `avatar_url: string | null`
- `banner_url?: string | null`
- `is_active?: boolean`
- `recent_reviews: ProfileReviewItem[]`

### ProfileReviewItem
- `id: number`
- `review_id?: string`
- `concert_title: string`
- `created_at: string`
- `status: "approved" | "pending" | "rejected"`
- `rejection_reason?: string | null`
- `rating_total: number`

### AdminReviewModerationItem
- `id: number`
- `review_id?: string`
- `author_name: string`
- `author_username?: string`
- `concert_title: string`
- `created_at: string`
- `rating_total: number`
- `status: "pending" | "approved" | "rejected"`
- `text: string`
- `media?: { id, type, url }[]`

### AdminArtist
- `id: number`
- `artist_id?: string`
- `name: string`
- `description: string`
- `photo_url: string | null`

### AdminVenue
- `id: number`
- `venue_id?: string`
- `name: string`
- `city: string`
- `address: string`
- `capacity: number`
- `photo_url: string | null`

### AdminConcert
- `id: number`
- `concert_id?: string`
- `title: string`
- `date: string`
- `venue_id: number`
- `artist_ids: number[]`
- `poster_url: string | null`

### AdminAccount
- `id: number`
- `user_id?: string`
- `displayName: string`
- `handle: string`
- `role: "user" | "admin" | "super_admin" | "super-admin"`
- `is_banned: boolean`
- `is_current: boolean`

### AdminProfileChangeRequest
- `id: string`
- `created_at: string`
- `requested_by_username: string`
- `requested_by_displayName: string`
- `type: "username" | "bio" | "avatar" | "banner"`
- `status: "pending" | "approved" | "rejected"`
- `old_username?`, `new_username?`
- `old_bio?`, `new_bio?`
- `old_avatar_url?`, `new_avatar_url?`
- `old_banner_url?`, `new_banner_url?`

### AdminConcertSuggestion
- `id: string`
- `created_at: string`
- `status: "pending" | "created" | "rejected"`
- `suggested_by_username: string`
- `suggested_by_displayName: string`
- `artist_name: string`
- `venue_name: string`
- `city_name: string`
- `date: string`

### AdminCity
- `id: number`
- `name: string`
- `slug: string`
- `timezone: string`

### AdminAuditLogEntry
- `id: string`
- `created_at: string`
- `actor_displayName: string`
- `actor_role: "user" | "admin" | "super_admin" | "super-admin"`
- `message: string`
