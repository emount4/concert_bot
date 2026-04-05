package reviews

// badRequestError — ошибка, которую handlers должны маппить в HTTP 400.
//
// Важно: это не экспортируется наружу, чтобы handlers не зависели от пакета services.
type badRequestError struct {
	msg string
}

func (e badRequestError) Error() string {
	return e.msg
}

func (e badRequestError) BadRequest() bool {
	return true
}

func newBadRequest(msg string) error {
	return badRequestError{msg: msg}
}
