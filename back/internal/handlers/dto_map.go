package handlers

import (
	"github.com/yourname/concert-reviews-backend/internal/dto"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: маппинг доменных структур (repository) ↔ DTO (internal/dto).
//
// Идея:
// - repository не должен знать о JSON-тегах и HTTP-контракте;
// - handlers отвечают DTO-структурами.

func toDTOUserView(u repository.UserView) dto.UserView {
	return dto.UserView{
		ID:         u.ID,
		TelegramID: u.TelegramID,
		Username:   u.Username,
		FirstName:  u.FirstName,
		LastName:   u.LastName,
		AvatarURL:  u.AvatarURL,
		IsAdmin:    u.IsAdmin,
		IsBanned:   u.IsBanned,
	}
}

func toDTOFeedItem(it repository.FeedItem) dto.FeedItem {
	out := dto.FeedItem{
		ID:        it.ID,
		Score:     it.Score,
		Title:     it.Title,
		Text:      it.Text,
		CreatedAt: it.CreatedAt,
		User:      toDTOUserView(it.User),
	}
	out.Concert.ID = it.Concert.ID
	out.Concert.Title = it.Concert.Title
	return out
}

func toDTOFeedItems(items []repository.FeedItem) []dto.FeedItem {
	out := make([]dto.FeedItem, 0, len(items))
	for _, it := range items {
		out = append(out, toDTOFeedItem(it))
	}
	return out
}

func toDTOReviewView(v *repository.ReviewView) *dto.ReviewView {
	if v == nil {
		return nil
	}
	return &dto.ReviewView{
		ID:               v.ID,
		UserID:           v.UserID,
		ConcertID:        v.ConcertID,
		Title:            v.Title,
		Text:             v.Text,
		MediaURLs:        v.MediaURLs,
		Score:            v.Score,
		ModerationStatus: v.ModerationStatus,
		CreatedAt:        v.CreatedAt,
	}
}

func toDTOMyReviewView(v *repository.MyReviewView) *dto.MyReviewView {
	if v == nil {
		return nil
	}
	return &dto.MyReviewView{
		ID:               v.ID,
		ConcertID:        v.ConcertID,
		Score:            v.Score,
		ModerationStatus: v.ModerationStatus,
		CreatedAt:        v.CreatedAt,
	}
}

func toDTOVenueView(v repository.VenueView) dto.VenueView {
	return dto.VenueView{
		ID:          v.ID,
		Name:        v.Name,
		City:        v.City,
		Address:     v.Address,
		Links:       v.Links,
		Capacity:    v.Capacity,
		Description: v.Description,
		ImageURL:    v.ImageURL,
		Coordinates: v.Coordinates,
		WebsiteURL:  v.WebsiteURL,
		CreatedAt:   v.CreatedAt,
		UpdatedAt:   v.UpdatedAt,
	}
}

func toDTOVenueViews(items []repository.VenueView) []dto.VenueView {
	out := make([]dto.VenueView, 0, len(items))
	for _, it := range items {
		out = append(out, toDTOVenueView(it))
	}
	return out
}

func toDTOArtistView(v repository.ArtistView) dto.ArtistView {
	return dto.ArtistView{
		ID:        v.ID,
		Name:      v.Name,
		ImageURL:  v.ImageURL,
		CreatedAt: v.CreatedAt,
		UpdatedAt: v.UpdatedAt,
	}
}

func toDTOArtistViews(items []repository.ArtistView) []dto.ArtistView {
	out := make([]dto.ArtistView, 0, len(items))
	for _, it := range items {
		out = append(out, toDTOArtistView(it))
	}
	return out
}

func toDTOConcertView(v repository.ConcertView) dto.ConcertView {
	return dto.ConcertView{
		ID:             v.ID,
		Title:          v.Title,
		VenueID:        v.VenueID,
		TicketPriceMin: v.TicketPriceMin,
		TicketPriceMax: v.TicketPriceMax,
		PosterURL:      v.PosterURL,
		Description:    v.Description,
		WebsiteURL:     v.WebsiteURL,
		StartsAt:       v.StartsAt,
		CreatedAt:      v.CreatedAt,
		UpdatedAt:      v.UpdatedAt,
	}
}

func toDTOConcertViews(items []repository.ConcertView) []dto.ConcertView {
	out := make([]dto.ConcertView, 0, len(items))
	for _, it := range items {
		out = append(out, toDTOConcertView(it))
	}
	return out
}

func toDTOConcertPublicView(v repository.ConcertPublicView) dto.ConcertPublicView {
	artists := make([]dto.ArtistView, 0, len(v.Artists))
	for _, a := range v.Artists {
		artists = append(artists, toDTOArtistView(a))
	}

	return dto.ConcertPublicView{
		ID:              v.ID,
		Title:           v.Title,
		VenueID:         v.VenueID,
		Venue:           toDTOVenueView(v.Venue),
		TicketPriceMin:  v.TicketPriceMin,
		TicketPriceMax:  v.TicketPriceMax,
		PosterURL:       v.PosterURL,
		Description:     v.Description,
		WebsiteURL:      v.WebsiteURL,
		StartsAt:        v.StartsAt,
		Artists:         artists,
		ReviewsCount:    v.ReviewsCount,
		ReviewsAvgScore: v.ReviewsAvgScore,
		CreatedAt:       v.CreatedAt,
		UpdatedAt:       v.UpdatedAt,
	}
}

func toDTOConcertPublicViews(items []repository.ConcertPublicView) []dto.ConcertPublicView {
	out := make([]dto.ConcertPublicView, 0, len(items))
	for _, it := range items {
		out = append(out, toDTOConcertPublicView(it))
	}
	return out
}

func toDTOArtistPublicView(v *repository.ArtistPublicView) *dto.ArtistPublicView {
	if v == nil {
		return nil
	}
	concerts := make([]dto.ConcertPublicView, 0, len(v.Concerts))
	for _, c := range v.Concerts {
		concerts = append(concerts, toDTOConcertPublicView(c))
	}
	return &dto.ArtistPublicView{
		Artist:   toDTOArtistView(v.Artist),
		Concerts: concerts,
	}
}

func toDTOVenuePublicView(v *repository.VenuePublicView) *dto.VenuePublicView {
	if v == nil {
		return nil
	}
	concerts := make([]dto.ConcertPublicView, 0, len(v.Concerts))
	for _, c := range v.Concerts {
		concerts = append(concerts, toDTOConcertPublicView(c))
	}
	return &dto.VenuePublicView{
		Venue:    toDTOVenueView(v.Venue),
		Concerts: concerts,
	}
}

func toDTOConcertReviewItem(v repository.ConcertReviewItem) dto.ConcertReviewItem {
	return dto.ConcertReviewItem{
		ID:        v.ID,
		ConcertID: v.ConcertID,
		Title:     v.Title,
		Text:      v.Text,
		Score:     v.Score,
		CreatedAt: v.CreatedAt,
		User:      toDTOUserView(v.User),
	}
}

func toDTOConcertReviewItems(items []repository.ConcertReviewItem) []dto.ConcertReviewItem {
	out := make([]dto.ConcertReviewItem, 0, len(items))
	for _, it := range items {
		out = append(out, toDTOConcertReviewItem(it))
	}
	return out
}

func toDTOReviewModerationView(v *repository.ReviewModerationView) *dto.ReviewModerationView {
	if v == nil {
		return nil
	}
	return &dto.ReviewModerationView{
		ID:               v.ID,
		ModerationStatus: v.ModerationStatus,
		ModerationReason: v.ModerationReason,
		UpdatedAt:        v.UpdatedAt,
	}
}

func toDTOAdminReviewListItems(items []repository.AdminReviewListItem) []dto.AdminReviewListItem {
	out := make([]dto.AdminReviewListItem, 0, len(items))
	for _, it := range items {
		out = append(out, dto.AdminReviewListItem{
			ID:               it.ID,
			UserID:           it.UserID,
			ConcertID:        it.ConcertID,
			Title:            it.Title,
			Text:             it.Text,
			Score:            it.Score,
			ModerationStatus: it.ModerationStatus,
			CreatedAt:        it.CreatedAt,
		})
	}
	return out
}

// Request DTO → domain

func toRepoVenueUpsert(v dto.VenueUpsert) repository.VenueUpsert {
	return repository.VenueUpsert{
		Name:        v.Name,
		City:        v.City,
		Address:     v.Address,
		Links:       v.Links,
		Capacity:    v.Capacity,
		Description: v.Description,
		ImageURL:    v.ImageURL,
		Coordinates: v.Coordinates,
		WebsiteURL:  v.WebsiteURL,
	}
}

func toRepoArtistUpsert(v dto.ArtistUpsert) repository.ArtistUpsert {
	return repository.ArtistUpsert{Name: v.Name, ImageURL: v.ImageURL}
}

func toRepoConcertUpsert(v dto.ConcertUpsert) repository.ConcertUpsert {
	return repository.ConcertUpsert{
		Title:          v.Title,
		VenueID:        v.VenueID,
		TicketPriceMin: v.TicketPriceMin,
		TicketPriceMax: v.TicketPriceMax,
		PosterURL:      v.PosterURL,
		Description:    v.Description,
		WebsiteURL:     v.WebsiteURL,
		StartsAt:       v.StartsAt,
	}
}
