package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: публичные страницы артиста/площадки со списком их концертов.

type ArtistPublicView struct {
	Artist   ArtistView
	Concerts []ConcertPublicView
}

type VenuePublicView struct {
	Venue    VenueView
	Concerts []ConcertPublicView
}

func GetArtistPublic(ctx context.Context, db *gorm.DB, id uint64, limit, offset int) (*ArtistPublicView, error) {
	if id == 0 {
		return nil, ErrArtistNotFoundPublic
	}
	limit, offset = normalizePage(limit, offset)

	var a models.Artist
	if err := db.WithContext(ctx).First(&a, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrArtistNotFoundPublic
		}
		return nil, err
	}

	var concerts []models.Concert
	if err := db.WithContext(ctx).
		Model(&models.Concert{}).
		Joins("join concert_artists ca on ca.concert_id = concerts.id").
		Where("ca.artist_id = ?", id).
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

	outConcerts := make([]ConcertPublicView, 0, len(concerts))
	for _, c := range concerts {
		outConcerts = append(outConcerts, concertToPublicView(c, aggByID[c.ID]))
	}

	return &ArtistPublicView{
		Artist:   *artistToView(a),
		Concerts: outConcerts,
	}, nil
}

func GetVenuePublic(ctx context.Context, db *gorm.DB, id uint64, limit, offset int) (*VenuePublicView, error) {
	if id == 0 {
		return nil, ErrVenueNotFoundPublic
	}
	limit, offset = normalizePage(limit, offset)

	var v models.Venue
	if err := db.WithContext(ctx).First(&v, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVenueNotFoundPublic
		}
		return nil, err
	}

	var concerts []models.Concert
	if err := db.WithContext(ctx).
		Where("venue_id = ?", id).
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

	outConcerts := make([]ConcertPublicView, 0, len(concerts))
	for _, c := range concerts {
		outConcerts = append(outConcerts, concertToPublicView(c, aggByID[c.ID]))
	}

	return &VenuePublicView{
		Venue:    *venueToView(v),
		Concerts: outConcerts,
	}, nil
}
