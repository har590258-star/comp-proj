import math
from typing import Tuple, Dict, Any

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in meters between two points 
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    # Earth's radius in meters (mean radius)
    radius_meters = 6371000.0
    return radius_meters * c

def is_within_radius(
    user_lat: float, 
    user_lon: float, 
    site_lat: float, 
    site_lon: float, 
    radius_meters: float = 500.0
) -> Tuple[bool, float]:
    """
    Checks if a user is within the allowed radius of a site.
    Returns (is_within, distance_in_meters).
    """
    distance = calculate_haversine_distance(user_lat, user_lon, site_lat, site_lon)
    return (distance <= radius_meters, round(distance, 1))

def format_distance(distance_meters: float) -> str:
    """Returns human-friendly distance string (e.g. '250 m' or '2.4 km')."""
    if distance_meters >= 1000:
        return f"{distance_meters / 1000.0:.1f} km"
    return f"{int(distance_meters)} m"
