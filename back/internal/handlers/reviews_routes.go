package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/middleware"
	"github.com/yourname/concert-reviews-backend/internal/repository"
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
	auth.Use(middleware.TelegramAuth(cfg.Auth))

	// Задание: проверить, писал ли пользователь рецензию на концерт.
	// GET /reviews/my?concert_id=123
	auth.GET("/reviews/my", handleGetMyReview(cfg))
	auth.POST("/reviews", handleCreateReview(cfg))
}

func handleGetMyReview(cfg *RouterDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		review, exists, err := cfg.Reviews.GetMyReviewByConcert(c.Request.Context(), user.ID, concertID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "get my review failed"})
			return
		}
		if !exists {
			c.JSON(http.StatusOK, gin.H{"exists": false})
			return
		}
		c.JSON(http.StatusOK, gin.H{"exists": true, "review": toDTOMyReviewView(review)})
	}
}

func handleCreateReview(cfg *RouterDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		created, err := cfg.Reviews.CreateReview(c.Request.Context(), user.ID, repository.ReviewCreateParams{
			ConcertID:              req.ConcertID,
			Title:                  strings.TrimSpace(req.Title),
			Text:                   strings.TrimSpace(req.Text),
			MediaURLs:              req.MediaURLs,
			ExecutionRating:        req.ExecutionRating,
			SetlistDynamicsRating:  req.SetlistDynamicsRating,
			CrowdInteractionRating: req.CrowdInteractionRating,
			SoundEngineerRating:    req.SoundEngineerRating,
			VibeRating:             req.VibeRating,
		})
		if err != nil {
			type badRequester interface {
				BadRequest() bool
			}

			switch {
			case errors.Is(err, repository.ErrConcertNotFound):
				c.JSON(http.StatusBadRequest, gin.H{"error": "concert not found"})
				return
			case func() bool {
				br, ok := err.(badRequester)
				return ok && br.BadRequest()
			}():
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "create review failed"})
				return
			}
		}

		c.JSON(http.StatusCreated, toDTOReviewView(created))
	}
}
