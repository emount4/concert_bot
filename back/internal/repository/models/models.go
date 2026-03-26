package models

import (
	"time"

	"gorm.io/gorm"
)

// Задание: Gorm-модели для схемы БД (Postgres).
//
// Примечание по дизайну:
// - Везде добавлены created_at/updated_at, чтобы не “переделывать под прод”.
// - Некоторые поля из наброска сделаны nullable (Telegram не гарантирует username/аватар).
// - Для review добавлены поля рейтинга и статус модерации — это критично для твоего MVP.

type User struct {
	ID uint64 `gorm:"primaryKey"`

	TelegramID int64 `gorm:"not null;uniqueIndex"`

	Username  *string `gorm:"type:varchar(32)"`
	FirstName string  `gorm:"type:varchar(64);not null;default:''"`
	LastName  *string `gorm:"type:varchar(64)"`

	AvatarURL *string `gorm:"type:varchar(255)"`

	IsAdmin bool `gorm:"not null;default:false"`

	TotalReviews int    `gorm:"not null;default:0"`
	IsBanned     bool   `gorm:"not null;default:false"`
	BanReason    string `gorm:"type:text;not null;default:''"`

	CreatedAt time.Time      `gorm:"not null"`
	UpdatedAt time.Time      `gorm:"not null"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type Artist struct {
	ID uint64 `gorm:"primaryKey"`

	Name     string  `gorm:"type:varchar(255);not null;uniqueIndex"`
	ImageURL *string `gorm:"type:varchar(255)"`

	CreatedAt time.Time      `gorm:"not null"`
	UpdatedAt time.Time      `gorm:"not null"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type Venue struct {
	ID uint64 `gorm:"primaryKey"`

	Name        string `gorm:"type:varchar(255);not null"`
	City        string `gorm:"type:varchar(100);not null"`
	Address     string `gorm:"type:text;not null;default:''"`
	Links       string `gorm:"type:text;not null;default:''"`
	Capacity    *int
	Desc        string  `gorm:"column:description;type:text;not null;default:''"`
	ImageURL    *string `gorm:"type:varchar(512)"`
	Coordinates *string `gorm:"type:varchar(255)"`
	WebsiteURL  *string `gorm:"type:varchar(512)"`

	CreatedAt time.Time      `gorm:"not null"`
	UpdatedAt time.Time      `gorm:"not null"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type Concert struct {
	ID uint64 `gorm:"primaryKey"`

	Title *string `gorm:"type:varchar(255)"`

	VenueID uint64 `gorm:"not null;index"`
	Venue   Venue  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

	TicketPriceMin int `gorm:"not null;default:0"`
	TicketPriceMax int `gorm:"not null;default:0"`

	PosterURL   *string `gorm:"type:varchar(255)"`
	Description string  `gorm:"type:text;not null;default:''"`
	WebsiteURL  *string `gorm:"type:varchar(255)"`

	StartsAt time.Time `gorm:"not null;index"`

	ConcertArtists []ConcertArtist `gorm:"foreignKey:ConcertID"`

	CreatedAt time.Time      `gorm:"not null"`
	UpdatedAt time.Time      `gorm:"not null"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// ConcertArtist — join-таблица между концертами и артистами.
// Важно: composite primary key (artist_id, concert_id).
// Role позволяет указать headliner/support/etc.

type ConcertArtist struct {
	ArtistID uint64 `gorm:"primaryKey;not null"`
	Artist   Artist `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

	ConcertID uint64  `gorm:"primaryKey;not null;index"`
	Concert   Concert `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Role string `gorm:"type:varchar(64);not null;default:''"`

	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}

type Review struct {
	ID uint64 `gorm:"primaryKey"`

	UserID    uint64  `gorm:"not null;index"`
	User      User    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	ConcertID uint64  `gorm:"not null;index"`
	Concert   Concert `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

	Title string `gorm:"column:name;type:varchar(255);not null;default:''"`
	Text  string `gorm:"type:text;not null;default:''"`

	// MediaURLs: в наброске был varchar[]; используем text[] (дешевле/проще).
	// Примечание: массивы поддерживаются Postgres; это ок для локала и прода.
	MediaURLs []string `gorm:"type:text[];not null;default:'{}'"`

	// Рейтинг (под формулу из MVP).
	ExecutionRating        int `gorm:"not null;default:0"`
	SetlistDynamicsRating  int `gorm:"not null;default:0"`
	CrowdInteractionRating int `gorm:"not null;default:0"`
	SoundEngineerRating    int `gorm:"not null;default:0"`
	VibeRating             int `gorm:"not null;default:0"`
	Score                  int `gorm:"not null;default:0;index"`

	// Модерация.
	ModerationStatus string `gorm:"type:varchar(32);not null;default:'pending';index"` // pending|approved|rejected
	ModerationReason string `gorm:"type:text;not null;default:''"`

	CreatedAt time.Time      `gorm:"not null;index"`
	UpdatedAt time.Time      `gorm:"not null"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
