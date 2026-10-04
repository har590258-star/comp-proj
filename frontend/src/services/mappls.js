/**
 * Mappls Map Service & Integration Helper
 * Provides seamless support for Mappls REST API & interactive map rendering.
 */

const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_API_KEY || '';

export const mapplsService = {
  getApiKey() {
    return MAPPLS_KEY;
  },

  hasValidKey() {
    return Boolean(MAPPLS_KEY && MAPPLS_KEY.length > 5 && !MAPPLS_KEY.includes('placeholder'));
  },

  /**
   * Calculates driving distance between two coordinates
   */
  async getDistanceMatrix(startLat, startLon, destLat, destLon) {
    if (!this.hasValidKey()) {
      return this.fallbackDistanceCalculation(startLat, startLon, destLat, destLon);
    }

    try {
      const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/distance_matrix/driving/${startLon},${startLat};${destLon},${destLat}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Mappls API response not OK');
      const data = await response.json();
      const distanceMeters = data?.distances?.[0]?.[1] || 0;
      const durationSeconds = data?.durations?.[0]?.[1] || 0;

      return {
        distanceMeters,
        distanceFormatted: distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${Math.round(distanceMeters)} m`,
        durationFormatted: `${Math.round(durationSeconds / 60)} mins`,
        provider: 'mappls'
      };
    } catch (err) {
      console.warn('Mappls API distance fallback:', err.message);
      return this.fallbackDistanceCalculation(startLat, startLon, destLat, destLon);
    }
  },

  /**
   * High precision Haversine distance calculation fallback
   */
  fallbackDistanceCalculation(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const straightMeters = R * c;
    const roadMeters = straightMeters * 1.25; // estimated road distance
    const estMins = Math.max(1, Math.round(roadMeters / 500));

    return {
      distanceMeters: Math.round(roadMeters),
      distanceFormatted: roadMeters >= 1000 ? `${(roadMeters / 1000).toFixed(1)} km` : `${Math.round(roadMeters)} m`,
      durationFormatted: `${estMins} mins`,
      provider: 'geo_engine'
    };
  }
};
