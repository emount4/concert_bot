# API Contract v1 (UUID + snake_case)

Этот файл фиксирует единый публичный контракт для нового бэкенда.
Цель: заранее описать все поля из БД, даже если часть еще не используется экраном.

## Базовые правила

- Все идентификаторы сущностей в API: `uuid string` там, где в БД `UUID`.
- JSON-нейминг: `snake_case`.
- Даты/время: `ISO 8601` строка UTC.
- Ошибки: `{ "error_code": "...", "message": "...", "details": { ... } }`.
- Списки: `{ "items": [...], "meta": { "next_cursor" | "page/page_size/total" } }`.

## Справочники

- `cities`: `city_id`, `name`, `slug`, `timezone`, `created_at`
- `roles`: `role_id`, `name`, `permissions`, `created_at`

## Пользователи и безопасность

- `users`: `user_id`, `email`, `password_hash`, `tg_id`, `tg_username`, `role_id`, `username`, `bio`, `avatar_url`, `banner_url`, `is_email_verified`, `is_active`, `is_banned`, `banned_by_user_id`, `created_at`, `updated_at`
- `email_verifications`: `verification_id`, `user_id`, `code`, `type`, `expires_at`, `created_at`
- `login_attempts`: `attempt_id`, `identifier`, `success`, `ip_address`, `user_agent`, `created_at`
- `profile_moderation`: `moderation_id`, `user_id`, `field_name`, `old_value`, `new_value`, `status`, `moderated_by_user_id`, `created_at`

## Каталог

- `venues`: `venue_id`, `city_id`, `name`, `address`, `capacity`, `social_links`, `photo_url`, `description`, `status`, `created_at`, `deleted_at`
- `artists`: `artist_id`, `name`, `description`, `photo_url`, `social_links`, `status`, `created_at`, `deleted_at`
- `concerts`: `concert_id`, `venue_id`, `title`, `date`, `poster_url`, `is_verified`, `created_by_user_id`, `created_at`, `deleted_at`
- `concert_artists`: `concert_id`, `artist_id`, `is_main`
- `concert_suggestions`: `suggestion_id`, `user_id`, `raw_artist_name`, `raw_venue_name`, `concert_date`, `info`, `status`, `created_at`

## Рецензии и медиа

- `reviews`: `review_id`, `user_id`, `concert_id`, `title`, `text`, `original_text`, `p1`, `p2`, `p3`, `p4`, `p5`, `rating_total`, `status`, `rejection_reason`, `moderated_by_user_id`, `is_visible`, `created_at`, `deleted_at`
- `review_media`: `media_id`, `review_id`, `media_url`, `media_type`, `file_size`, `status`, `created_at`

## Социальные сущности

- `review_likes`: `like_id`, `user_id`, `review_id`, `created_at`
- `favorites`: `favorite_id`, `user_id`, `target_id`, `target_type`, `created_at`

## Статистика

- `concert_stats`: `concert_id`, `sum_p1`, `sum_p2`, `sum_p3`, `sum_p4`, `sum_p5`, `sum_rating_total`, `reviews_count`, `updated_at`
- `artist_stats`: `artist_id`, `sum_rating_total`, `reviews_count`, `updated_at`
- `venue_stats`: `venue_id`, `sum_rating_total`, `reviews_count`, `updated_at`
- `user_stats`: `user_id`, `reviews_count`, `likes_given_count`, `likes_received_count`, `updated_at`

## Логи

- `moderation_logs`: `log_id`, `moderator_user_id`, `action`, `target_id`, `target_type`, `details`, `created_at`

## Enum значения

- `moderation_status_enum`: `pending | approved | rejected`
- `content_status_enum`: `active | hidden | archived`
- `target_type_enum`: `concert | artist | venue | review | user`
- `roles.name`: `user | admin | super_admin`
- `email_verifications.type`: `registration | password_reset`

## Реализация в коде

Полный машиночитаемый набор DTO для фронта вынесен в:
`front/src/api/dto/contracts.ts`.
