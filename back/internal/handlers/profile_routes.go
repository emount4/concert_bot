package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/middleware"
)

// Задание: базовые эндпоинты профиля текущего пользователя (/me).

func registerProfileRoutes(r *gin.Engine, deps *RouterDeps) {
	// Все /me эндпоинты — только с Telegram auth.
	auth := r.Group("/")
	auth.Use(middleware.TelegramAuth(deps.Auth))

	// GET /me — минимальный профиль (как в middleware/user).
	auth.GET("/me", func(c *gin.Context) {
		user, ok := middleware.GetUser(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.JSON(http.StatusOK, toDTOUserView(*user))
	})

	// GET /me/profile — расширенный профиль для страницы «Мой профиль».
	auth.GET("/me/profile", func(c *gin.Context) {
		user, ok := middleware.GetUser(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		if deps.Profile == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "profile service not configured"})
			return
		}

		profile, err := deps.Profile.GetMyProfile(c.Request.Context(), user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "get profile failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOUserProfile(profile))
	})
}
