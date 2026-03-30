package repository

import (
	"context"
	"time"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: публичные рецензии конкретного концерта (approved) + проверка "моя рецензия".

type ConcertReviewItem struct {
	ID        uint64    `json:"id"`
	ConcertID uint64    `json:"concert_id"`
	Title     string    `json:"title"`
	Text      string    `json:"text"`
	Score     int       `json:"score"`
	CreatedAt time.Time `json:"created_at"`

	User UserView `json:"user"`
}

func ListConcertReviewsApproved(ctx context.Context, db *gorm.DB, concertID uint64, limit, offset int) ([]ConcertReviewItem, error) {
	limit, offset = normalizePage(limit, offset)

	var reviews []models.Review
	if err := db.WithContext(ctx).
		Preload("User").
		Where("concert_id = ?", concertID).
		Where("moderation_status = ?", "approved").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, err
	}

	out := make([]ConcertReviewItem, 0, len(reviews))
	for _, r := range reviews {
		out = append(out, ConcertReviewItem{
			ID:        r.ID,
			ConcertID: r.ConcertID,
			Title:     r.Title,
			Text:      r.Text,
			Score:     r.Score,
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
		})
	}
	return out, nil
}

type MyReviewView struct {
	ID               uint64    `json:"id"`
	ConcertID        uint64    `json:"concert_id"`
	Score            int       `json:"score"`
	ModerationStatus string    `json:"moderation_status"`
	CreatedAt        time.Time `json:"created_at"`
}

func GetMyReviewByConcert(ctx context.Context, db *gorm.DB, userID uint64, concertID uint64) (*MyReviewView, bool, error) {
	var r models.Review
	if err := db.WithContext(ctx).
		Where("user_id = ?", userID).
		Where("concert_id = ?", concertID).
		Order("created_at desc").
		First(&r).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, false, nil
		}
		return nil, false, err
	}
	return &MyReviewView{
		ID:               r.ID,
		ConcertID:        r.ConcertID,
		Score:            r.Score,
		ModerationStatus: r.ModerationStatus,
		CreatedAt:        r.CreatedAt,
	}, true, nil
}
