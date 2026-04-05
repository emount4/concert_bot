package handlers

import (
	"context"

	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: интерфейсы для dependency injection в handlers
//
// Зачем:
// - handlers должны оставаться "тонкими" и не зависеть от конкретной реализации БД (Gorm/pgx/мок);
// - так проще тестировать HTTP-слой и менять реализацию хранилища без переписывания роутов.

type ReadyChecker interface {
	Ready(ctx context.Context) error
}

// FeedService — контракт для ленты отзывов.
//
// Задание: убрать прямую зависимость handlers от Gorm.
type FeedService interface {
	ListFeed(ctx context.Context, limit, offset int) ([]repository.FeedItem, error)
}

// CatalogService — контракт для публичного каталога.
//
// Задание: убрать прямую зависимость handlers от Gorm.
type CatalogService interface {
	ListVenuesPublic(ctx context.Context, limit, offset int) ([]repository.VenueView, error)
	ListArtistsPublic(ctx context.Context, limit, offset int) ([]repository.ArtistView, error)
	ListConcertsPublic(ctx context.Context, limit, offset int) ([]repository.ConcertPublicView, error)

	GetConcertPublic(ctx context.Context, id uint64) (*repository.ConcertPublicView, error)
	GetArtistPublic(ctx context.Context, id uint64, limit, offset int) (*repository.ArtistPublicView, error)
	GetVenuePublic(ctx context.Context, id uint64, limit, offset int) (*repository.VenuePublicView, error)

	ListConcertReviewsApproved(ctx context.Context, concertID uint64, limit, offset int) ([]repository.ConcertReviewItem, error)
}

// AdminService — контракт для admin API.
//
// Задание: убрать прямую зависимость handlers от Gorm.
type AdminService interface {
	// Venues
	ListVenues(ctx context.Context, limit, offset int) ([]repository.VenueView, error)
	CreateVenue(ctx context.Context, in repository.VenueUpsert) (*repository.VenueView, error)
	UpdateVenue(ctx context.Context, id uint64, in repository.VenueUpsert) (*repository.VenueView, error)
	DeleteVenue(ctx context.Context, id uint64) error

	// Artists
	ListArtists(ctx context.Context, limit, offset int) ([]repository.ArtistView, error)
	CreateArtist(ctx context.Context, in repository.ArtistUpsert) (*repository.ArtistView, error)
	UpdateArtist(ctx context.Context, id uint64, in repository.ArtistUpsert) (*repository.ArtistView, error)
	DeleteArtist(ctx context.Context, id uint64) error

	// Concerts
	ListConcerts(ctx context.Context, limit, offset int) ([]repository.ConcertView, error)
	CreateConcert(ctx context.Context, in repository.ConcertUpsert) (*repository.ConcertView, error)
	UpdateConcert(ctx context.Context, id uint64, in repository.ConcertUpsert) (*repository.ConcertView, error)
	DeleteConcert(ctx context.Context, id uint64) error

	// Review moderation
	ListReviewsForModeration(ctx context.Context, status string, limit, offset int) ([]repository.AdminReviewListItem, error)
	ApproveReview(ctx context.Context, reviewID uint64) (*repository.ReviewModerationView, error)
	RejectReview(ctx context.Context, reviewID uint64, reason string) (*repository.ReviewModerationView, error)

	// Users
	BanUser(ctx context.Context, userID uint64, reason string) error
	UnbanUser(ctx context.Context, userID uint64) error
}

// ReviewsService — контракт use-case слоя для handlers.
//
// Задание: handlers зависят от интерфейса, а не от Gorm и не от конкретного пакета services.
// Это позволяет писать unit-тесты на HTTP-слой, подменяя реализацию моками.
type ReviewsService interface {
	GetMyReviewByConcert(ctx context.Context, userID uint64, concertID uint64) (*repository.MyReviewView, bool, error)
	CreateReview(ctx context.Context, userID uint64, p repository.ReviewCreateParams) (*repository.ReviewView, error)
}
