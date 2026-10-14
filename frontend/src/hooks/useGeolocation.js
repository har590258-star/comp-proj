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
const getCachedCoordinates = (simulateOnSite = false, assignedSite = null) => {
  if (simulateOnSite && assignedSite) {
    return generateSiteAnchoredCoords(assignedSite);
  }

  try {
    const saved = sessionStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Valid only if authentic real GPS AND NOT anchored to site AND within 15 minutes
      if (
        parsed.isRealGps &&
        !parsed.isSiteAnchored &&
        parsed.latitude !== null &&
        parsed.longitude !== null &&
        Date.now() - (parsed._cachedAt || 0) < 15 * 60 * 1000
      ) {
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          accuracy: parsed.accuracy || 10,
          heading: parsed.heading || null,
          speed: parsed.speed || null,
          isRealGps: true,
          isSiteAnchored: false,
        };
      } else {
        // Clear corrupt or fake site-anchored cache immediately
        sessionStorage.removeItem(CACHE_KEY);
      }
    }
  } catch (e) {
    // Ignore storage parse issues
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
  // Never save site-anchored or fake coordinates as real GPS cache
  if (coords.isSiteAnchored) return;

  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        heading: coords.heading,
        speed: coords.speed,
        isRealGps: true,
        isSiteAnchored: false,
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
  const initialCache = getCachedCoordinates(simulateOnSite, activeAssignedSite);

  const [coordinates, setCoordinates] = useState(initialCache);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!initialCache.latitude);
  const [permissionState, setPermissionState] = useState('prompt');

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...restOptions,
  };

  const isAcquiredRef = useRef(Boolean(initialCache.latitude));

  const checkPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
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
      accuracy: Math.round(position.coords.accuracy || 10),
      heading: position.coords.heading || null,
      speed: position.coords.speed || null,
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

  // Robust multi-stage location acquisition
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve) => {
      if (simulateOnSite && activeAssignedSite) {
        const siteCoords = generateSiteAnchoredCoords(activeAssignedSite);
        setCoordinates(siteCoords);
        setLoading(false);
        resolve(siteCoords);
        return;
      }

      if (typeof window === 'undefined' || !navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser or device.';
        setError(msg);
        setLoading(false);
        resolve(null);
        return;
      }

      setLoading(true);
      setError(null);

      // Strategy:
      // 1. Try high-accuracy (GPS hardware if mobile / precise wifi) with 10s timeout
      // 2. If it times out or fails (POSITION_UNAVAILABLE), fallback to standard accuracy (wifi/network triangulation)
      // 3. If standard accuracy fails (e.g. desktop location services disabled), fallback to IP-based location so user gets their actual city/region
      const tryFallback = (primaryError) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = handlePositionSuccess(pos);
            resolve(coords);
          },
          async (secondaryError) => {
            console.warn('Geolocation secondary attempt failed:', secondaryError);

            // IP-based real location fallback
            try {
              const res = await fetch('https://ipapi.co/json/');
              if (res.ok) {
                const data = await res.json();
                if (data.latitude && data.longitude) {
                  const ipCoords = {
                    latitude: Number(Number(data.latitude).toFixed(6)),
                    longitude: Number(Number(data.longitude).toFixed(6)),
                    accuracy: 5000,
                    heading: null,
                    speed: null,
                    isRealGps: true,
                    isSiteAnchored: false,
                    isIpFallback: true,
                    city: data.city,
                  };
                  setCoordinates(ipCoords);
                  saveCachedCoordinates(ipCoords);
                  setLoading(false);
                  setError(null);
                  resolve(ipCoords);
                  return;
                }
              }
            } catch (ipErr) {
              console.debug('IP location fallback unavailable:', ipErr);
            }

            let errorMsg = 'GPS signal unavailable. Please ensure location services are enabled.';
            if (secondaryError?.code === 1 || primaryError?.code === 1) {
              errorMsg = 'Location permission denied. Please allow location access in your browser address bar.';
              setPermissionState('denied');
            } else if (secondaryError?.code === 2) {
              errorMsg = 'Position unavailable. Please check your network or GPS connection.';
            } else if (secondaryError?.code === 3) {
              errorMsg = 'Location request timed out. Please click Refresh to try again.';
            }

            setError(errorMsg);
            setLoading(false);
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = handlePositionSuccess(pos);
          resolve(coords);
        },
        (err) => {
          if (err.code === 1) {
            // Permission denied - do not retry
            setError('Location permission denied. Please allow location access in your browser address bar.');
            setPermissionState('denied');
            setLoading(false);
            resolve(null);
          } else {
            tryFallback(err);
          }
        },
        options
      );
    });
  }, [options, handlePositionSuccess, simulateOnSite, activeAssignedSite]);

  useEffect(() => {
    checkPermission();

    // Trigger fresh position check on mount
    getCurrentPosition();

    // Keep position updated via watchPosition if available
    let watchId = null;
    if (!simulateOnSite && typeof window !== 'undefined' && navigator.geolocation) {
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            handlePositionSuccess(pos);
          },
          (err) => {
            console.debug('watchPosition status:', err?.message || err);
          },
          { enableHighAccuracy: false, maximumAge: 15000, timeout: 20000 }
        );
      } catch (err) {
        console.debug('Failed to initialize watchPosition:', err);
      }
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const anchorToSite = useCallback((site) => {
    if (!site) return;
    saveStoredAssignedSite(site);
    if (simulateOnSite) {
      const siteCoords = generateSiteAnchoredCoords(site);
      if (siteCoords) {
        setCoordinates(siteCoords);
        setLoading(false);
        setError(null);
      }
    }
  }, [simulateOnSite]);

  return {
    coordinates,
    error,
    loading,
    permissionState,
    refreshLocation: getCurrentPosition,
    anchorToSite,
  };
};
