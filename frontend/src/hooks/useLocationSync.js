import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Calculate Haversine distance in meters between two lat/lon points
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * useLocationSync
 * Background hook that automatically streams technician GPS movement
 * to MongoDB Atlas via POST /api/locations/log so Admins can monitor
 * field staff in real-time.
 */
export const useLocationSync = (options = {}) => {
  const {
    minDistanceMeters = 5,    // Sync if moved 5+ meters
    minIntervalMs = 8000,     // Throttle: at least 8s between movement pings
    heartbeatIntervalMs = 25000, // Heartbeat: ping at least every 25s even if stationary
    enabled = false, // Disabled on user side
  } = options;

  const { user, isAdmin } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncCount, setSyncCount] = useState(0);
  const [currentCoords, setCurrentCoords] = useState(null);

  const lastLoggedRef = useRef({
    latitude: null,
    longitude: null,
    timestamp: 0,
  });

  const isPostingRef = useRef(false);

  // Send telemetry payload to backend (manual on-demand only if invoked)
  const sendLocationPing = useCallback(
    async (coords) => {
      // User-side tracking is disabled
      return;
    },
    []
  );

  // Background continuous tracking disabled on user side
  useEffect(() => {
    return;
  }, []);

  return {
    isSyncing: false,
    lastSyncedAt: null,
    syncCount: 0,
    currentCoords: null,
    syncNow: sendLocationPing,
    isTrackingActive: false,
  };
};
