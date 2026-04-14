package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestV1RouteSkeleton_ReturnsNotImplementedForCoreFlows(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	registerV1RouteSkeleton(r)

	testCases := []struct {
		name   string
		method string
		path   string
	}{
		{name: "auth_tg_login", method: http.MethodPost, path: "/api/v1/auth/tg-login"},
		{name: "moderation_approve", method: http.MethodPost, path: "/api/v1/admin/reviews/11111111-1111-1111-1111-111111111111/approve"},
		{name: "media_presign", method: http.MethodPost, path: "/api/v1/reviews/media/presign"},
		{name: "likes_add", method: http.MethodPost, path: "/api/v1/reviews/11111111-1111-1111-1111-111111111111/like"},
		{name: "likes_remove", method: http.MethodDelete, path: "/api/v1/reviews/11111111-1111-1111-1111-111111111111/like"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(tc.method, tc.path, nil)
			r.ServeHTTP(w, req)

			if w.Code != http.StatusNotImplemented {
				t.Fatalf("expected %d, got %d for %s %s", http.StatusNotImplemented, w.Code, tc.method, tc.path)
			}
		})
	}
}
