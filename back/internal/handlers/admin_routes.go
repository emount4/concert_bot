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

// Задание: admin API (CRUD справочников, модерация, баны).

func registerAdminRoutes(r *gin.Engine, deps *RouterDeps) {
	admin := r.Group("/admin")
	admin.Use(middleware.TelegramAuth(deps.Config, deps.DB))
	admin.Use(middleware.AdminOnly())

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
		items, err := repository.ListVenues(c.Request.Context(), deps.DB.Gorm(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list venues failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": items})
	})
	admin.POST("/venues", func(c *gin.Context) {
		var req repository.VenueUpsert
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
		created, err := repository.CreateVenue(c.Request.Context(), deps.DB.Gorm(), req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create venue failed"})
			return
		}
		c.JSON(http.StatusCreated, created)
	})
	admin.PATCH("/venues/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req repository.VenueUpsert
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
		updated, err := repository.UpdateVenue(c.Request.Context(), deps.DB.Gorm(), id, req)
		if err != nil {
			if errors.Is(err, repository.ErrVenueNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update venue failed"})
			return
		}
		c.JSON(http.StatusOK, updated)
	})
	admin.DELETE("/venues/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := repository.DeleteVenue(c.Request.Context(), deps.DB.Gorm(), id); err != nil {
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
		items, err := repository.ListArtists(c.Request.Context(), deps.DB.Gorm(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list artists failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": items})
	})
	admin.POST("/artists", func(c *gin.Context) {
		var req repository.ArtistUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
			return
		}
		created, err := repository.CreateArtist(c.Request.Context(), deps.DB.Gorm(), req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create artist failed"})
			return
		}
		c.JSON(http.StatusCreated, created)
	})
	admin.PATCH("/artists/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req repository.ArtistUpsert
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
			return
		}
		updated, err := repository.UpdateArtist(c.Request.Context(), deps.DB.Gorm(), id, req)
		if err != nil {
			if errors.Is(err, repository.ErrArtistNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "artist not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update artist failed"})
			return
		}
		c.JSON(http.StatusOK, updated)
	})
	admin.DELETE("/artists/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := repository.DeleteArtist(c.Request.Context(), deps.DB.Gorm(), id); err != nil {
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
		items, err := repository.ListConcerts(c.Request.Context(), deps.DB.Gorm(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list concerts failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": items})
	})
	admin.POST("/concerts", func(c *gin.Context) {
		var req repository.ConcertUpsert
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
		created, err := repository.CreateConcert(c.Request.Context(), deps.DB.Gorm(), req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create concert failed"})
			return
		}
		c.JSON(http.StatusCreated, created)
	})
	admin.PATCH("/concerts/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		var req repository.ConcertUpsert
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
		updated, err := repository.UpdateConcert(c.Request.Context(), deps.DB.Gorm(), id, req)
		if err != nil {
			if errors.Is(err, repository.ErrConcertAdminNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "concert not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update concert failed"})
			return
		}
		c.JSON(http.StatusOK, updated)
	})
	admin.DELETE("/concerts/:id", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := repository.DeleteConcert(c.Request.Context(), deps.DB.Gorm(), id); err != nil {
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
		items, err := repository.ListReviewsForModeration(c.Request.Context(), deps.DB.Gorm(), status, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "list reviews failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": items})
	})
	admin.POST("/reviews/:id/approve", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		view, err := repository.ApproveReview(c.Request.Context(), deps.DB.Gorm(), id)
		if err != nil {
			if errors.Is(err, repository.ErrReviewNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "approve failed"})
			return
		}
		c.JSON(http.StatusOK, view)
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
		view, err := repository.RejectReview(c.Request.Context(), deps.DB.Gorm(), id, req.Reason)
		if err != nil {
			if errors.Is(err, repository.ErrReviewNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "reject failed"})
			return
		}
		c.JSON(http.StatusOK, view)
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
		if err := repository.BanUser(c.Request.Context(), deps.DB.Gorm(), id, req.Reason); err != nil {
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
		if err := repository.UnbanUser(c.Request.Context(), deps.DB.Gorm(), id); err != nil {
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
