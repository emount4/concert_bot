package main

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

// Задание: CLI для миграций БД.
//
// Примеры:
// - go run ./cmd/migrate up
// - go run ./cmd/migrate status
//
// Важно: использует DATABASE_URL из окружения (и подхватывает back/.env при локальном запуске).

func main() {
	logger := slog.Default()

	// Локально удобно подхватить .env. В проде переменные обычно приходят из окружения.
	if err := godotenv.Load(); err != nil {
		logger.Debug(".env not loaded", slog.String("err", err.Error()))
	}

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		fatalf("DATABASE_URL is required")
	}

	command := "up"
	if len(os.Args) >= 2 {
		command = strings.TrimSpace(os.Args[1])
	}

	cwd, _ := os.Getwd()
	migrationsDir := filepath.Join(cwd, "migrations")

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		fatalf("open db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		fatalf("ping db: %v", err)
	}

	if err := goose.SetDialect("postgres"); err != nil {
		fatalf("set dialect: %v", err)
	}

	switch command {
	case "up":
		if err := goose.Up(db, migrationsDir); err != nil {
			fatalf("migrate up: %v", err)
		}
		fmt.Println("ok")
	case "down":
		if err := goose.Down(db, migrationsDir); err != nil {
			fatalf("migrate down: %v", err)
		}
		fmt.Println("ok")
	case "status":
		if err := goose.Status(db, migrationsDir); err != nil {
			fatalf("migrate status: %v", err)
		}
	case "redo":
		if err := goose.Redo(db, migrationsDir); err != nil {
			fatalf("migrate redo: %v", err)
		}
		fmt.Println("ok")
	default:
		fatalf("unknown command %q (use: up|down|status|redo)", command)
	}
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
