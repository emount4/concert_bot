package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: admin-операции над отзывами (модерация).

var ErrReviewNotFound = errors.New("review not found")

type ReviewModerationView struct {
	ID               uint64
	ModerationStatus string
	ModerationReason string
	UpdatedAt        time.Time
}

func ApproveReview(ctx context.Context, db *gorm.DB, reviewID uint64) (*ReviewModerationView, error) {
	return setReviewModeration(ctx, db, reviewID, "approved", "")
}

func RejectReview(ctx context.Context, db *gorm.DB, reviewID uint64, reason string) (*ReviewModerationView, error) {
	return setReviewModeration(ctx, db, reviewID, "rejected", reason)
}

func setReviewModeration(ctx context.Context, db *gorm.DB, reviewID uint64, status, reason string) (*ReviewModerationView, error) {
	res := db.WithContext(ctx).
		Model(&models.Review{}).
		Where("id = ?", reviewID).
		Updates(map[string]any{
			"moderation_status": status,
			"moderation_reason": reason,
			"updated_at":        gorm.Expr("now()"),
		})
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, ErrReviewNotFound
	}

	var r models.Review
	if err := db.WithContext(ctx).
		Select("id", "moderation_status", "moderation_reason", "updated_at").
		First(&r, reviewID).Error; err != nil {
		return nil, err
	}

	return &ReviewModerationView{
		ID:               r.ID,
		ModerationStatus: r.ModerationStatus,
		ModerationReason: r.ModerationReason,
		UpdatedAt:        r.UpdatedAt,
	}, nil
}

type AdminReviewListItem struct {
	ID               uint64
	UserID           uint64
	ConcertID        uint64
	Title            string
	Text             string
	Score            int
	ModerationStatus string
	CreatedAt        time.Time
}

func ListReviewsForModeration(ctx context.Context, db *gorm.DB, status string, limit, offset int) ([]AdminReviewListItem, error) {
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
	if status == "" {
		status = "pending"
	}

	q := db.WithContext(ctx).Model(&models.Review{}).
		Select("id", "user_id", "concert_id", "name", "text", "score", "moderation_status", "created_at").
		Order("created_at desc").
		Limit(limit).
		Offset(offset)
	if status != "all" {
		q = q.Where("moderation_status = ?", status)
	}

	var rows []struct {
		ID               uint64
		UserID           uint64
		ConcertID        uint64
		Name             string
		Text             string
		Score            int
		ModerationStatus string
		CreatedAt        time.Time
	}
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]AdminReviewListItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, AdminReviewListItem{
			ID:               r.ID,
			UserID:           r.UserID,
			ConcertID:        r.ConcertID,
			Title:            r.Name,
			Text:             r.Text,
			Score:            r.Score,
			ModerationStatus: r.ModerationStatus,
			CreatedAt:        r.CreatedAt,
		})
	}
	return out, nil
}
