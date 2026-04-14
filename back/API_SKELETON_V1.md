# Backend API Skeleton v1

Документ фиксирует целевые endpoint-группы и стандартные envelopes.

## Prefix

- `/api/v1`

## Группы endpoint-ов

- `auth`
  - `POST /auth/tg-login`
  - `POST /auth/tg-bind`
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /auth/refresh`
  - `POST /auth/logout`
- `catalog`
  - `GET /concerts`
  - `GET /concerts/:concert_id`
  - `GET /artists`
  - `GET /artists/:artist_id`
  - `GET /venues`
  - `GET /venues/:venue_id`
- `reviews`
  - `GET /reviews/feed`
  - `GET /reviews/:review_id`
  - `POST /reviews`
  - `POST /reviews/media/presign`
  - `POST /reviews/:review_id/like`
  - `DELETE /reviews/:review_id/like`
- `profile`
  - `GET /me`
  - `GET /me/profile`
  - `GET /me/reviews`
  - `GET /users/:user_id/public`
- `moderation_admin`
  - `GET /admin/reviews`
  - `POST /admin/reviews/:review_id/approve`
  - `POST /admin/reviews/:review_id/reject`
  - `GET /admin/users`
  - `POST /admin/users/:user_id/ban`
  - `POST /admin/users/:user_id/unban`
  - `POST /admin/users/:user_id/role`
  - `GET/POST/PATCH/DELETE /admin/concerts`
  - `GET/POST/PATCH/DELETE /admin/artists`
  - `GET/POST/PATCH/DELETE /admin/venues`

## Стандарты ответов

- Ошибка:
  - `{ "error_code": "string", "message": "string", "details": {} }`
- Список:
  - `{ "items": [...], "meta": { "next_cursor": "..." } }`
  - или `{ "items": [...], "meta": { "page": 1, "page_size": 20, "total": 123 } }`

## Стратегия миграции

- Новый prefix `/api/v1` вводится параллельно с legacy endpoint-ами.
- После переноса фронта на `/api/v1` legacy endpoint-ы можно удалить.
