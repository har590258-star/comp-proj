import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_KEY = 'adani_last_gps';

// Helper to retrieve freshly cached device coordinates from session storage
const getCachedCoordinates = () => {
  try {
    const saved = sessionStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Valid if less than 30 minutes old
      if (Date.now() - (parsed._cachedAt || 0) < 30 * 60 * 1000) {
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          accuracy: parsed.accuracy || 10,
          heading: parsed.heading || null,
          speed: parsed.speed || null,
          isRealGps: true,
        };
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
        _cachedAt: Date.now(),
      })
    );
  } catch (e) {
    // Ignore storage write issues
  }
};

export const useGeolocation = (customOptions = {}) => {
  const initialCache = getCachedCoordinates();
  const [coordinates, setCoordinates] = useState(initialCache);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!initialCache.latitude);
  const [permissionState, setPermissionState] = useState('prompt');

  // Options tuned for immediate response without 10s cold-GPS freeze
  const options = {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 30000, // Return cached hardware position in <10ms if fresh
    ...customOptions,
  };

  const isAcquiredRef = useRef(Boolean(initialCache.latitude));

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
    const coords = {
      latitude: Number(position.coords.latitude.toFixed(6)),
      longitude: Number(position.coords.longitude.toFixed(6)),
      accuracy: Math.round(position.coords.accuracy),
      heading: position.coords.heading,
      speed: position.coords.speed,
      isRealGps: true,
    };
    setCoordinates(coords);
    saveCachedCoordinates(coords);
    setLoading(false);
    setError(null);
    setPermissionState('granted');
    isAcquiredRef.current = true;
    return coords;
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser or device.');
        setLoading(false);
        resolve(coordinates);
        return;
      }

      // If we already have fresh coordinates, don't show full-screen blocking loading
      if (!isAcquiredRef.current) {
        setLoading(true);
      }
      setError(null);

      // Fast initial lock: Request position with allowed cache first (resolves in ~10-100ms)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fresh = handlePositionSuccess(pos);
          resolve(fresh);
        },
        (err) => {
          // Attempt network/cellular fallback before failing
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              const fresh = handlePositionSuccess(fallbackPos);
              resolve(fresh);
            },
            () => {
              // If high accuracy timed out but we have cached coordinates, keep cached coordinates
              if (coordinates.latitude) {
                setLoading(false);
                resolve(coordinates);
                return;
              }

              let message = 'Waiting for live device GPS satellite lock...';
              if (err.code === 1) {
                message = 'Location permission denied. Please allow location access in your browser settings.';
                setPermissionState('denied');
              } else if (err.code === 2) {
                message = 'GPS signal unavailable. Please ensure GPS/location is turned on.';
              } else if (err.code === 3) {
                message = 'GPS satellite lock timed out. Retrying...';
              }
              setError(message);
              setLoading(false);
              resolve(coordinates);
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
          );
        },
        options
      );
    });
  }, [options, coordinates, handlePositionSuccess]);

  // Acquire location on-demand without continuous background tracking
  useEffect(() => {
    checkPermission();

    // 1. If no initial cache, trigger fast network/cellular geolocation lock
    if (!isAcquiredRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        () => {}, // Silent fallback
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
      );
    }

    getCurrentPosition();

    // Continuous watchPosition only if explicitly opted-in via options
    if (customOptions.watch && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        (err) => {
          if (err.code === 1) {
            setPermissionState('denied');
          }
        },
        options
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  return {
    coordinates,
    error,
    loading,
    permissionState,
    refreshLocation: getCurrentPosition,
  };
};
