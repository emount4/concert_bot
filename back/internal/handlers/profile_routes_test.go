package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	authcontract "github.com/yourname/concert-reviews-backend/internal/auth"
	"github.com/yourname/concert-reviews-backend/internal/dto"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: unit-тесты базовых эндпоинтов /me.

type authMock struct {
	user *repository.UserView
	err  error
}

func (m *authMock) Authenticate(_ context.Context, initDataRaw string) (*repository.UserView, error) {
	if initDataRaw == "" && m.err == nil {
		return nil, authcontract.ErrMissingInitData
	}
	return m.user, m.err
}

func TestMe_ReturnsCurrentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	a := &authMock{user: &repository.UserView{ID: 10, TelegramID: 123, FirstName: "Mark"}}

	r := gin.New()
	registerProfileRoutes(r, &RouterDeps{Auth: a})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("X-Telegram-Init-Data", "dummy")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d; body=%s", http.StatusOK, w.Code, w.Body.String())
	}

	var got dto.UserView
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("unmarshal response: %v; body=%s", err, w.Body.String())
	}
	if got.ID != 10 || got.TelegramID != 123 || got.FirstName != "Mark" {
		t.Fatalf("unexpected user: %+v", got)
	}
}

func TestMe_UnauthorizedWithoutHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	registerProfileRoutes(r, &RouterDeps{Auth: &authMock{user: &repository.UserView{ID: 1}}})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d; body=%s", http.StatusUnauthorized, w.Code, w.Body.String())
	}
}

func TestMe_AuthServiceNotConfigured(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	registerProfileRoutes(r, &RouterDeps{Auth: nil})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("X-Telegram-Init-Data", "dummy")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected %d, got %d; body=%s", http.StatusInternalServerError, w.Code, w.Body.String())
	}
}

func TestMe_InvalidInitDataMapsTo401(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	registerProfileRoutes(r, &RouterDeps{Auth: &authMock{err: authcontract.ErrInvalidInitData}})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("X-Telegram-Init-Data", "dummy")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d; body=%s", http.StatusUnauthorized, w.Code, w.Body.String())
	}
}
