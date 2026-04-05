package auth

import (
	"context"
	"errors"

	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: контракт Telegram-аутентификации.
//
// Идея: HTTP слой (middleware/handlers) зависит от интерфейса, а детали (initData validate/parse + upsert user в БД)
// скрыты в реализации сервиса.

type TelegramAuthenticator interface {
	Authenticate(ctx context.Context, initDataRaw string) (*repository.UserView, error)
}

var (
	ErrMissingInitData     = errors.New("missing telegram init data")
	ErrInvalidInitData     = errors.New("invalid telegram init data")
	ErrBadInitDataFormat   = errors.New("bad init data format")
	ErrTelegramUserMissing = errors.New("telegram user missing")
)
