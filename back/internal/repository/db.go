package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/yourname/concert-reviews-backend/internal/repository/models"
)

// подключение к БД (Gorm)
// Важно: Gorm поверх использует database/sql, поэтому "пул" фактически находится в *sql.DB.
// Мы достаём его через gormDB.DB().

type DB struct {
	gormDB *gorm.DB
	sqlDB  *sql.DB
}

func OpenPostgres(databaseURL string) (*DB, error) {
	gormDB, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open postgres: %w", err)
	}

	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql db: %w", err)
	}

	// Минимальные дефолты на MVP. Позже вынесем в конфиг.
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	return &DB{gormDB: gormDB, sqlDB: sqlDB}, nil
}

func (d *DB) Gorm() *gorm.DB {
	return d.gormDB
}

// AutoMigrate создаёт/обновляет таблицы под Gorm-модели.
// Задание: подготовка схемы БД через Gorm.
//
// Важно: не вызывай это автоматически в проде без контроля версий.
// Для продовых окружений лучше иметь отдельный шаг миграций.
func (d *DB) AutoMigrate() error {
	return d.gormDB.AutoMigrate(
		&models.User{},
		&models.Artist{},
		&models.Venue{},
		&models.Concert{},
		&models.ConcertArtist{},
		&models.Review{},
	)
}

// Ready проверяет доступность БД.
// Это используется в /ready, чтобы оркестратор (или мониторинг) понимал: можно ли слать трафик в сервис.
func (d *DB) Ready(ctx context.Context) error {
	return d.sqlDB.PingContext(ctx)
}

func (d *DB) Close() error {
	return d.sqlDB.Close()
}
