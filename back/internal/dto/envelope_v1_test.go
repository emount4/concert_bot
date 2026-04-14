package dto

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestAPIErrorResponseJSON(t *testing.T) {
	value := APIErrorResponse{
		ErrorCode: "invalid_payload",
		Message:   "payload is invalid",
		Details: map[string]any{
			"field": "email",
		},
	}

	raw, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}

	got := string(raw)
	if !containsAll(got, []string{`"error_code":"invalid_payload"`, `"message":"payload is invalid"`, `"field":"email"`}) {
		t.Fatalf("unexpected JSON: %s", got)
	}
}

func TestAPIListResponseJSON(t *testing.T) {
	value := APIListResponse[string]{
		Items: []string{"a", "b"},
		Meta: &ListMeta{
			Page:     1,
			PageSize: 20,
			Total:    2,
		},
	}

	raw, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}

	got := string(raw)
	if !containsAll(got, []string{`"items":["a","b"]`, `"page":1`, `"page_size":20`, `"total":2`}) {
		t.Fatalf("unexpected JSON: %s", got)
	}
}

func containsAll(s string, chunks []string) bool {
	for _, chunk := range chunks {
		if !contains(s, chunk) {
			return false
		}
	}
	return true
}

func contains(s, needle string) bool {
	return strings.Contains(s, needle)
}
