package handlers

import "context"

// Задание: интерфейсы для dependency injection в handlers
//
// Зачем:
// - handlers должны оставаться "тонкими" и не зависеть от конкретной реализации БД (Gorm/pgx/мок);
// - так проще тестировать HTTP-слой и менять реализацию хранилища без переписывания роутов.

type ReadyChecker interface {
	Ready(ctx context.Context) error
}
