package dto

import "time"

// Задание: DTO для HTTP API.
//
// Важно: JSON-теги и публичный контракт API живут здесь, а не в repository.

// Common

type UserView struct {
	ID         uint64  `json:"id"`
	TelegramID int64   `json:"telegram_id"`
	Username   *string `json:"username"`
	FirstName  string  `json:"first_name"`
	LastName   *string `json:"last_name"`
	AvatarURL  *string `json:"avatar_url"`
	IsAdmin    bool    `json:"is_admin"`
	IsBanned   bool    `json:"is_banned"`
}

// Profile

// Задание: DTO для /me/profile.
// Пока bio хранится только в клиенте (моками), поэтому на бэке отдаём пустую строку.

type ProfileReviewItem struct {
	ID           uint64    `json:"id"`
	ConcertTitle string    `json:"concert_title"`
	CreatedAt    time.Time `json:"created_at"`
	Status       string    `json:"status"`
	OverallScore int       `json:"overall_score"`
}

type UserProfile struct {
	ID            uint64              `json:"id"`
	DisplayName   string              `json:"display_name"`
	Handle        string              `json:"handle"`
	CreatedAt     time.Time           `json:"created_at"`
	Bio           string              `json:"bio"`
	ReviewsCount  int                 `json:"reviews_count"`
	ApprovedCount int                 `json:"approved_count"`
	PendingCount  int                 `json:"pending_count"`
	AvatarURL     *string             `json:"avatar_url"`
	RecentReviews []ProfileReviewItem `json:"recent_reviews"`
}

// Feed

type FeedItem struct {
	ID        uint64    `json:"id"`
	Score     int       `json:"score"`
	Title     string    `json:"title"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`

	User    UserView `json:"user"`
	Concert struct {
		ID    uint64  `json:"id"`
		Title *string `json:"title"`
	} `json:"concert"`
}

// Reviews

type ReviewView struct {
	ID               uint64    `json:"id"`
	UserID           uint64    `json:"user_id"`
	ConcertID        uint64    `json:"concert_id"`
	Title            string    `json:"title"`
	Text             string    `json:"text"`
	MediaURLs        []string  `json:"media_urls"`
	Score            int       `json:"score"`
	ModerationStatus string    `json:"moderation_status"`
	CreatedAt        time.Time `json:"created_at"`
}

type MyReviewView struct {
	ID               uint64    `json:"id"`
	ConcertID        uint64    `json:"concert_id"`
	Score            int       `json:"score"`
	ModerationStatus string    `json:"moderation_status"`
	CreatedAt        time.Time `json:"created_at"`
}

type ConcertReviewItem struct {
	ID        uint64    `json:"id"`
	ConcertID uint64    `json:"concert_id"`
	Title     string    `json:"title"`
	Text      string    `json:"text"`
	Score     int       `json:"score"`
	CreatedAt time.Time `json:"created_at"`

	User UserView `json:"user"`
}

// Catalog (admin + public)

type VenueUpsert struct {
	Name        string  `json:"name"`
	City        string  `json:"city"`
	Address     string  `json:"address"`
	Links       string  `json:"links"`
	Capacity    *int    `json:"capacity"`
	Description string  `json:"description"`
	ImageURL    *string `json:"image_url"`
	Coordinates *string `json:"coordinates"`
	WebsiteURL  *string `json:"website_url"`
}

type VenueView struct {
	ID          uint64    `json:"id"`
	Name        string    `json:"name"`
	City        string    `json:"city"`
	Address     string    `json:"address"`
	Links       string    `json:"links"`
	Capacity    *int      `json:"capacity"`
	Description string    `json:"description"`
	ImageURL    *string   `json:"image_url"`
	Coordinates *string   `json:"coordinates"`
	WebsiteURL  *string   `json:"website_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ArtistUpsert struct {
	Name     string  `json:"name"`
	ImageURL *string `json:"image_url"`
}

type ArtistView struct {
	ID        uint64    `json:"id"`
	Name      string    `json:"name"`
	ImageURL  *string   `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ConcertUpsert struct {
	Title          *string   `json:"title"`
	VenueID        uint64    `json:"venue_id"`
	TicketPriceMin int       `json:"ticket_price_min"`
	TicketPriceMax int       `json:"ticket_price_max"`
	PosterURL      *string   `json:"poster_url"`
	Description    string    `json:"description"`
	WebsiteURL     *string   `json:"website_url"`
	StartsAt       time.Time `json:"starts_at"`
}

type ConcertView struct {
	ID             uint64    `json:"id"`
	Title          *string   `json:"title"`
	VenueID        uint64    `json:"venue_id"`
	TicketPriceMin int       `json:"ticket_price_min"`
	TicketPriceMax int       `json:"ticket_price_max"`
	PosterURL      *string   `json:"poster_url"`
	Description    string    `json:"description"`
	WebsiteURL     *string   `json:"website_url"`
	StartsAt       time.Time `json:"starts_at"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ConcertPublicView struct {
	ID              uint64       `json:"id"`
	Title           *string      `json:"title"`
	VenueID         uint64       `json:"venue_id"`
	Venue           VenueView    `json:"venue"`
	TicketPriceMin  int          `json:"ticket_price_min"`
	TicketPriceMax  int          `json:"ticket_price_max"`
	PosterURL       *string      `json:"poster_url"`
	Description     string       `json:"description"`
	WebsiteURL      *string      `json:"website_url"`
	StartsAt        time.Time    `json:"starts_at"`
	Artists         []ArtistView `json:"artists"`
	ReviewsCount    int          `json:"reviews_count"`
	ReviewsAvgScore float64      `json:"reviews_avg_score"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

type ArtistPublicView struct {
	Artist   ArtistView          `json:"artist"`
	Concerts []ConcertPublicView `json:"concerts"`
}

type VenuePublicView struct {
	Venue    VenueView           `json:"venue"`
	Concerts []ConcertPublicView `json:"concerts"`
}

// Admin reviews / moderation

type ReviewModerationView struct {
	ID               uint64    `json:"id"`
	ModerationStatus string    `json:"moderation_status"`
	ModerationReason string    `json:"moderation_reason"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type AdminReviewListItem struct {
	ID               uint64    `json:"id"`
	UserID           uint64    `json:"user_id"`
	ConcertID        uint64    `json:"concert_id"`
	Title            string    `json:"title"`
	Text             string    `json:"text"`
	Score            int       `json:"score"`
	ModerationStatus string    `json:"moderation_status"`
	CreatedAt        time.Time `json:"created_at"`
}
