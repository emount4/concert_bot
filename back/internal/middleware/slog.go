package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// Задание: slog request logging middleware
func Slog() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery

		c.Next()

		status := c.Writer.Status()
		latency := time.Since(start)

		if rawQuery != "" {
			path = path + "?" + rawQuery
		}

		level := slog.LevelInfo
		switch {
		case status >= 500:
			level = slog.LevelError
		case status >= 400:
			level = slog.LevelWarn
		}

		slog.LogAttrs(
			c.Request.Context(),
			level,
			"http request",
			slog.String("method", c.Request.Method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("client_ip", c.ClientIP()),
		)
	}
}
