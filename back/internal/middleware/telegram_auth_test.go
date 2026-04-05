package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	authcontract "github.com/yourname/concert-reviews-backend/internal/auth"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: unit-тесты middleware TelegramAuth без БД.

type authMock struct {
	user *repository.UserView
	err  error
}

func (m authMock) Authenticate(_ context.Context, _ string) (*repository.UserView, error) {
	return m.user, m.err
}

func TestTelegramAuth_MissingInitData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/x", TelegramAuth(authMock{err: authcontract.ErrMissingInitData}), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", http.StatusUnauthorized, w.Code)
	}
}

func TestTelegramAuth_OK_SetsUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/x", TelegramAuth(authMock{user: &repository.UserView{ID: 42}}), func(c *gin.Context) {
		u, ok := GetUser(c)
		if !ok || u == nil || u.ID != 42 {
			c.Status(http.StatusUnauthorized)
			return
		}
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	// Хедер необязателен в этом тесте, потому что mock игнорирует initData.
	req.Header.Set("X-Telegram-Init-Data", "dummy")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, w.Code)
	}
}
