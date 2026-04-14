package dto

// APIErrorResponse — единый формат ошибок API v1.
type APIErrorResponse struct {
	ErrorCode string         `json:"error_code"`
	Message   string         `json:"message"`
	Details   map[string]any `json:"details,omitempty"`
}

// CursorMeta — курсорная пагинация.
type CursorMeta struct {
	NextCursor string `json:"next_cursor,omitempty"`
}

// PageMeta — страничная пагинация.
type PageMeta struct {
	Page     int `json:"page,omitempty"`
	PageSize int `json:"page_size,omitempty"`
	Total    int `json:"total,omitempty"`
}

// ListMeta совмещает cursor и page стратегии.
type ListMeta struct {
	NextCursor string `json:"next_cursor,omitempty"`
	Page       int    `json:"page,omitempty"`
	PageSize   int    `json:"page_size,omitempty"`
	Total      int    `json:"total,omitempty"`
}

// APIListResponse — стандартный формат ответов со списком.
type APIListResponse[T any] struct {
	Items []T      `json:"items"`
	Meta  *ListMeta `json:"meta,omitempty"`
}
