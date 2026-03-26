package score

import "math"

// Задание: расчёт итогового score для отзыва.
//
// Формула (из MVP):
// - 4 объективных параметра суммируются
// - умножаются на 1.4
// - затем умножаются на vibe-мультипликатор (1..1.6072)
// - результат ограничивается сверху 90
//
// Принятое допущение для MVP:
// - рейтинги в диапазоне 1..10
// - vibe multiplier линейно интерполируется между 1 и 1.6072

const (
	MaxScore    = 90
	BaseFactor  = 1.4
	VibeMinMult = 1.0
	VibeMaxMult = 1.6072
	RatingMin   = 1
	RatingMax   = 10
)

type Input struct {
	Execution        int
	SetlistDynamics  int
	CrowdInteraction int
	SoundEngineer    int
	Vibe             int
}

func Compute(in Input) (int, error) {
	if err := validateRating(in.Execution); err != nil {
		return 0, err
	}
	if err := validateRating(in.SetlistDynamics); err != nil {
		return 0, err
	}
	if err := validateRating(in.CrowdInteraction); err != nil {
		return 0, err
	}
	if err := validateRating(in.SoundEngineer); err != nil {
		return 0, err
	}
	if err := validateRating(in.Vibe); err != nil {
		return 0, err
	}

	sumObjectives := in.Execution + in.SetlistDynamics + in.CrowdInteraction + in.SoundEngineer
	vibeMult := vibeMultiplier(in.Vibe)

	raw := float64(sumObjectives) * BaseFactor * vibeMult
	s := int(math.Round(raw))
	if s > MaxScore {
		s = MaxScore
	}
	if s < 0 {
		s = 0
	}
	return s, nil
}

func vibeMultiplier(vibe int) float64 {
	if vibe <= RatingMin {
		return VibeMinMult
	}
	if vibe >= RatingMax {
		return VibeMaxMult
	}
	// линейная интерполяция между 1..1.6072 по шкале 1..10
	t := float64(vibe-RatingMin) / float64(RatingMax-RatingMin)
	return VibeMinMult + t*(VibeMaxMult-VibeMinMult)
}

func validateRating(v int) error {
	if v < RatingMin || v > RatingMax {
		return ErrInvalidRating
	}
	return nil
}
