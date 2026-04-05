package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: admin CRUD для справочников (venues/artists/concerts).

var (
	ErrVenueNotFound        = errors.New("venue not found")
	ErrArtistNotFound       = errors.New("artist not found")
	ErrConcertAdminNotFound = errors.New("concert not found")
)

type VenueUpsert struct {
	Name        string
	City        string
	Address     string
	Links       string
	Capacity    *int
	Description string
	ImageURL    *string
	Coordinates *string
	WebsiteURL  *string
}

type VenueView struct {
	ID          uint64
	Name        string
	City        string
	Address     string
	Links       string
	Capacity    *int
	Description string
	ImageURL    *string
	Coordinates *string
	WebsiteURL  *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func CreateVenue(ctx context.Context, db *gorm.DB, in VenueUpsert) (*VenueView, error) {
	v := models.Venue{
		Name:        in.Name,
		City:        in.City,
		Address:     in.Address,
		Links:       in.Links,
		Capacity:    in.Capacity,
		Desc:        in.Description,
		ImageURL:    in.ImageURL,
		Coordinates: in.Coordinates,
		WebsiteURL:  in.WebsiteURL,
	}
	if err := db.WithContext(ctx).Create(&v).Error; err != nil {
		return nil, err
	}
	return venueToView(v), nil
}

func UpdateVenue(ctx context.Context, db *gorm.DB, id uint64, in VenueUpsert) (*VenueView, error) {
	updates := map[string]any{
		"name":        in.Name,
		"city":        in.City,
		"address":     in.Address,
		"links":       in.Links,
		"capacity":    in.Capacity,
		"description": in.Description,
		"image_url":   in.ImageURL,
		"coordinates": in.Coordinates,
		"website_url": in.WebsiteURL,
		"updated_at":  gorm.Expr("now()"),
	}

	res := db.WithContext(ctx).Model(&models.Venue{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, ErrVenueNotFound
	}

	var v models.Venue
	if err := db.WithContext(ctx).First(&v, id).Error; err != nil {
		return nil, err
	}
	return venueToView(v), nil
}

func DeleteVenue(ctx context.Context, db *gorm.DB, id uint64) error {
	res := db.WithContext(ctx).Delete(&models.Venue{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrVenueNotFound
	}
	return nil
}

func ListVenues(ctx context.Context, db *gorm.DB, limit, offset int) ([]VenueView, error) {
	limit, offset = normalizePage(limit, offset)
	var venues []models.Venue
	if err := db.WithContext(ctx).Order("id desc").Limit(limit).Offset(offset).Find(&venues).Error; err != nil {
		return nil, err
	}
	out := make([]VenueView, 0, len(venues))
	for _, v := range venues {
		out = append(out, *venueToView(v))
	}
	return out, nil
}

func venueToView(v models.Venue) *VenueView {
	return &VenueView{
		ID:          v.ID,
		Name:        v.Name,
		City:        v.City,
		Address:     v.Address,
		Links:       v.Links,
		Capacity:    v.Capacity,
		Description: v.Desc,
		ImageURL:    v.ImageURL,
		Coordinates: v.Coordinates,
		WebsiteURL:  v.WebsiteURL,
		CreatedAt:   v.CreatedAt,
		UpdatedAt:   v.UpdatedAt,
	}
}

type ArtistUpsert struct {
	Name     string
	ImageURL *string
}

type ArtistView struct {
	ID        uint64
	Name      string
	ImageURL  *string
	CreatedAt time.Time
	UpdatedAt time.Time
}

func CreateArtist(ctx context.Context, db *gorm.DB, in ArtistUpsert) (*ArtistView, error) {
	a := models.Artist{Name: in.Name, ImageURL: in.ImageURL}
	if err := db.WithContext(ctx).Create(&a).Error; err != nil {
		return nil, err
	}
	return artistToView(a), nil
}

func UpdateArtist(ctx context.Context, db *gorm.DB, id uint64, in ArtistUpsert) (*ArtistView, error) {
	res := db.WithContext(ctx).Model(&models.Artist{}).Where("id = ?", id).Updates(map[string]any{
		"name":       in.Name,
		"image_url":  in.ImageURL,
		"updated_at": gorm.Expr("now()"),
	})
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, ErrArtistNotFound
	}
	var a models.Artist
	if err := db.WithContext(ctx).First(&a, id).Error; err != nil {
		return nil, err
	}
	return artistToView(a), nil
}

func DeleteArtist(ctx context.Context, db *gorm.DB, id uint64) error {
	res := db.WithContext(ctx).Delete(&models.Artist{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrArtistNotFound
	}
	return nil
}

func ListArtists(ctx context.Context, db *gorm.DB, limit, offset int) ([]ArtistView, error) {
	limit, offset = normalizePage(limit, offset)
	var artists []models.Artist
	if err := db.WithContext(ctx).Order("id desc").Limit(limit).Offset(offset).Find(&artists).Error; err != nil {
		return nil, err
	}
	out := make([]ArtistView, 0, len(artists))
	for _, a := range artists {
		out = append(out, *artistToView(a))
	}
	return out, nil
}

func artistToView(a models.Artist) *ArtistView {
	return &ArtistView{ID: a.ID, Name: a.Name, ImageURL: a.ImageURL, CreatedAt: a.CreatedAt, UpdatedAt: a.UpdatedAt}
}

type ConcertUpsert struct {
	Title          *string
	VenueID        uint64
	TicketPriceMin int
	TicketPriceMax int
	PosterURL      *string
	Description    string
	WebsiteURL     *string
	StartsAt       time.Time
}

type ConcertView struct {
	ID             uint64
	Title          *string
	VenueID        uint64
	TicketPriceMin int
	TicketPriceMax int
	PosterURL      *string
	Description    string
	WebsiteURL     *string
	StartsAt       time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func CreateConcert(ctx context.Context, db *gorm.DB, in ConcertUpsert) (*ConcertView, error) {
	c := models.Concert{
		Title:          in.Title,
		VenueID:        in.VenueID,
		TicketPriceMin: in.TicketPriceMin,
		TicketPriceMax: in.TicketPriceMax,
		PosterURL:      in.PosterURL,
		Description:    in.Description,
		WebsiteURL:     in.WebsiteURL,
		StartsAt:       in.StartsAt,
	}
	if err := db.WithContext(ctx).Create(&c).Error; err != nil {
		return nil, err
	}
	return concertToView(c), nil
}

func UpdateConcert(ctx context.Context, db *gorm.DB, id uint64, in ConcertUpsert) (*ConcertView, error) {
	res := db.WithContext(ctx).Model(&models.Concert{}).Where("id = ?", id).Updates(map[string]any{
		"title":            in.Title,
		"venue_id":         in.VenueID,
		"ticket_price_min": in.TicketPriceMin,
		"ticket_price_max": in.TicketPriceMax,
		"poster_url":       in.PosterURL,
		"description":      in.Description,
		"website_url":      in.WebsiteURL,
		"starts_at":        in.StartsAt,
		"updated_at":       gorm.Expr("now()"),
	})
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, ErrConcertAdminNotFound
	}
	var c models.Concert
	if err := db.WithContext(ctx).First(&c, id).Error; err != nil {
		return nil, err
	}
	return concertToView(c), nil
}

func DeleteConcert(ctx context.Context, db *gorm.DB, id uint64) error {
	res := db.WithContext(ctx).Delete(&models.Concert{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrConcertAdminNotFound
	}
	return nil
}

func ListConcerts(ctx context.Context, db *gorm.DB, limit, offset int) ([]ConcertView, error) {
	limit, offset = normalizePage(limit, offset)
	var concerts []models.Concert
	if err := db.WithContext(ctx).Order("starts_at desc").Limit(limit).Offset(offset).Find(&concerts).Error; err != nil {
		return nil, err
	}
	out := make([]ConcertView, 0, len(concerts))
	for _, c := range concerts {
		out = append(out, *concertToView(c))
	}
	return out, nil
}

func concertToView(c models.Concert) *ConcertView {
	return &ConcertView{
		ID:             c.ID,
		Title:          c.Title,
		VenueID:        c.VenueID,
		TicketPriceMin: c.TicketPriceMin,
		TicketPriceMax: c.TicketPriceMax,
		PosterURL:      c.PosterURL,
		Description:    c.Description,
		WebsiteURL:     c.WebsiteURL,
		StartsAt:       c.StartsAt,
		CreatedAt:      c.CreatedAt,
		UpdatedAt:      c.UpdatedAt,
	}
}

func normalizePage(limit, offset int) (int, int) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	if offset > 10_000 {
		offset = 10_000
	}
	return limit, offset
}
