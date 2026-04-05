package feed

import (
	"context"

	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: use-case слой для ленты отзывов.
//
// Цель: скрыть Gorm от HTTP-слоя (handlers) ради unit-тестов.

type Service struct {
	db *repository.DB
}

func New(db *repository.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListFeed(ctx context.Context, limit, offset int) ([]repository.FeedItem, error) {
	return repository.ListFeed(ctx, s.db.Gorm(), limit, offset)
}
