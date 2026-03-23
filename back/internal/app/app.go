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
	"github.com/yourname/concert-reviews-backend/internal/httpserver"
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

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger.Info("app starting", slog.String("addr", cfg.Port))
	if err := httpserver.Run(ctx, cfg.Port); err != nil {
		return fmt.Errorf("http server: %w", err)
	}
	logger.Info("app stopped")
	return nil
}
