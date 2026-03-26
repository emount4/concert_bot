package repository

import (
	"context"
	"strings"

	initdata "github.com/telegram-mini-apps/init-data-golang"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// Задание: представление пользователя для HTTP-слоя.
// Не отдаём в handlers прямую Gorm-модель, чтобы проще менять внутренности.

type UserView struct {
	ID         uint64  `json:"id"`
	TelegramID int64   `json:"telegram_id"`
	Username   *string `json:"username"`
	FirstName  string  `json:"first_name"`
	LastName   *string `json:"last_name"`
	AvatarURL  *string `json:"avatar_url"`
	IsAdmin    bool    `json:"is_admin"`
	IsBanned   bool    `json:"is_banned"`
}

func UpsertTelegramUser(ctx context.Context, db *gorm.DB, tgUser initdata.User, isAdmin bool) (*UserView, error) {
	username := strings.TrimSpace(tgUser.Username)
	var usernamePtr *string
	if username != "" {
		usernamePtr = &username
	}

	lastName := strings.TrimSpace(tgUser.LastName)
	var lastNamePtr *string
	if lastName != "" {
		lastNamePtr = &lastName
	}

	photoURL := strings.TrimSpace(tgUser.PhotoURL)
	var photoPtr *string
	if photoURL != "" {
		photoPtr = &photoURL
	}

	u := models.User{
		TelegramID: tgUser.ID,
		Username:   usernamePtr,
		FirstName:  strings.TrimSpace(tgUser.FirstName),
		LastName:   lastNamePtr,
		AvatarURL:  photoPtr,
		IsAdmin:    isAdmin,
	}

	// Upsert по telegram_id.
	// Обновляем только "безопасные" поля профиля; бан/админ могут быть управляемы отдельно.
	if err := db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "telegram_id"}},
			DoUpdates: clause.Assignments(map[string]any{
				"username":   u.Username,
				"first_name": u.FirstName,
				"last_name":  u.LastName,
				"avatar_url": u.AvatarURL,
				"is_admin":   u.IsAdmin,
				"updated_at": gorm.Expr("now()"),
			}),
		}).
		Create(&u).Error; err != nil {
		return nil, err
	}

	var stored models.User
	if err := db.WithContext(ctx).
		Where("telegram_id = ?", tgUser.ID).
		First(&stored).Error; err != nil {
		return nil, err
	}

	return &UserView{
		ID:         stored.ID,
		TelegramID: stored.TelegramID,
		Username:   stored.Username,
		FirstName:  stored.FirstName,
		LastName:   stored.LastName,
		AvatarURL:  stored.AvatarURL,
		IsAdmin:    stored.IsAdmin,
		IsBanned:   stored.IsBanned,
	}, nil
}
