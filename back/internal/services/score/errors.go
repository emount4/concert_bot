package score

import "errors"

// Задание: ошибки валидации score.

var ErrInvalidRating = errors.New("rating must be in range 1..10")
