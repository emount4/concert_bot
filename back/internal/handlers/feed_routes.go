package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Задание: лента отзывов.

func registerFeedRoutes(r *gin.Engine, cfg *RouterDeps) {
	r.GET("/feed", func(c *gin.Context) {
		if cfg.Feed == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "feed service not configured"})
			return
		}

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

		items, err := cfg.Feed.ListFeed(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "feed failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOFeedItems(items)})
	})
}
