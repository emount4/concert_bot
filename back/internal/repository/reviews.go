package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: репозиторий отзывов.

var (
	ErrConcertNotFound = errors.New("concert not found")
)

type ReviewCreateParams struct {
	ConcertID uint64
	Title     string
	Text      string
	MediaURLs []string

	ExecutionRating        int
	SetlistDynamicsRating  int
	CrowdInteractionRating int
	SoundEngineerRating    int
	VibeRating             int
	Score                  int
}

type ReviewView struct {
	ID               uint64
	UserID           uint64
	ConcertID        uint64
	Title            string
	Text             string
	MediaURLs        []string
	Score            int
	ModerationStatus string
	CreatedAt        time.Time
}

func CreateReview(ctx context.Context, db *gorm.DB, userID uint64, p ReviewCreateParams) (*ReviewView, error) {
	// Проверим, что концерт существует, чтобы вернуть 400 вместо 500 по FK.
	var concert models.Concert
	if err := db.WithContext(ctx).Select("id").First(&concert, p.ConcertID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrConcertNotFound
		}
		return nil, err
	}

	var created models.Review
	if err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		review := models.Review{
			UserID:                 userID,
			ConcertID:              p.ConcertID,
			Title:                  p.Title,
			Text:                   p.Text,
			MediaURLs:              p.MediaURLs,
			ExecutionRating:        p.ExecutionRating,
			SetlistDynamicsRating:  p.SetlistDynamicsRating,
			CrowdInteractionRating: p.CrowdInteractionRating,
			SoundEngineerRating:    p.SoundEngineerRating,
			VibeRating:             p.VibeRating,
			Score:                  p.Score,
			ModerationStatus:       "pending",
		}

		if err := tx.Create(&review).Error; err != nil {
			return err
		}

		// Обновляем счётчик отзывов у пользователя.
		if err := tx.Model(&models.User{}).
			Where("id = ?", userID).
			UpdateColumn("total_reviews", gorm.Expr("total_reviews + 1")).Error; err != nil {
			return err
		}

		created = review
		return nil
	}); err != nil {
		return nil, err
	}

	return &ReviewView{
		ID:               created.ID,
		UserID:           created.UserID,
		ConcertID:        created.ConcertID,
		Title:            created.Title,
		Text:             created.Text,
		MediaURLs:        created.MediaURLs,
		Score:            created.Score,
		ModerationStatus: created.ModerationStatus,
		CreatedAt:        created.CreatedAt,
	}, nil
}

type FeedItem struct {
	ID        uint64
	Score     int
	Title     string
	Text      string
	CreatedAt time.Time

	User    UserView
	Concert struct {
		ID    uint64
		Title *string
	}
}

func ListFeed(ctx context.Context, db *gorm.DB, limit int, offset int) ([]FeedItem, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	// защитимся от больших оффсетов по ошибке (или злоупотребления) на MVP
	if offset > 10_000 {
		offset = 10_000
	}

	var reviews []models.Review
	if err := db.WithContext(ctx).
		Preload("User").
		Preload("Concert").
		Where("moderation_status = ?", "approved").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, err
	}

	out := make([]FeedItem, 0, len(reviews))
	for _, r := range reviews {
		item := FeedItem{
			ID:        r.ID,
			Score:     r.Score,
			Title:     r.Title,
			Text:      r.Text,
			CreatedAt: r.CreatedAt,
			User: UserView{
				ID:         r.User.ID,
				TelegramID: r.User.TelegramID,
				Username:   r.User.Username,
				FirstName:  r.User.FirstName,
				LastName:   r.User.LastName,
				AvatarURL:  r.User.AvatarURL,
				IsAdmin:    r.User.IsAdmin,
				IsBanned:   r.User.IsBanned,
			},
		}
		item.Concert.ID = r.Concert.ID
		item.Concert.Title = r.Concert.Title

		out = append(out, item)
	}
	return out, nil
}
