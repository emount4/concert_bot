package main

import (
	"log/slog"
	"os"

	"github.com/yourname/concert-reviews-backend/internal/app"
)

func main() {
	// Задание: инициализация slog-логгера с уровнями
	logger := newLogger(os.Getenv("LOG_LEVEL"))
	slog.SetDefault(logger)

	if err := app.Run(); err != nil {
		slog.Error("app exited with error", slog.String("err", err.Error()))
		os.Exit(1)
	}
}
