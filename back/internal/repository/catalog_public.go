package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: публичное чтение каталога (venues/artists/concerts).

var (
	ErrConcertNotFoundPublic = errors.New("concert not found")
	ErrVenueNotFoundPublic   = errors.New("venue not found")
	ErrArtistNotFoundPublic  = errors.New("artist not found")
)

type ConcertPublicView struct {
	ID              uint64
	Title           *string
	VenueID         uint64
	Venue           VenueView
	TicketPriceMin  int
	TicketPriceMax  int
	PosterURL       *string
	Description     string
	WebsiteURL      *string
	StartsAt        time.Time
	Artists         []ArtistView
	ReviewsCount    int
	ReviewsAvgScore float64
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type concertAgg struct {
	ReviewsCount    int
	ReviewsAvgScore float64
}

func loadConcertAggApproved(ctx context.Context, db *gorm.DB, concertIDs []uint64) (map[uint64]concertAgg, error) {
	out := make(map[uint64]concertAgg, len(concertIDs))
	if len(concertIDs) == 0 {
		return out, nil
	}

	type row struct {
		ConcertID       uint64  `gorm:"column:concert_id"`
		ReviewsCount    int     `gorm:"column:reviews_count"`
		ReviewsAvgScore float64 `gorm:"column:reviews_avg_score"`
	}
	var rows []row
	if err := db.WithContext(ctx).
		Model(&models.Review{}).
		Select("concert_id, count(*) as reviews_count, coalesce(avg(score), 0) as reviews_avg_score").
		Where("moderation_status = ?", "approved").
		Where("concert_id in ?", concertIDs).
		Group("concert_id").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	for _, r := range rows {
		out[r.ConcertID] = concertAgg{ReviewsCount: r.ReviewsCount, ReviewsAvgScore: r.ReviewsAvgScore}
	}
	return out, nil
}

func ListVenuesPublic(ctx context.Context, db *gorm.DB, limit, offset int) ([]VenueView, error) {
	return ListVenues(ctx, db, limit, offset)
}

func ListArtistsPublic(ctx context.Context, db *gorm.DB, limit, offset int) ([]ArtistView, error) {
	return ListArtists(ctx, db, limit, offset)
}

func ListConcertsPublic(ctx context.Context, db *gorm.DB, limit, offset int) ([]ConcertPublicView, error) {
	limit, offset = normalizePage(limit, offset)

	var concerts []models.Concert
	if err := db.WithContext(ctx).
		Preload("Venue").
		Preload("ConcertArtists.Artist").
		Order("starts_at desc").
		Limit(limit).
		Offset(offset).
		Find(&concerts).Error; err != nil {
		return nil, err
	}

	ids := make([]uint64, 0, len(concerts))
	for _, c := range concerts {
		ids = append(ids, c.ID)
	}
	aggByID, err := loadConcertAggApproved(ctx, db, ids)
	if err != nil {
		return nil, err
	}

	out := make([]ConcertPublicView, 0, len(concerts))
	for _, c := range concerts {
		out = append(out, concertToPublicView(c, aggByID[c.ID]))
	}
	return out, nil
}

func GetConcertPublic(ctx context.Context, db *gorm.DB, id uint64) (*ConcertPublicView, error) {
	if id == 0 {
		return nil, ErrConcertNotFoundPublic
	}

	var c models.Concert
	if err := db.WithContext(ctx).
		Preload("Venue").
		Preload("ConcertArtists.Artist").
		First(&c, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrConcertNotFoundPublic
		}
		return nil, err
	}
	aggByID, err := loadConcertAggApproved(ctx, db, []uint64{id})
	if err != nil {
		return nil, err
	}
	v := concertToPublicView(c, aggByID[id])
	return &v, nil
}

func concertToPublicView(c models.Concert, agg concertAgg) ConcertPublicView {
	artists := make([]ArtistView, 0, len(c.ConcertArtists))
	for _, ca := range c.ConcertArtists {
		artists = append(artists, *artistToView(ca.Artist))
	}

	venue := venueToView(c.Venue)
	if venue == nil {
		venue = &VenueView{ID: c.VenueID}
	}

	return ConcertPublicView{
		ID:              c.ID,
		Title:           c.Title,
		VenueID:         c.VenueID,
		Venue:           *venue,
		TicketPriceMin:  c.TicketPriceMin,
		TicketPriceMax:  c.TicketPriceMax,
		PosterURL:       c.PosterURL,
		Description:     c.Description,
		WebsiteURL:      c.WebsiteURL,
		StartsAt:        c.StartsAt,
		Artists:         artists,
		ReviewsCount:    agg.ReviewsCount,
		ReviewsAvgScore: agg.ReviewsAvgScore,
		CreatedAt:       c.CreatedAt,
		UpdatedAt:       c.UpdatedAt,
	}
}
