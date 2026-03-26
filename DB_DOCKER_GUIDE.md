# Postgres через Docker: локальный гайд

Этот гайд поднимает локальный Postgres для разработки одной командой через Docker Compose.

## Требования

- Установлен Docker Desktop (Windows) с включённым Compose.
- Порт `5432` свободен (если у тебя уже запущен локальный Postgres на 5432 — см. раздел про смену порта).

## 1) Поднять базу одной командой

Из корня репозитория (где лежит [docker-compose.yml](docker-compose.yml)):

- `docker compose up -d`

Проверить, что контейнер жив:

- `docker ps`

Посмотреть логи Postgres:

- `docker logs -f concert-bot-db`

Проверить healthcheck (должен быть `healthy`):

- `docker inspect -f "{{.State.Health.Status}}" concert-bot-db`

## 2) Как подключиться к базе

### Вариант A: psql на твоей машине

Если `psql` установлен локально:

- `psql "postgres://postgres:postgres@localhost:5432/concert_bot?sslmode=disable"`

Полезные команды:

- `\l` — список баз
- `\dt` — таблицы
- `\d reviews` — описание таблицы
- `select now();`

### Вариант B: psql внутри контейнера

Если `psql` локально не установлен:

- `docker exec -it concert-bot-db psql -U postgres -d concert_bot`

### Вариант C: GUI (DBeaver / DataGrip)

Параметры подключения:

- Host: `localhost`
- Port: `5432`
- Database: `concert_bot`
- User: `postgres`
- Password: `postgres`

## 3) Как использовать с backend

Твой backend берёт `DATABASE_URL` из [back/.env](back/.env).

Рекомендуемая строка:

- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/concert_bot?sslmode=disable`

Запуск backend:

- `cd back`
- `go run ./cmd/server`

Проверка:

- `curl http://localhost:8080/health`
- `curl http://localhost:8080/ready`

Ожидания:

- `/health` → `ok`
- `/ready` → `ok` (если БД доступна)

## 4) Остановить базу

- `docker compose down`

Данные при этом сохранятся (потому что используются volumes).

## 5) Сбросить базу (удалить данные)

Остановить и удалить volume (все данные будут потеряны):

- `docker compose down -v`

После этого заново поднять:

- `docker compose up -d`

## 6) Если порт 5432 занят (например, у тебя уже установлен Postgres)

Самый простой вариант — пробросить контейнер на другой порт, например 5433.

1) В [docker-compose.yml](docker-compose.yml) поменять строку:

- было: `- "5432:5432"`
- станет: `- "5433:5432"`

2) В [back/.env](back/.env) поменять `DATABASE_URL`:

- было: `...@localhost:5432/...`
- станет: `...@localhost:5433/...`

## 7) Что создаётся автоматически

При первом старте контейнер автоматически создаёт:

- пользователя (`POSTGRES_USER`)
- базу (`POSTGRES_DB`)

Но таблицы проекта Docker не создаёт. Таблицы появятся после того, как ты добавишь миграции и начнёшь их запускать.
