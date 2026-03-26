package score

import "testing"

func TestCompute_BoundsAndCap(t *testing.T) {
	// max inputs should cap at 90
	s, err := Compute(Input{
		Execution:        10,
		SetlistDynamics:  10,
		CrowdInteraction: 10,
		SoundEngineer:    10,
		Vibe:             10,
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if s != 90 {
		t.Fatalf("expected 90, got %d", s)
	}
}

func TestCompute_InvalidRating(t *testing.T) {
	_, err := Compute(Input{Execution: 0, SetlistDynamics: 1, CrowdInteraction: 1, SoundEngineer: 1, Vibe: 1})
	if err == nil {
		t.Fatalf("expected error")
	}
	if err != ErrInvalidRating {
		t.Fatalf("expected ErrInvalidRating, got %v", err)
	}
}

func TestCompute_VibeMultiplier_MinMax(t *testing.T) {
	// vibe 1 => multiplier min
	s1, err := Compute(Input{Execution: 1, SetlistDynamics: 1, CrowdInteraction: 1, SoundEngineer: 1, Vibe: 1})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	s10, err := Compute(Input{Execution: 1, SetlistDynamics: 1, CrowdInteraction: 1, SoundEngineer: 1, Vibe: 10})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if s10 <= s1 {
		t.Fatalf("expected vibe=10 score > vibe=1 score, got %d <= %d", s10, s1)
	}
}
