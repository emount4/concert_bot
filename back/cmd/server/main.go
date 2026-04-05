package main

import (
	"log/slog"
	"os"
	"strings"

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

func newLogger(level string) *slog.Logger {
	parsedLevel := parseLevel(level)
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: parsedLevel})
	return slog.New(h)
}

func parseLevel(level string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	case "info", "":
		return slog.LevelInfo
	default:
		return slog.LevelInfo
	}
}
