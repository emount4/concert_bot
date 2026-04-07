package handlers

import (
	"github.com/gin-gonic/gin"

	authcontract "github.com/yourname/concert-reviews-backend/internal/auth"
	"github.com/yourname/concert-reviews-backend/internal/config"
	"github.com/yourname/concert-reviews-backend/internal/middleware"
	"github.com/yourname/concert-reviews-backend/internal/repository"
	miniopkg "github.com/yourname/concert-reviews-backend/pkg/minio"
)

// Задание: собрать HTTP роутер (Gin)
type RouterDeps struct {
	Config  *config.Config
	DB      *repository.DB
	Minio   miniopkg.Client
	Auth    authcontract.TelegramAuthenticator
	Feed    FeedService
	Catalog CatalogService
	Reviews ReviewsService
	Admin   AdminService
	Profile ProfileService
}

// Задание: собрать HTTP роутер (Gin)
func NewRouter(
	cfg *config.Config,
	db *repository.DB,
	minioClient miniopkg.Client,
	authenticator authcontract.TelegramAuthenticator,
	feedSvc FeedService,
	catalogSvc CatalogService,
	reviewsSvc ReviewsService,
	adminSvc AdminService,
	profileSvc ProfileService,
) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Slog())

	deps := &RouterDeps{
		Config:  cfg,
		DB:      db,
		Minio:   minioClient,
		Auth:    authenticator,
		Feed:    feedSvc,
		Catalog: catalogSvc,
		Reviews: reviewsSvc,
		Admin:   adminSvc,
		Profile: profileSvc,
	}

	registerSystemRoutes(r, db)
	registerFeedRoutes(r, deps)
	registerCatalogRoutes(r, deps)
	registerReviewRoutes(r, deps)
	registerAdminRoutes(r, deps)
	registerProfileRoutes(r, deps)

	return r
}
