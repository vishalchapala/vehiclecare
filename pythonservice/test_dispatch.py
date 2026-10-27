"""Tests for the ranking logic. Run with:  python test_dispatch.py   (or: python -m pytest)"""
from dispatch_logic import build_assignment, estimate_eta_minutes, haversine_km, rank_providers


def test_distance_same_point_is_zero():
    assert haversine_km(13.0827, 80.2707, 13.0827, 80.2707) == 0


def test_distance_chennai_to_bengaluru():
    # Straight-line distance is about 290 km
    d = haversine_km(13.0827, 80.2707, 12.9716, 77.5946)
    assert 280 < d < 300


def test_nearest_provider_ranks_first():
    providers = [
        {"id": "far", "active_jobs": 0, "lat": 13.20, "lng": 80.30},
        {"id": "near", "active_jobs": 0, "lat": 13.09, "lng": 80.27},
    ]
    ranking = rank_providers(13.0827, 80.2707, providers)
    assert [r["id"] for r in ranking] == ["near", "far"]


def test_busy_provider_loses_to_free_provider_slightly_farther():
    providers = [
        {"id": "busy_close", "active_jobs": 3, "lat": 13.09, "lng": 80.27},   # about 1 km + 15 km penalty
        {"id": "free_farther", "active_jobs": 0, "lat": 13.15, "lng": 80.27},  # about 7.5 km
    ]
    ranking = rank_providers(13.0827, 80.2707, providers)
    assert ranking[0]["id"] == "free_farther"


def test_unknown_location_goes_last_by_fewest_jobs():
    providers = [
        {"id": "no_loc_busy", "active_jobs": 2, "lat": None, "lng": None},
        {"id": "no_loc_free", "active_jobs": 0, "lat": None, "lng": None},
        {"id": "located", "active_jobs": 5, "lat": 13.10, "lng": 80.27},
    ]
    ranking = rank_providers(13.0827, 80.2707, providers)
    assert [r["id"] for r in ranking] == ["located", "no_loc_free", "no_loc_busy"]
    assert [r["rank"] for r in ranking] == [1, 2, 3]


def test_request_without_location_ranks_by_jobs_only():
    providers = [
        {"id": "a", "active_jobs": 4, "lat": 13.1, "lng": 80.2},
        {"id": "b", "active_jobs": 1, "lat": 13.1, "lng": 80.2},
    ]
    ranking = rank_providers(None, None, providers)
    assert [r["id"] for r in ranking] == ["b", "a"]


def test_empty_list():
    assert rank_providers(13.0, 80.0, []) == []


def test_eta_is_distance_over_assumed_speed():
    assert estimate_eta_minutes(3.4) == 12      # 3.4 km at 17 km/h
    assert estimate_eta_minutes(0.1) == 1       # never less than 1 minute
    assert estimate_eta_minutes(None) is None


def test_assignment_format():
    providers = [
        {"id": "p1", "name": "Raju Auto Care", "active_jobs": 0, "lat": 13.030578, "lng": 80.0},
        {"id": "p2", "name": "Far Garage", "active_jobs": 0, "lat": 13.3, "lng": 80.0},
    ]
    result = build_assignment("REQ-1024", 13.0, 80.0, providers)
    assert result == {"requestId": "REQ-1024", "status": "ASSIGNED", "provider": "Raju Auto Care",
                      "distanceKm": 3.4, "etaMinutes": 12}


def test_assignment_with_no_providers_stays_reported():
    result = build_assignment("REQ-1025", 13.0, 80.0, [])
    assert result == {"requestId": "REQ-1025", "status": "REPORTED", "provider": None,
                      "distanceKm": None, "etaMinutes": None}


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print("PASS", t.__name__)
    print(f"{len(tests)} tests passed")
