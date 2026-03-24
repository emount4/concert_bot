package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Задание: системные роуты (health/readiness)
//
// Почему это отдельным файлом:
// - эти ручки относятся к эксплуатации сервиса (k8s/monitoring), а не к доменной логике;
// - так `router.go` не разрастается, когда появятся концерты/рецензии/админка.

func registerSystemRoutes(r *gin.Engine, ready ReadyChecker) {
	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// /ready должен отвечать только если сервис действительно готов.
	// Для нас готовность = БД доступна.
	r.GET("/ready", func(c *gin.Context) {
		if ready == nil {
			c.String(http.StatusServiceUnavailable, "db not configured")
			return
		}
		if err := ready.Ready(c.Request.Context()); err != nil {
			c.String(http.StatusServiceUnavailable, "not ready")
			return
		}
		c.String(http.StatusOK, "ok")
	})
}
