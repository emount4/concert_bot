package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Задание: подключение к БД (Gorm)
//
// Зачем это нужно:
// - мы хотим иметь единое место, где настраивается подключение к Postgres;
// - хотим уметь проверять готовность сервиса (readiness) через Ping к БД;
// - хотим корректно закрывать пул соединений при shutdown.
//
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

// Ready проверяет доступность БД.
// Это используется в /ready, чтобы оркестратор (или мониторинг) понимал: можно ли слать трафик в сервис.
func (d *DB) Ready(ctx context.Context) error {
	return d.sqlDB.PingContext(ctx)
}

func (d *DB) Close() error {
	return d.sqlDB.Close()
}
