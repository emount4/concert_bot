package handlers

import (
	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/config"
	"github.com/yourname/concert-reviews-backend/internal/middleware"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: собрать HTTP роутер (Gin)
type RouterDeps struct {
	Config *config.Config
	DB     *repository.DB
}

// Задание: собрать HTTP роутер (Gin)
func NewRouter(cfg *config.Config, db *repository.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Slog())

	deps := &RouterDeps{Config: cfg, DB: db}

	registerSystemRoutes(r, db)
	registerFeedRoutes(r, deps)
	registerReviewRoutes(r, deps)

	return r
}
