package reviews

import (
	"context"
	"strings"

	"github.com/yourname/concert-reviews-backend/internal/repository"
	"github.com/yourname/concert-reviews-backend/internal/services/score"
)

// Service — use-cases отзывов.
//
// Задание: скрыть детали хранения (Gorm) от HTTP-слоя.
// Handlers зависят от интерфейса в internal/handlers/types.go и могут мокать его в unit-тестах.
//
// Важно: этот сервис работает поверх repository и сам решает, как считать score.
type Service struct {
	db *repository.DB
}

func New(db *repository.DB) *Service {
	return &Service{db: db}
}

func (s *Service) GetMyReviewByConcert(ctx context.Context, userID uint64, concertID uint64) (*repository.MyReviewView, bool, error) {
	return repository.GetMyReviewByConcert(ctx, s.db.Gorm(), userID, concertID)
}

func (s *Service) CreateReview(ctx context.Context, userID uint64, p repository.ReviewCreateParams) (*repository.ReviewView, error) {
	if p.ConcertID == 0 {
		return nil, newBadRequest("concert_id is required")
	}

	title := strings.TrimSpace(p.Title)
	text := strings.TrimSpace(p.Text)
	if title == "" {
		return nil, newBadRequest("title is required")
	}
	if text == "" {
		return nil, newBadRequest("text is required")
	}

	scoreValue, err := score.Compute(score.Input{
		Execution:        p.ExecutionRating,
		SetlistDynamics:  p.SetlistDynamicsRating,
		CrowdInteraction: p.CrowdInteractionRating,
		SoundEngineer:    p.SoundEngineerRating,
		Vibe:             p.VibeRating,
	})
	if err != nil {
		return nil, newBadRequest(err.Error())
	}

	p.Title = title
	p.Text = text
	p.Score = scoreValue

	created, err := repository.CreateReview(ctx, s.db.Gorm(), userID, p)
	if err != nil {
		return nil, err
	}
	return created, nil
}
