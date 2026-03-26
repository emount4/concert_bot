package middleware

import (
	"net/http"
	"strings"
	"time"

	"log/slog"

	"github.com/gin-gonic/gin"
	initdata "github.com/telegram-mini-apps/init-data-golang"

	"github.com/yourname/concert-reviews-backend/internal/config"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

const (
	telegramInitDataHeader = "X-Telegram-Init-Data"
	ctxUserKey             = "user"
)

// Задание: Telegram Mini App auth middleware.
//
// Ожидает raw initData из window.Telegram.WebApp.initData в заголовке X-Telegram-Init-Data.
// 1) Валидирует подпись initData через init-data-golang (по bot token)
// 2) Парсит user из initData
// 3) Upsert пользователя в БД
// 4) Кладёт пользователя в gin.Context (key: "user")
//
// Почему так:
// - stateless (не нужен отдельный session store на MVP)
// - код не нужно переделывать под прод: в проде можно заменить на session/JWT, оставив ту же модель пользователя.
func TelegramAuth(cfg *config.Config, db *repository.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		initDataRaw := strings.TrimSpace(c.GetHeader(telegramInitDataHeader))
		if initDataRaw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing telegram init data"})
			return
		}

		// 24h — разумный дефолт. Позже вынесем в конфиг.
		if err := initdata.Validate(initDataRaw, cfg.BotToken, 24*time.Hour); err != nil {
			slog.WarnContext(c.Request.Context(), "telegram initData invalid", slog.String("err", err.Error()))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid telegram init data"})
			return
		}

		parsed, err := initdata.Parse(initDataRaw)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "bad init data format"})
			return
		}
		if parsed.User.ID == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "telegram user missing"})
			return
		}

		isAdmin := cfg.IsAdminTelegramID(parsed.User.ID)
		user, err := repository.UpsertTelegramUser(c.Request.Context(), db.Gorm(), parsed.User, isAdmin)
		if err != nil {
			slog.ErrorContext(c.Request.Context(), "user upsert failed", slog.String("err", err.Error()))
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "user init failed"})
			return
		}

		c.Set(ctxUserKey, user)
		c.Next()
	}
}

// GetUser возвращает пользователя, установленного TelegramAuth middleware.
func GetUser(c *gin.Context) (*repository.UserView, bool) {
	v, ok := c.Get(ctxUserKey)
	if !ok {
		return nil, false
	}
	user, ok := v.(*repository.UserView)
	return user, ok
}
