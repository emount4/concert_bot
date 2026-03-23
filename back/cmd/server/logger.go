package main

import (
	"log/slog"
	"os"
	"strings"
)

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
