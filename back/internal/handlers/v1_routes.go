package handlers

import "github.com/gin-gonic/gin"

// registerV1RouteSkeleton фиксирует целевую структуру endpoint-групп.
// Это не runtime-роутер продакшена, а опорный слой для поэтапной миграции.
func registerV1RouteSkeleton(r *gin.Engine) {
	v1 := r.Group("/api/v1")

	auth := v1.Group("/auth")
	{
		auth.POST("/tg-login", notImplementedV1)
		auth.POST("/tg-bind", notImplementedV1)
		auth.POST("/login", notImplementedV1)
		auth.POST("/register", notImplementedV1)
		auth.POST("/refresh", notImplementedV1)
		auth.POST("/logout", notImplementedV1)
	}

	catalog := v1.Group("/")
	{
		catalog.GET("/concerts", notImplementedV1)
		catalog.GET("/concerts/:concert_id", notImplementedV1)
		catalog.GET("/artists", notImplementedV1)
		catalog.GET("/artists/:artist_id", notImplementedV1)
		catalog.GET("/venues", notImplementedV1)
		catalog.GET("/venues/:venue_id", notImplementedV1)
	}

	reviews := v1.Group("/reviews")
	{
		reviews.GET("/feed", notImplementedV1)
		reviews.GET("/:review_id", notImplementedV1)
		reviews.POST("", notImplementedV1)
		reviews.POST("/media/presign", notImplementedV1)
		reviews.POST("/:review_id/like", notImplementedV1)
		reviews.DELETE("/:review_id/like", notImplementedV1)
	}

	profile := v1.Group("/")
	{
		profile.GET("/me", notImplementedV1)
		profile.GET("/me/profile", notImplementedV1)
		profile.GET("/me/reviews", notImplementedV1)
		profile.GET("/users/:user_id/public", notImplementedV1)
	}

	admin := v1.Group("/admin")
	{
		admin.GET("/reviews", notImplementedV1)
		admin.POST("/reviews/:review_id/approve", notImplementedV1)
		admin.POST("/reviews/:review_id/reject", notImplementedV1)
		admin.GET("/users", notImplementedV1)
		admin.POST("/users/:user_id/ban", notImplementedV1)
		admin.POST("/users/:user_id/unban", notImplementedV1)
		admin.POST("/users/:user_id/role", notImplementedV1)
		admin.GET("/concerts", notImplementedV1)
		admin.POST("/concerts", notImplementedV1)
		admin.PATCH("/concerts/:concert_id", notImplementedV1)
		admin.DELETE("/concerts/:concert_id", notImplementedV1)
		admin.GET("/artists", notImplementedV1)
		admin.POST("/artists", notImplementedV1)
		admin.PATCH("/artists/:artist_id", notImplementedV1)
		admin.DELETE("/artists/:artist_id", notImplementedV1)
		admin.GET("/venues", notImplementedV1)
		admin.POST("/venues", notImplementedV1)
		admin.PATCH("/venues/:venue_id", notImplementedV1)
		admin.DELETE("/venues/:venue_id", notImplementedV1)
	}
}

func notImplementedV1(c *gin.Context) {
	c.JSON(501, gin.H{
		"error_code": "not_implemented",
		"message":    "endpoint is part of v1 migration plan",
	})
}
