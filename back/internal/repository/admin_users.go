package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: admin-операции над пользователями.

var ErrUserNotFound = errors.New("user not found")

func BanUser(ctx context.Context, db *gorm.DB, userID uint64, reason string) error {
	res := db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"is_banned":  true,
			"ban_reason": reason,
			"updated_at": gorm.Expr("now()"),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func UnbanUser(ctx context.Context, db *gorm.DB, userID uint64) error {
	res := db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"is_banned":  false,
			"ban_reason": "",
			"updated_at": gorm.Expr("now()"),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}
