"""Ranking logic for the VehicleCare dispatch service.

Pure Python with no outside packages, so it can be tested on its own.
"""
import math

EARTH_RADIUS_KM = 6371.0088

# Each active job a provider already has counts like this many extra kilometres,
# so a slightly farther provider with no work can beat a close provider who is busy.
LOAD_PENALTY_KM = 5.0


def haversine_km(lat1, lng1, lat2, lng2):
    """Great-circle distance in kilometres between two latitude/longitude points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(a)))


def rank_providers(lat, lng, providers):
    """Return providers sorted from best to worst.

    providers: list of dicts with keys id, active_jobs, lat, lng (lat and lng may be None).
    Score = distance in km + LOAD_PENALTY_KM * active_jobs. Lower is better.
    Providers whose location is unknown are placed after those with a known location,
    ordered by how few active jobs they have.
    """
    located, unlocated = [], []
    for p in providers:
        jobs = int(p.get("active_jobs") or 0)
        p_lat, p_lng = p.get("lat"), p.get("lng")
        if lat is not None and lng is not None and p_lat is not None and p_lng is not None:
            distance = haversine_km(lat, lng, p_lat, p_lng)
            located.append(
                {"id": p["id"], "distance_km": round(distance, 2), "active_jobs": jobs,
                 "score": round(distance + LOAD_PENALTY_KM * jobs, 2)}
            )
        else:
            unlocated.append({"id": p["id"], "distance_km": None, "active_jobs": jobs, "score": None})

    located.sort(key=lambda r: (r["score"], r["active_jobs"]))
    unlocated.sort(key=lambda r: r["active_jobs"])
    ranking = located + unlocated
    for position, row in enumerate(ranking, start=1):
        row["rank"] = position
    return ranking
