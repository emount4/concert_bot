package app

import (
	authcontract "github.com/yourname/concert-reviews-backend/internal/auth"
	"github.com/yourname/concert-reviews-backend/internal/config"
	"github.com/yourname/concert-reviews-backend/internal/handlers"
	"github.com/yourname/concert-reviews-backend/internal/repository"
	"github.com/yourname/concert-reviews-backend/internal/services/admin"
	authsvc "github.com/yourname/concert-reviews-backend/internal/services/auth"
	"github.com/yourname/concert-reviews-backend/internal/services/catalog"
	"github.com/yourname/concert-reviews-backend/internal/services/feed"
	"github.com/yourname/concert-reviews-backend/internal/services/profile"
	"github.com/yourname/concert-reviews-backend/internal/services/reviews"
	miniopkg "github.com/yourname/concert-reviews-backend/pkg/minio"
)

// Задание: сборка зависимостей приложения (wiring).
//
// Держим детали инициализации в отдельном файле, чтобы `Run()` в app.go не разрастался.

func initMinio(cfg *config.Config) (miniopkg.Client, error) {
	return miniopkg.New(miniopkg.Config{
		Endpoint:  cfg.MinioEndpoint,
		Bucket:    cfg.BucketName,
		AccessKey: cfg.MinioRootUser,
		SecretKey: cfg.MinioRootPassword,
		UseSSL:    cfg.MinioUseSSL,
	})
}

func initAuthService(cfg *config.Config, db *repository.DB) authcontract.TelegramAuthenticator {
	return authsvc.New(cfg, db)
}

func initReviewsService(db *repository.DB) handlers.ReviewsService {
	return reviews.New(db)
}

func initFeedService(db *repository.DB) handlers.FeedService {
	return feed.New(db)
}

func initCatalogService(db *repository.DB) handlers.CatalogService {
	return catalog.New(db)
}

func initAdminService(db *repository.DB) handlers.AdminService {
	return admin.New(db)
}

func initProfileService(db *repository.DB) handlers.ProfileService {
	return profile.New(db)
}
