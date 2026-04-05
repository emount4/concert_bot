package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	authcontract "github.com/yourname/concert-reviews-backend/internal/auth"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

const (
	telegramInitDataHeader = "X-Telegram-Init-Data"
	ctxUserKey             = "user"
)

// Задание: Telegram Mini App auth middleware.
//
// Ожидает raw initData из window.Telegram.WebApp.initData в заголовке X-Telegram-Init-Data.
// 1) Делегирует validate/parse/upsert в TelegramAuthenticator
// 4) Кладёт пользователя в gin.Context (key: "user")
//
// Почему так:
// - stateless (не нужен отдельный session store на MVP)
// - код не нужно переделывать под прод: в проде можно заменить на session/JWT, оставив ту же модель пользователя.
func TelegramAuth(authenticator authcontract.TelegramAuthenticator) gin.HandlerFunc {
	return func(c *gin.Context) {
		initDataRaw := strings.TrimSpace(c.GetHeader(telegramInitDataHeader))
		if authenticator == nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "auth service not configured"})
			return
		}

		user, err := authenticator.Authenticate(c.Request.Context(), initDataRaw)
		if err != nil {
			switch {
			case errors.Is(err, authcontract.ErrMissingInitData):
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			case errors.Is(err, authcontract.ErrInvalidInitData), errors.Is(err, authcontract.ErrTelegramUserMissing):
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			case errors.Is(err, authcontract.ErrBadInitDataFormat):
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			default:
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "user init failed"})
				return
			}
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
