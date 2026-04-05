package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: публичные read-эндпоинты для каталога (venues/artists/concerts).

func registerCatalogRoutes(r *gin.Engine, deps *RouterDeps) {
	if deps.Catalog == nil {
		// Это ошибка wiring'а, не пользовательская.
		panic("catalog service not configured")
	}

	parseLimitOffset := func(c *gin.Context) (int, int) {
		limit := 20
		offset := 0
		if v := c.Query("limit"); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				limit = n
			}
		}
		if v := c.Query("offset"); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				offset = n
			}
		}
		return limit, offset
	}

	parseID := func(c *gin.Context) (uint64, bool) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return 0, false
		}
		return id, true
	}

	r.GET("/venues", func(c *gin.Context) {
		limit, offset := parseLimitOffset(c)
		items, err := deps.Catalog.ListVenuesPublic(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list venues failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOVenueViews(items)})
	})

	r.GET("/artists", func(c *gin.Context) {
		limit, offset := parseLimitOffset(c)
		items, err := deps.Catalog.ListArtistsPublic(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list artists failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOArtistViews(items)})
	})

	r.GET("/concerts", func(c *gin.Context) {
		limit, offset := parseLimitOffset(c)
		items, err := deps.Catalog.ListConcertsPublic(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list concerts failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOConcertPublicViews(items)})
	})

	r.GET("/concerts/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		item, err := deps.Catalog.GetConcertPublic(c.Request.Context(), id)
		if err != nil {
			if errors.Is(err, repository.ErrConcertNotFoundPublic) {
				c.JSON(http.StatusNotFound, gin.H{"error": "concert not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "get concert failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOConcertPublicView(*item))
	})

	// Artist detail: artist + его концерты.
	r.GET("/artists/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		limit, offset := parseLimitOffset(c)
		item, err := deps.Catalog.GetArtistPublic(c.Request.Context(), id, limit, offset)
		if err != nil {
			if errors.Is(err, repository.ErrArtistNotFoundPublic) {
				c.JSON(http.StatusNotFound, gin.H{"error": "artist not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "get artist failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOArtistPublicView(item))
	})

	// Venue detail: площадка + её концерты.
	r.GET("/venues/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		limit, offset := parseLimitOffset(c)
		item, err := deps.Catalog.GetVenuePublic(c.Request.Context(), id, limit, offset)
		if err != nil {
			if errors.Is(err, repository.ErrVenueNotFoundPublic) {
				c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "get venue failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOVenuePublicView(item))
	})

	// Рецензии концерта (публично: только approved).
	r.GET("/concerts/:id/reviews", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		limit, offset := parseLimitOffset(c)
		items, err := deps.Catalog.ListConcertReviewsApproved(c.Request.Context(), id, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list concert reviews failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOConcertReviewItems(items)})
	})
}
