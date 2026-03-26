package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port        string
	DatabaseURL string
	BotToken    string
	LogLevel    string

	// Список Telegram user_id, которым разрешён доступ к admin API/UI.
	AdminTelegramIDs []int64

	// Нужны, чтобы сервис не зависал на “вечных” соединениях и корректно завершался.
	// Формат duration: "10s", "500ms", "1m".
	ShutdownTimeout       time.Duration
	HTTPReadHeaderTimeout time.Duration
	HTTPReadTimeout       time.Duration
	HTTPWriteTimeout      time.Duration
	HTTPIdleTimeout       time.Duration
}

// Задание: проверка прав администратора по Telegram user_id.
func (c *Config) IsAdminTelegramID(telegramID int64) bool {
	for _, id := range c.AdminTelegramIDs {
		if id == telegramID {
			return true
		}
	}
	return false
}

func Load() (*Config, error) {
	adminIDs, err := getInt64SliceEnv("ADMIN_TELEGRAM_IDS")
	if err != nil {
		return nil, err
	}

	cfg := &Config{
		Port:        getEnv("PORT", ":8080"),
		DatabaseURL: strings.TrimSpace(os.Getenv("DATABASE_URL")),
		BotToken:    strings.TrimSpace(os.Getenv("TELEGRAM_BOT_TOKEN")),
		LogLevel:    strings.TrimSpace(getEnv("LOG_LEVEL", "info")),

		AdminTelegramIDs: adminIDs,

		ShutdownTimeout:       getDurationEnv("SHUTDOWN_TIMEOUT", 10*time.Second),
		HTTPReadHeaderTimeout: getDurationEnv("HTTP_READ_HEADER_TIMEOUT", 10*time.Second),
		HTTPReadTimeout:       getDurationEnv("HTTP_READ_TIMEOUT", 15*time.Second),
		HTTPWriteTimeout:      getDurationEnv("HTTP_WRITE_TIMEOUT", 15*time.Second),
		HTTPIdleTimeout:       getDurationEnv("HTTP_IDLE_TIMEOUT", 60*time.Second),
	}
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (c *Config) Validate() error {
	var err error
	if strings.TrimSpace(c.Port) == "" {
		err = errors.Join(err, errors.New("PORT is required"))
	}
	if c.DatabaseURL == "" {
		err = errors.Join(err, errors.New("DATABASE_URL is required"))
	}
	if c.BotToken == "" {
		err = errors.Join(err, errors.New("TELEGRAM_BOT_TOKEN is required"))
	}
	if c.ShutdownTimeout <= 0 {
		err = errors.Join(err, errors.New("SHUTDOWN_TIMEOUT must be > 0"))
	}
	if c.HTTPReadHeaderTimeout <= 0 {
		err = errors.Join(err, errors.New("HTTP_READ_HEADER_TIMEOUT must be > 0"))
	}
	if c.HTTPReadTimeout <= 0 {
		err = errors.Join(err, errors.New("HTTP_READ_TIMEOUT must be > 0"))
	}
	if c.HTTPWriteTimeout <= 0 {
		err = errors.Join(err, errors.New("HTTP_WRITE_TIMEOUT must be > 0"))
	}
	if c.HTTPIdleTimeout <= 0 {
		err = errors.Join(err, errors.New("HTTP_IDLE_TIMEOUT must be > 0"))
	}
	if err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}
	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	d, err := time.ParseDuration(value)
	if err != nil {
		// Возвращаем fallback, но ошибки конфигурации должны быть видны.
		// Поэтому валидацию делаем отдельным шагом (Validate), а здесь — безопасный парсинг.
		return fallback
	}
	return d
}

func getInt64SliceEnv(key string) ([]int64, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return nil, nil
	}
	parts := strings.Split(value, ",")
	result := make([]int64, 0, len(parts))
	for _, part := range parts {
		p := strings.TrimSpace(part)
		if p == "" {
			continue
		}
		v, err := strconv.ParseInt(p, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid %s value %q: %w", key, p, err)
		}
		result = append(result, v)
	}
	return result, nil
}
