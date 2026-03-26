package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Задание: middleware, который пропускает только админов.
// Требует, чтобы до него был выполнен TelegramAuth (чтобы user оказался в context).
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := GetUser(c)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		if user.IsBanned {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "banned"})
			return
		}
		if !user.IsAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		c.Next()
	}
}
