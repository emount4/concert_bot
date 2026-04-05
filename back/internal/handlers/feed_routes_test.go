package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/yourname/concert-reviews-backend/internal/dto"
	"github.com/yourname/concert-reviews-backend/internal/repository"
)

// Задание: unit-тесты для HTTP-роута GET /feed (без зависимости от Gorm/БД).

type feedServiceMock struct {
	called    bool
	gotLimit  int
	gotOffset int
	items     []repository.FeedItem
	err       error
}

func (m *feedServiceMock) ListFeed(_ context.Context, limit, offset int) ([]repository.FeedItem, error) {
	m.called = true
	m.gotLimit = limit
	m.gotOffset = offset
	return m.items, m.err
}

func TestFeed_DefaultPagination(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mock := &feedServiceMock{items: []repository.FeedItem{{ID: 1}}}
	feed := FeedService(mock)

	r := gin.New()
	registerFeedRoutes(r, &RouterDeps{Feed: feed})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/feed", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d; body=%s", http.StatusOK, w.Code, w.Body.String())
	}
	if !mock.called {
		t.Fatalf("expected feed service to be called")
	}
	if mock.gotLimit != 20 || mock.gotOffset != 0 {
		t.Fatalf("expected limit=20 offset=0, got limit=%d offset=%d", mock.gotLimit, mock.gotOffset)
	}

	var resp struct {
		Items []dto.FeedItem `json:"items"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v; body=%s", err, w.Body.String())
	}
	if len(resp.Items) != 1 || resp.Items[0].ID != 1 {
		t.Fatalf("unexpected items: %+v", resp.Items)
	}
}

func TestFeed_ParsesLimitOffset(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mock := &feedServiceMock{items: []repository.FeedItem{{ID: 2}}}
	feed := FeedService(mock)

	r := gin.New()
	registerFeedRoutes(r, &RouterDeps{Feed: feed})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/feed?limit=7&offset=11", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d; body=%s", http.StatusOK, w.Code, w.Body.String())
	}
	if mock.gotLimit != 7 || mock.gotOffset != 11 {
		t.Fatalf("expected limit=7 offset=11, got limit=%d offset=%d", mock.gotLimit, mock.gotOffset)
	}
}

func TestFeed_ServiceNotConfigured(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	registerFeedRoutes(r, &RouterDeps{Feed: nil})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/feed", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected %d, got %d; body=%s", http.StatusInternalServerError, w.Code, w.Body.String())
	}
}
