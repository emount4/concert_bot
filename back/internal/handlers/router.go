package handlers

import (
	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/middleware"
)

// Задание: собрать HTTP роутер (Gin)
func NewRouter(ready ReadyChecker) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Slog())

	registerSystemRoutes(r, ready)

	return r
}
