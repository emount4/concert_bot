package app

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
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
	//
	// Зачем:
	// - /ready должен уметь проверять доступность Postgres;
	// - дальше репозитории/сервисы будут использовать это подключение.
	db, err := repository.OpenPostgres(cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("db init: %w", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			logger.Warn("db close failed", slog.String("err", err.Error()))
		}
	}()

	router := handlers.NewRouter(db)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger.Info("app starting", slog.String("addr", cfg.Port))
	if err := httpserver.Run(ctx, cfg.Port, router); err != nil {
		return fmt.Errorf("http server: %w", err)
	}
	logger.Info("app stopped")
	return nil
}
