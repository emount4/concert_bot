package profile

import (
	"context"

	"github.com/yourname/concert-reviews-backend/internal/handlers"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: сервис профиля (use-cases для /me*).

type Service struct {
	db *repository.DB
}

func New(db *repository.DB) handlers.ProfileService {
	return &Service{db: db}
}

func (s *Service) GetMyProfile(ctx context.Context, userID uint64) (*repository.MyProfileView, error) {
	return repository.GetMyProfile(ctx, s.db.Gorm(), userID, 3)
}
