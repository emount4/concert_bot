package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: лента отзывов.

func registerFeedRoutes(r *gin.Engine, cfg *RouterDeps) {
	r.GET("/feed", func(c *gin.Context) {
		limit := 20
		if v := c.Query("limit"); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				limit = n
			}
		}

		offset := 0
		if v := c.Query("offset"); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				offset = n
			}
		}

		items, err := repository.ListFeed(c.Request.Context(), cfg.DB.Gorm(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "feed failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": items})
	})
}
