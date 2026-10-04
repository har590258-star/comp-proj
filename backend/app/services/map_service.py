import requests
import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.utils.geo import calculate_haversine_distance, format_distance, is_within_radius

logger = logging.getLogger("uvicorn")

class MapService:
    def __init__(self):
        self.api_key = settings.MAPPLS_API_KEY

    def calculate_distance_and_eta(
        self, 
        start_lat: float, 
        start_lon: float, 
        dest_lat: float, 
        dest_lon: float
    ) -> Dict[str, Any]:
        """
        Calculates distance and directions using Mappls API if key is present,
        or high-precision Haversine math with route points fallback.
        """
        straight_distance = calculate_haversine_distance(start_lat, start_lon, dest_lat, dest_lon)
        
        # If Mappls API key is configured, query Mappls Distance Matrix / Direction API
        if self.api_key:
            try:
                url = f"https://apis.mappls.com/advancedmaps/v1/{self.api_key}/distance_matrix/driving/{start_lon},{start_lat};{dest_lon},{dest_lat}"
                resp = requests.get(url, timeout=4)
                if resp.status_code == 200:
                    data = resp.json()
                    durations = data.get("durations", [[0, 0]])
                    distances = data.get("distances", [[0, 0]])
                    dist_meters = distances[0][1] if len(distances) > 0 and len(distances[0]) > 1 else straight_distance
                    dur_seconds = durations[0][1] if len(durations) > 0 and len(durations[0]) > 1 else int(dist_meters / 8.33)
                    return {
                        "distanceMeters": dist_meters,
                        "distanceFormatted": format_distance(dist_meters),
                        "durationSeconds": dur_seconds,
                        "durationFormatted": f"{dur_seconds // 60} mins",
                        "provider": "mappls"
                    }
            except Exception as e:
                logger.warning(f"Mappls API route call: {e}. Using geometric route calculation.")

        # Road distance is typically ~1.25x the straight line haversine distance in urban environments
        road_distance = straight_distance * 1.25
        est_seconds = int(road_distance / 8.33) # avg 30 km/h in city
        est_minutes = max(1, est_seconds // 60)
        
        return {
            "distanceMeters": round(road_distance, 1),
            "distanceFormatted": format_distance(road_distance),
            "durationSeconds": est_seconds,
            "durationFormatted": f"{est_minutes} mins",
            "provider": "geo_engine"
        }

    def verify_site_proximity(
        self,
        user_lat: float,
        user_lon: float,
        site_lat: float,
        site_lon: float,
        allowed_radius_meters: float = 500.0
    ) -> Dict[str, Any]:
        """Validates if user is within the site geofence."""
        distance = calculate_haversine_distance(user_lat, user_lon, site_lat, site_lon)
        is_valid = distance <= allowed_radius_meters
        return {
            "isWithinRadius": is_valid,
            "distanceMeters": round(distance, 1),
            "distanceFormatted": format_distance(distance),
            "allowedRadiusMeters": allowed_radius_meters
        }

map_service = MapService()
