package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/middleware"
	"github.com/yourname/concert-reviews-backend/internal/repository"
	"github.com/yourname/concert-reviews-backend/internal/services/score"
)

// Задание: доменные ручки отзывов.

type createReviewRequest struct {
	ConcertID uint64   `json:"concert_id"`
	Title     string   `json:"title"`
	Text      string   `json:"text"`
	MediaURLs []string `json:"media_urls"`

	ExecutionRating        int `json:"execution_rating"`
	SetlistDynamicsRating  int `json:"setlist_dynamics_rating"`
	CrowdInteractionRating int `json:"crowd_interaction_rating"`
	SoundEngineerRating    int `json:"sound_engineer_rating"`
	VibeRating             int `json:"vibe_rating"`
}

func registerReviewRoutes(r *gin.Engine, cfg *RouterDeps) {
	// Write endpoints — только с Telegram auth.
	auth := r.Group("/")
	auth.Use(middleware.TelegramAuth(cfg.Config, cfg.DB))

	// Задание: проверить, писал ли пользователь рецензию на концерт.
	// GET /reviews/my?concert_id=123
	auth.GET("/reviews/my", func(c *gin.Context) {
		user, ok := middleware.GetUser(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		concertID, err := strconv.ParseUint(c.Query("concert_id"), 10, 64)
		if err != nil || concertID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "concert_id is required"})
			return
		}

		review, exists, err := repository.GetMyReviewByConcert(c.Request.Context(), cfg.DB.Gorm(), user.ID, concertID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "get my review failed"})
			return
		}
		if !exists {
			c.JSON(http.StatusOK, gin.H{"exists": false})
			return
		}
		c.JSON(http.StatusOK, gin.H{"exists": true, "review": review})
	})

	auth.POST("/reviews", func(c *gin.Context) {
		user, ok := middleware.GetUser(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		if user.IsBanned {
			c.JSON(http.StatusForbidden, gin.H{"error": "banned"})
			return
		}

		var req createReviewRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		if req.ConcertID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "concert_id is required"})
			return
		}

		title := strings.TrimSpace(req.Title)
		text := strings.TrimSpace(req.Text)
		if title == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
			return
		}
		if text == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "text is required"})
			return
		}

		s, err := score.Compute(score.Input{
			Execution:        req.ExecutionRating,
			SetlistDynamics:  req.SetlistDynamicsRating,
			CrowdInteraction: req.CrowdInteractionRating,
			SoundEngineer:    req.SoundEngineerRating,
			Vibe:             req.VibeRating,
		})
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		created, err := repository.CreateReview(c.Request.Context(), cfg.DB.Gorm(), user.ID, repository.ReviewCreateParams{
			ConcertID:              req.ConcertID,
			Title:                  title,
			Text:                   text,
			MediaURLs:              req.MediaURLs,
			ExecutionRating:        req.ExecutionRating,
			SetlistDynamicsRating:  req.SetlistDynamicsRating,
			CrowdInteractionRating: req.CrowdInteractionRating,
			SoundEngineerRating:    req.SoundEngineerRating,
			VibeRating:             req.VibeRating,
			Score:                  s,
		})
		if err != nil {
			if errors.Is(err, repository.ErrConcertNotFound) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "concert not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create review failed"})
			return
		}

		c.JSON(http.StatusCreated, created)
	})
}
