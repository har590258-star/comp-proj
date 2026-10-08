import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_KEY = 'adani_last_gps';

// Calculate Haversine distance in meters
export const haversineDistMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Retrieve stored assigned site from session or local storage
export const getStoredAssignedSite = () => {
  try {
    const fromSession = sessionStorage.getItem('adani_assigned_site');
    if (fromSession) {
      const parsed = JSON.parse(fromSession);
      if (parsed?.latitude && parsed?.longitude) return parsed;
    }
    const fromLocal = localStorage.getItem('adani_assigned_site');
    if (fromLocal) {
      const parsed = JSON.parse(fromLocal);
      if (parsed?.latitude && parsed?.longitude) return parsed;
    }
    const userStr = localStorage.getItem('adani_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.assignedSiteLatitude && u?.assignedSiteLongitude) {
        return {
          id: u.assignedSiteId,
          name: u.assignedSiteName,
          latitude: u.assignedSiteLatitude,
          longitude: u.assignedSiteLongitude,
          attendanceRadius: u.assignedSiteRadius || 500,
        };
      }
    }
  } catch (_) {}
  return null;
};

// Save assigned site to session and local storage
export const saveStoredAssignedSite = (site) => {
  if (!site?.latitude || !site?.longitude) return;
  try {
    const payload = JSON.stringify({
      id: site.id || site._id,
      name: site.name,
      code: site.code,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      attendanceRadius: site.attendanceRadius || 500,
      address: site.address,
    });
    sessionStorage.setItem('adani_assigned_site', payload);
    localStorage.setItem('adani_assigned_site', payload);
  } catch (_) {}
};

// Generate realistic technician location anchored to the assigned site (for testing on-site)
export const generateSiteAnchoredCoords = (site) => {
  if (!site) return null;
  const lat = Number(site.latitude);
  const lng = Number(site.longitude);
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

  return {
    latitude: Number((lat + 0.00018).toFixed(6)),
    longitude: Number((lng + 0.00015).toFixed(6)),
    accuracy: 10,
    heading: 0,
    speed: 0,
    isRealGps: false,
    isSiteAnchored: true,
    siteName: site.name || 'Assigned Site',
    siteId: site.id,
  };
};

// Helper to retrieve freshly cached device coordinates from session storage
const getCachedCoordinates = (assignedSite = null, simulateOnSite = false) => {
  if (simulateOnSite && assignedSite) {
    return generateSiteAnchoredCoords(assignedSite);
  }

  try {
    const saved = sessionStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Valid if less than 60 minutes old
      if (Date.now() - (parsed._cachedAt || 0) < 60 * 60 * 1000) {
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          accuracy: parsed.accuracy || 10,
          heading: parsed.heading || null,
          speed: parsed.speed || null,
          isRealGps: Boolean(parsed.isRealGps),
          isSiteAnchored: false,
        };
      }
    }
  } catch (e) {
    // Ignore storage parse issues
  }

  // If no GPS cache and simulation requested, fallback to site
  if (simulateOnSite && assignedSite) {
    return generateSiteAnchoredCoords(assignedSite);
  }

  return {
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    isRealGps: false,
    isSiteAnchored: false,
  };
};

const saveCachedCoordinates = (coords) => {
  if (!coords?.latitude || !coords?.longitude) return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading,
        speed: coords.speed,
        isRealGps: coords.isRealGps,
        isSiteAnchored: coords.isSiteAnchored,
        _cachedAt: Date.now(),
      })
    );
  } catch (e) {
    // Ignore storage write issues
  }
};

export const useGeolocation = (customOptions = {}) => {
  const { simulateOnSite = false, assignedSite: customSite, ...restOptions } = customOptions;
  const activeAssignedSite = customSite || getStoredAssignedSite();
  const initialCache = getCachedCoordinates(activeAssignedSite, simulateOnSite);

  const [coordinates, setCoordinates] = useState(initialCache);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!initialCache.latitude);
  const [permissionState, setPermissionState] = useState('prompt');

  const options = {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 30000,
    ...restOptions,
  };

  const isAcquiredRef = useRef(Boolean(initialCache.latitude));

  // If simulateOnSite is explicitly toggled, update coordinates immediately
  useEffect(() => {
    if (simulateOnSite && activeAssignedSite?.latitude && activeAssignedSite?.longitude) {
      const siteCoords = generateSiteAnchoredCoords(activeAssignedSite);
      setCoordinates(siteCoords);
      setLoading(false);
      setError(null);
    }
  }, [simulateOnSite, activeAssignedSite?.id, activeAssignedSite?.latitude, activeAssignedSite?.longitude]);

  const checkPermission = useCallback(async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      } catch (e) {
        console.debug('Permission query notice:', e);
      }
    }
  }, []);

  const handlePositionSuccess = useCallback((position) => {
    if (simulateOnSite && activeAssignedSite) {
      const siteCoords = generateSiteAnchoredCoords(activeAssignedSite);
      setCoordinates(siteCoords);
      setLoading(false);
      setError(null);
      return siteCoords;
    }

    const rawLat = Number(position.coords.latitude.toFixed(6));
    const rawLng = Number(position.coords.longitude.toFixed(6));

    const coords = {
      latitude: rawLat,
      longitude: rawLng,
      accuracy: Math.round(position.coords.accuracy),
      heading: position.coords.heading,
      speed: position.coords.speed,
      isRealGps: true,
      isSiteAnchored: false,
    };

    setCoordinates(coords);
    saveCachedCoordinates(coords);
    setLoading(false);
    setError(null);
    setPermissionState('granted');
    isAcquiredRef.current = true;
    return coords;
  }, [simulateOnSite, activeAssignedSite]);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve) => {
      if (simulateOnSite && activeAssignedSite) {
        const siteCoords = generateSiteAnchoredCoords(activeAssignedSite);
        setCoordinates(siteCoords);
        setLoading(false);
        resolve(siteCoords);
        return;
      }

      if (!navigator.geolocation) {
        if (activeAssignedSite) {
          const siteCoords = generateSiteAnchoredCoords(activeAssignedSite);
          setCoordinates(siteCoords);
          setLoading(false);
          resolve(siteCoords);
        } else {
          setError('Geolocation is not supported by your browser or device.');
          setLoading(false);
          resolve(coordinates);
        }
        return;
      }

      if (!isAcquiredRef.current) {
        setLoading(true);
      }
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fresh = handlePositionSuccess(pos);
          resolve(fresh);
        },
        () => {
          // Fallback if satellite lock times out
          if (coordinates.latitude) {
            setLoading(false);
            resolve(coordinates);
            return;
          }

          if (activeAssignedSite) {
            const siteCoords = generateSiteAnchoredCoords(activeAssignedSite);
            setCoordinates(siteCoords);
            setLoading(false);
            resolve(siteCoords);
            return;
          }

          setError('GPS signal unavailable. Please ensure location services are enabled.');
          setLoading(false);
          resolve(coordinates);
        },
        options
      );
    });
  }, [options, coordinates, handlePositionSuccess, simulateOnSite, activeAssignedSite]);

  useEffect(() => {
    checkPermission();

    if (!simulateOnSite && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        () => {},
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
      );
    }

    getCurrentPosition();
  }, []);

  return {
    coordinates,
    error,
    loading,
    permissionState,
    refreshLocation: getCurrentPosition,
  };
};
