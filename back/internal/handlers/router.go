package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/middleware"
)

// Задание: собрать HTTP роутер (Gin)
func NewRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Slog())

	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	return r
}
