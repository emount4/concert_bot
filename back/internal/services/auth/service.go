package auth

import (
	"context"
	"strings"
	"time"

	"log/slog"

	initdata "github.com/telegram-mini-apps/init-data-golang"

	authcontract "github.com/yourname/concert-reviews-backend/internal/auth"
	"github.com/yourname/concert-reviews-backend/internal/config"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: реализация TelegramAuthenticator.
//
// Делает всё, что относится к Telegram initData:
// - validate подписи
// - parse
// - upsert пользователя в БД
//
// HTTP-слой (middleware) не знает про initdata/gorm/repository.DB.

type Service struct {
	cfg    *config.Config
	db     *repository.DB
	maxAge time.Duration
}

func New(cfg *config.Config, db *repository.DB) *Service {
	// 24h — разумный дефолт. Позже можно вынести в конфиг.
	return &Service{cfg: cfg, db: db, maxAge: 24 * time.Hour}
}

func (s *Service) Authenticate(ctx context.Context, initDataRaw string) (*repository.UserView, error) {
	initDataRaw = strings.TrimSpace(initDataRaw)
	if initDataRaw == "" {
		return nil, authcontract.ErrMissingInitData
	}

	if err := initdata.Validate(initDataRaw, s.cfg.BotToken, s.maxAge); err != nil {
		slog.WarnContext(ctx, "telegram initData invalid", slog.String("err", err.Error()))
		return nil, authcontract.ErrInvalidInitData
	}

	parsed, err := initdata.Parse(initDataRaw)
	if err != nil {
		return nil, authcontract.ErrBadInitDataFormat
	}
	if parsed.User.ID == 0 {
		return nil, authcontract.ErrTelegramUserMissing
	}

	isAdmin := s.cfg.IsAdminTelegramID(parsed.User.ID)
	user, err := repository.UpsertTelegramUser(ctx, s.db.Gorm(), parsed.User, isAdmin)
	if err != nil {
		return nil, err
	}
	return user, nil
}
