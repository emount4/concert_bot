package admin

import (
	"context"

	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: use-case слой для admin API (CRUD, модерация, баны).
//
// Цель: убрать прямую зависимость handlers от Gorm.

type Service struct {
	db *repository.DB
}

func New(db *repository.DB) *Service {
	return &Service{db: db}
}

// Venues

func (s *Service) ListVenues(ctx context.Context, limit, offset int) ([]repository.VenueView, error) {
	return repository.ListVenues(ctx, s.db.Gorm(), limit, offset)
}

func (s *Service) CreateVenue(ctx context.Context, in repository.VenueUpsert) (*repository.VenueView, error) {
	return repository.CreateVenue(ctx, s.db.Gorm(), in)
}

func (s *Service) UpdateVenue(ctx context.Context, id uint64, in repository.VenueUpsert) (*repository.VenueView, error) {
	return repository.UpdateVenue(ctx, s.db.Gorm(), id, in)
}

func (s *Service) DeleteVenue(ctx context.Context, id uint64) error {
	return repository.DeleteVenue(ctx, s.db.Gorm(), id)
}

// Artists

func (s *Service) ListArtists(ctx context.Context, limit, offset int) ([]repository.ArtistView, error) {
	return repository.ListArtists(ctx, s.db.Gorm(), limit, offset)
}

func (s *Service) CreateArtist(ctx context.Context, in repository.ArtistUpsert) (*repository.ArtistView, error) {
	return repository.CreateArtist(ctx, s.db.Gorm(), in)
}

func (s *Service) UpdateArtist(ctx context.Context, id uint64, in repository.ArtistUpsert) (*repository.ArtistView, error) {
	return repository.UpdateArtist(ctx, s.db.Gorm(), id, in)
}

func (s *Service) DeleteArtist(ctx context.Context, id uint64) error {
	return repository.DeleteArtist(ctx, s.db.Gorm(), id)
}

// Concerts

func (s *Service) ListConcerts(ctx context.Context, limit, offset int) ([]repository.ConcertView, error) {
	return repository.ListConcerts(ctx, s.db.Gorm(), limit, offset)
}

func (s *Service) CreateConcert(ctx context.Context, in repository.ConcertUpsert) (*repository.ConcertView, error) {
	return repository.CreateConcert(ctx, s.db.Gorm(), in)
}

func (s *Service) UpdateConcert(ctx context.Context, id uint64, in repository.ConcertUpsert) (*repository.ConcertView, error) {
	return repository.UpdateConcert(ctx, s.db.Gorm(), id, in)
}

func (s *Service) DeleteConcert(ctx context.Context, id uint64) error {
	return repository.DeleteConcert(ctx, s.db.Gorm(), id)
}

// Review moderation

func (s *Service) ListReviewsForModeration(ctx context.Context, status string, limit, offset int) ([]repository.AdminReviewListItem, error) {
	return repository.ListReviewsForModeration(ctx, s.db.Gorm(), status, limit, offset)
}

func (s *Service) ApproveReview(ctx context.Context, reviewID uint64) (*repository.ReviewModerationView, error) {
	return repository.ApproveReview(ctx, s.db.Gorm(), reviewID)
}

func (s *Service) RejectReview(ctx context.Context, reviewID uint64, reason string) (*repository.ReviewModerationView, error) {
	return repository.RejectReview(ctx, s.db.Gorm(), reviewID, reason)
}

// Users

func (s *Service) BanUser(ctx context.Context, userID uint64, reason string) error {
	return repository.BanUser(ctx, s.db.Gorm(), userID, reason)
}

func (s *Service) UnbanUser(ctx context.Context, userID uint64) error {
	return repository.UnbanUser(ctx, s.db.Gorm(), userID)
}
