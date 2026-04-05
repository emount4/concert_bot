package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/dto"
	"github.com/yourname/concert-reviews-backend/internal/middleware"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: admin API (CRUD справочников, модерация, баны).

func registerAdminRoutes(r *gin.Engine, deps *RouterDeps) {
	if deps.Admin == nil {
		// Это ошибка wiring'а, не пользовательская.
		panic("admin service not configured")
	}

	admin := r.Group("/admin")
	// Задание: в DEV админку можно тестировать без Telegram (включается флагом EnableDevWrite).
	if deps.Config == nil || !deps.Config.EnableDevWrite {
		admin.Use(middleware.TelegramAuth(deps.Auth))
		admin.Use(middleware.AdminOnly())
	}

	// Pagination helpers
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

	// Venues
	admin.GET("/venues", func(c *gin.Context) {
		limit, offset := parseLimitOffset(c)
		items, err := deps.Admin.ListVenues(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list venues failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOVenueViews(items)})
	})
	admin.POST("/venues", func(c *gin.Context) {
		var req dto.VenueUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		req.City = strings.TrimSpace(req.City)
		if req.Name == "" || req.City == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name and city are required"})
			return
		}
		created, err := deps.Admin.CreateVenue(c.Request.Context(), toRepoVenueUpsert(req))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create venue failed"})
			return
		}
		c.JSON(http.StatusCreated, toDTOVenueView(*created))
	})
	admin.PATCH("/venues/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req dto.VenueUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		req.City = strings.TrimSpace(req.City)
		if req.Name == "" || req.City == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name and city are required"})
			return
		}
		updated, err := deps.Admin.UpdateVenue(c.Request.Context(), id, toRepoVenueUpsert(req))
		if err != nil {
			if errors.Is(err, repository.ErrVenueNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update venue failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOVenueView(*updated))
	})
	admin.DELETE("/venues/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := deps.Admin.DeleteVenue(c.Request.Context(), id); err != nil {
			if errors.Is(err, repository.ErrVenueNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete venue failed"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// Artists
	admin.GET("/artists", func(c *gin.Context) {
		limit, offset := parseLimitOffset(c)
		items, err := deps.Admin.ListArtists(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list artists failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOArtistViews(items)})
	})
	admin.POST("/artists", func(c *gin.Context) {
		var req dto.ArtistUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
			return
		}
		created, err := deps.Admin.CreateArtist(c.Request.Context(), toRepoArtistUpsert(req))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create artist failed"})
			return
		}
		c.JSON(http.StatusCreated, toDTOArtistView(*created))
	})
	admin.PATCH("/artists/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req dto.ArtistUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
			return
		}
		updated, err := deps.Admin.UpdateArtist(c.Request.Context(), id, toRepoArtistUpsert(req))
		if err != nil {
			if errors.Is(err, repository.ErrArtistNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "artist not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update artist failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOArtistView(*updated))
	})
	admin.DELETE("/artists/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := deps.Admin.DeleteArtist(c.Request.Context(), id); err != nil {
			if errors.Is(err, repository.ErrArtistNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "artist not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete artist failed"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// Concerts
	admin.GET("/concerts", func(c *gin.Context) {
		limit, offset := parseLimitOffset(c)
		items, err := deps.Admin.ListConcerts(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list concerts failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOConcertViews(items)})
	})
	admin.POST("/concerts", func(c *gin.Context) {
		var req dto.ConcertUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		if req.VenueID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "venue_id is required"})
			return
		}
		if req.StartsAt.IsZero() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "starts_at is required"})
			return
		}
		created, err := deps.Admin.CreateConcert(c.Request.Context(), toRepoConcertUpsert(req))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create concert failed"})
			return
		}
		c.JSON(http.StatusCreated, toDTOConcertView(*created))
	})
	admin.PATCH("/concerts/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req dto.ConcertUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		if req.VenueID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "venue_id is required"})
			return
		}
		if req.StartsAt.IsZero() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "starts_at is required"})
			return
		}
		updated, err := deps.Admin.UpdateConcert(c.Request.Context(), id, toRepoConcertUpsert(req))
		if err != nil {
			if errors.Is(err, repository.ErrConcertAdminNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "concert not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update concert failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOConcertView(*updated))
	})
	admin.DELETE("/concerts/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := deps.Admin.DeleteConcert(c.Request.Context(), id); err != nil {
			if errors.Is(err, repository.ErrConcertAdminNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "concert not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete concert failed"})
			return
		}
		c.Status(http.StatusNoContent)
	})

	// Review moderation
	admin.GET("/reviews", func(c *gin.Context) {
		limit, offset := parseLimitOffset(c)
		status := strings.TrimSpace(c.Query("status"))
		items, err := deps.Admin.ListReviewsForModeration(c.Request.Context(), status, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list reviews failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": toDTOAdminReviewListItems(items)})
	})
	admin.POST("/reviews/:id/approve", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		view, err := deps.Admin.ApproveReview(c.Request.Context(), id)
		if err != nil {
			if errors.Is(err, repository.ErrReviewNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "approve failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOReviewModerationView(view))
	})
	type rejectReq struct {
		Reason string `json:"reason"`
	}
	admin.POST("/reviews/:id/reject", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req rejectReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Reason = strings.TrimSpace(req.Reason)
		view, err := deps.Admin.RejectReview(c.Request.Context(), id, req.Reason)
		if err != nil {
			if errors.Is(err, repository.ErrReviewNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "reject failed"})
			return
		}
		c.JSON(http.StatusOK, toDTOReviewModerationView(view))
	})

	// Ban/unban
	type banReq struct {
		Reason string `json:"reason"`
	}
	admin.POST("/users/:id/ban", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req banReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Reason = strings.TrimSpace(req.Reason)
		if err := deps.Admin.BanUser(c.Request.Context(), id, req.Reason); err != nil {
			if errors.Is(err, repository.ErrUserNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ban failed"})
			return
		}
		c.Status(http.StatusNoContent)
	})
	admin.POST("/users/:id/unban", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := deps.Admin.UnbanUser(c.Request.Context(), id); err != nil {
			if errors.Is(err, repository.ErrUserNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unban failed"})
			return
		}
		c.Status(http.StatusNoContent)
	})
}
