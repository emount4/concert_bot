package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: профиль текущего пользователя (эндпоинты /me*).

type ProfileReviewItem struct {
	ID           uint64
	ConcertTitle string
	CreatedAt    time.Time
	Status       string
	OverallScore int
}

type MyProfileView struct {
	ID            uint64
	DisplayName   string
	Handle        string
	CreatedAt     time.Time
	Bio           string
	ReviewsCount  int
	ApprovedCount int
	PendingCount  int
	AvatarURL     *string
	RecentReviews []ProfileReviewItem
}

func GetMyProfile(ctx context.Context, db *gorm.DB, userID uint64, recentLimit int) (*MyProfileView, error) {
	if userID == 0 {
		return nil, fmt.Errorf("user id is required")
	}
	if recentLimit <= 0 {
		recentLimit = 3
	}
	if recentLimit > 50 {
		recentLimit = 50
	}

	var u models.User
	if err := db.WithContext(ctx).
		Select("id", "username", "first_name", "last_name", "avatar_url", "total_reviews", "created_at").
		First(&u, userID).Error; err != nil {
		return nil, err
	}

	displayName := strings.TrimSpace(strings.TrimSpace(u.FirstName) + " " + strings.TrimSpace(ptrToString(u.LastName)))
	if displayName == "" {
		if u.Username != nil && strings.TrimSpace(*u.Username) != "" {
			displayName = strings.TrimSpace(*u.Username)
		} else {
			displayName = fmt.Sprintf("user-%d", u.ID)
		}
	}

	handle := ""
	if u.Username != nil {
		un := strings.TrimSpace(*u.Username)
		if un != "" {
			if strings.HasPrefix(un, "@") {
				handle = un
			} else {
				handle = "@" + un
			}
		}
	}

	// Счётчики по статусам модерации.
	type statusAgg struct {
		ModerationStatus string `gorm:"column:moderation_status"`
		Cnt              int    `gorm:"column:cnt"`
	}
	var rows []statusAgg
	if err := db.WithContext(ctx).
		Model(&models.Review{}).
		Select("moderation_status, count(*) as cnt").
		Where("user_id = ?", userID).
		Group("moderation_status").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	approvedCount := 0
	pendingCount := 0
	for _, r := range rows {
		switch r.ModerationStatus {
		case "approved":
			approvedCount = r.Cnt
		case "pending":
			pendingCount = r.Cnt
		}
	}

	// Последние рецензии пользователя.
	var reviews []models.Review
	if err := db.WithContext(ctx).
		Preload("Concert").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(recentLimit).
		Find(&reviews).Error; err != nil {
		return nil, err
	}

	recent := make([]ProfileReviewItem, 0, len(reviews))
	for _, r := range reviews {
		title := ""
		if r.Concert.Title != nil {
			title = strings.TrimSpace(*r.Concert.Title)
		}
		recent = append(recent, ProfileReviewItem{
			ID:           r.ID,
			ConcertTitle: title,
			CreatedAt:    r.CreatedAt,
			Status:       r.ModerationStatus,
			OverallScore: r.Score,
		})
	}

	return &MyProfileView{
		ID:            u.ID,
		DisplayName:   displayName,
		Handle:        handle,
		CreatedAt:     u.CreatedAt,
		Bio:           "",
		ReviewsCount:  u.TotalReviews,
		ApprovedCount: approvedCount,
		PendingCount:  pendingCount,
		AvatarURL:     u.AvatarURL,
		RecentReviews: recent,
	}, nil
}

func ptrToString(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}
