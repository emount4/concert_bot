package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port        string
	DatabaseURL string
	BotToken    string
	LogLevel    string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:        getEnv("PORT", ":8080"),
		DatabaseURL: strings.TrimSpace(os.Getenv("DATABASE_URL")),
		BotToken:    strings.TrimSpace(os.Getenv("TELEGRAM_BOT_TOKEN")),
		LogLevel:    strings.TrimSpace(getEnv("LOG_LEVEL", "info")),
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
