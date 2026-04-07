package app

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/joho/godotenv"

	"github.com/yourname/concert-reviews-backend/internal/config"
	"github.com/yourname/concert-reviews-backend/internal/handlers"
	"github.com/yourname/concert-reviews-backend/internal/httpserver"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

func Run() error {
	logger := slog.Default()

	if err := godotenv.Load(); err != nil {
		logger.Debug(".env not loaded", slog.String("err", err.Error()))
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	// Задание: инициализация подключения к БД (Gorm).
	db, err := repository.OpenPostgres(cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("db init: %w", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			logger.Warn("db close failed", slog.String("err", err.Error()))
		}
	}()

	// Задание: применение схемы через Gorm (только по явному флагу в env).
	// По умолчанию выключено, чтобы не делать неожиданных изменений схемы в проде.
	if strings.EqualFold(strings.TrimSpace(os.Getenv("DB_AUTO_MIGRATE")), "true") || strings.TrimSpace(os.Getenv("DB_AUTO_MIGRATE")) == "1" {
		logger.Info("db automigrate enabled")
		if err := db.AutoMigrate(); err != nil {
			return fmt.Errorf("db automigrate: %w", err)
		}
	}

	// Задание: инициализация MinIO (через DI-конфиг, без глобальных переменных).
	minioClient, err := initMinio(cfg)
	if err != nil {
		return fmt.Errorf("minio init: %w", err)
	}

	authenticator := initAuthService(cfg, db)

	reviewsSvc := initReviewsService(db)
	feedSvc := initFeedService(db)
	catalogSvc := initCatalogService(db)
	adminSvc := initAdminService(db)
	profileSvc := initProfileService(db)

	router := handlers.NewRouter(cfg, db, minioClient, authenticator, feedSvc, catalogSvc, reviewsSvc, adminSvc, profileSvc)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger.Info("app starting", slog.String("addr", cfg.Port))
	if err := httpserver.Run(ctx, cfg.Port, router); err != nil {
		return fmt.Errorf("http server: %w", err)
	}
	logger.Info("app stopped")
	return nil
}
