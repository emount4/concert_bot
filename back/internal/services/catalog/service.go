package catalog

import (
	"context"

	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: use-case слой для публичного каталога.
//
// Цель: handlers зависят от интерфейса, а не от Gorm.

type Service struct {
	db *repository.DB
}

func New(db *repository.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListVenuesPublic(ctx context.Context, limit, offset int) ([]repository.VenueView, error) {
	return repository.ListVenuesPublic(ctx, s.db.Gorm(), limit, offset)
}

func (s *Service) ListArtistsPublic(ctx context.Context, limit, offset int) ([]repository.ArtistView, error) {
	return repository.ListArtistsPublic(ctx, s.db.Gorm(), limit, offset)
}

func (s *Service) ListConcertsPublic(ctx context.Context, limit, offset int) ([]repository.ConcertPublicView, error) {
	return repository.ListConcertsPublic(ctx, s.db.Gorm(), limit, offset)
}

func (s *Service) GetConcertPublic(ctx context.Context, id uint64) (*repository.ConcertPublicView, error) {
	return repository.GetConcertPublic(ctx, s.db.Gorm(), id)
}

func (s *Service) GetArtistPublic(ctx context.Context, id uint64, limit, offset int) (*repository.ArtistPublicView, error) {
	return repository.GetArtistPublic(ctx, s.db.Gorm(), id, limit, offset)
}

func (s *Service) GetVenuePublic(ctx context.Context, id uint64, limit, offset int) (*repository.VenuePublicView, error) {
	return repository.GetVenuePublic(ctx, s.db.Gorm(), id, limit, offset)
}

func (s *Service) ListConcertReviewsApproved(ctx context.Context, concertID uint64, limit, offset int) ([]repository.ConcertReviewItem, error) {
	return repository.ListConcertReviewsApproved(ctx, s.db.Gorm(), concertID, limit, offset)
}
