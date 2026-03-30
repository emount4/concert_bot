package config

import (
	"strings"
	"testing"
	"time"
)

func TestLoad_OK(t *testing.T) {
	// Задание: проверка, что конфиг грузится при наличии обязательных env
	t.Setenv("PORT", ":9999")
	t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("TELEGRAM_BOT_TOKEN", "test-token")
	t.Setenv("LOG_LEVEL", "debug")
	t.Setenv("ADMIN_TELEGRAM_IDS", "123, 456")
	t.Setenv("SHUTDOWN_TIMEOUT", "11s")
	t.Setenv("HTTP_READ_HEADER_TIMEOUT", "12s")
	t.Setenv("HTTP_READ_TIMEOUT", "13s")
	t.Setenv("HTTP_WRITE_TIMEOUT", "14s")
	t.Setenv("HTTP_IDLE_TIMEOUT", "15s")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if cfg.Port != ":9999" {
		t.Fatalf("expected port :9999, got %q", cfg.Port)
	}
	if cfg.LogLevel != "debug" {
		t.Fatalf("expected log level debug, got %q", cfg.LogLevel)
	}
	if len(cfg.AdminTelegramIDs) != 2 || cfg.AdminTelegramIDs[0] != 123 || cfg.AdminTelegramIDs[1] != 456 {
		t.Fatalf("unexpected admin ids: %#v", cfg.AdminTelegramIDs)
	}
	if cfg.ShutdownTimeout != 11*time.Second {
		t.Fatalf("unexpected shutdown timeout: %v", cfg.ShutdownTimeout)
	}
	if cfg.HTTPReadHeaderTimeout != 12*time.Second {
		t.Fatalf("unexpected read header timeout: %v", cfg.HTTPReadHeaderTimeout)
	}
	if cfg.HTTPReadTimeout != 13*time.Second {
		t.Fatalf("unexpected read timeout: %v", cfg.HTTPReadTimeout)
	}
	if cfg.HTTPWriteTimeout != 14*time.Second {
		t.Fatalf("unexpected write timeout: %v", cfg.HTTPWriteTimeout)
	}
	if cfg.HTTPIdleTimeout != 15*time.Second {
		t.Fatalf("unexpected idle timeout: %v", cfg.HTTPIdleTimeout)
	}
}

func TestLoad_RequiredEnvValidation(t *testing.T) {
	// Задание: проверка, что обязательные поля валидируются
	t.Setenv("APP_ENV", "prod")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("TELEGRAM_BOT_TOKEN", "")

	_, err := Load()
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	msg := err.Error()
	if !strings.Contains(msg, "DATABASE_URL is required") {
		t.Fatalf("expected DATABASE_URL error, got: %s", msg)
	}
	if !strings.Contains(msg, "TELEGRAM_BOT_TOKEN is required") {
		t.Fatalf("expected TELEGRAM_BOT_TOKEN error, got: %s", msg)
	}
}

func TestLoad_TelegramTokenOptionalInDev(t *testing.T) {
	// Задание: в dev TELEGRAM_BOT_TOKEN может быть пустым (чтобы локально подняться без Telegram).
	t.Setenv("APP_ENV", "dev")
	t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("TELEGRAM_BOT_TOKEN", "")

	_, err := Load()
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}

func TestGetInt64SliceEnv_Empty(t *testing.T) {
	// Задание: пустой env → nil slice
	t.Setenv("ADMIN_TELEGRAM_IDS", "")
	ids, err := getInt64SliceEnv("ADMIN_TELEGRAM_IDS")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if ids != nil {
		t.Fatalf("expected nil ids, got %#v", ids)
	}
}

func TestGetInt64SliceEnv_InvalidValue(t *testing.T) {
	// Задание: нечисловое значение должно возвращать ошибку
	t.Setenv("ADMIN_TELEGRAM_IDS", "123, abc")
	_, err := getInt64SliceEnv("ADMIN_TELEGRAM_IDS")
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "invalid ADMIN_TELEGRAM_IDS") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGetDurationEnv_Invalid_FallbackUsed(t *testing.T) {
	// Задание: некорректный duration не должен валить запуск, должен применяться fallback
	t.Setenv("HTTP_READ_TIMEOUT", "not-a-duration")
	got := getDurationEnv("HTTP_READ_TIMEOUT", 15*time.Second)
	if got != 15*time.Second {
		t.Fatalf("expected fallback 15s, got %v", got)
	}
}
