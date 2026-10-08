import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Component to handle map clicks for location picking
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          latitude: Number(e.latlng.lat.toFixed(6)),
          longitude: Number(e.latlng.lng.toFixed(6)),
        });
      }
    },
  });
  return null;
};

// Fix Leaflet marker icons with clean SVG DivIcons
// High-contrast, clean SVG DivIcons for Leaflet
const createPulseIcon = (color = '#10B981', title = 'Technician') => {
  return L.divIcon({
    className: 'custom-tech-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; cursor: pointer;">
        <div style="background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(4px); color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${color}; display: inline-block;"></span>
          <span>${title}</span>
        </div>
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createSiteIcon = (label = 'Field Location') => {
  return L.divIcon({
    className: 'custom-site-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background-color: #DC2626; color: white; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2px solid white; display: flex; align-items: center; gap: 5px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>
          ${label}
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #DC2626; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Component to dynamically navigate and re-center map when coordinates change
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  const lastCenterRef = React.useRef(null);

  const lat = center ? Number(center[0]) : null;
  const lng = center ? Number(center[1]) : null;

  useEffect(() => {
    if (lat === null || lng === null || isNaN(lat) || !isFinite(lat) || isNaN(lng) || !isFinite(lng)) return;

    const prev = lastCenterRef.current;
    if (!prev || Math.abs(prev.lat - lat) > 0.0001 || Math.abs(prev.lng - lng) > 0.0001) {
      lastCenterRef.current = { lat, lng };
      const currentZoom = map.getZoom();
      const targetZoom = zoom || (currentZoom < 14 ? 15 : currentZoom);
      map.flyTo([lat, lng], targetZoom, {
        animate: true,
        duration: 1.0,
      });
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (_) {}
      }, 250);
    }
  }, [lat, lng, zoom, map]);

  return null;
};

// Component to ensure Leaflet redraws and invalidates size correctly (especially inside modals)
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Component to dynamically fit bounds when two local points are within range
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (e) {
        // ignore
      }
    }
  }, [points, map]);
  return null;
};

// Calculate approximate distance in km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const InteractiveMap = ({
  center,
  zoom = 16,
  userLocation,
  siteLocation,
  showRoute = true,
  showGeofence = true,
  geofenceRadius = 500,
  height = '360px',
  className = '',
  additionalMarkers = [],
  isPicker = false,
  onLocationSelect = null,
}) => {
  // 1. Employee real live location is primary
  const hasUserCoords = Boolean(
    userLocation?.latitude !== null &&
    userLocation?.latitude !== undefined &&
    userLocation?.longitude !== null &&
    userLocation?.longitude !== undefined &&
    !isNaN(Number(userLocation.latitude)) &&
    !isNaN(Number(userLocation.longitude))
  );

  // 2. Active site location (always keep authentic site coordinates)
  const hasSiteCoords = Boolean(
    siteLocation?.latitude !== undefined &&
    siteLocation?.latitude !== null &&
    siteLocation?.longitude !== undefined &&
    siteLocation?.longitude !== null &&
    !isNaN(Number(siteLocation.latitude)) &&
    !isNaN(Number(siteLocation.longitude))
  );

  const siteLat = hasSiteCoords ? Number(siteLocation.latitude) : null;
  const siteLon = hasSiteCoords ? Number(siteLocation.longitude) : null;

  const validCenterLat = (center && !isNaN(Number(center[0]))) ? Number(center[0]) : 21.1926;
  const validCenterLon = (center && !isNaN(Number(center[1]))) ? Number(center[1]) : 72.7997;

  const fallbackLat = hasSiteCoords ? siteLat : validCenterLat;
  const fallbackLon = hasSiteCoords ? siteLon : validCenterLon;

  const userLat = hasUserCoords ? Number(userLocation.latitude) : fallbackLat;
  const userLon = hasUserCoords ? Number(userLocation.longitude) : fallbackLon;

  const activeSiteLat = hasSiteCoords ? siteLat : userLat;
  const activeSiteLon = hasSiteCoords ? siteLon : userLon;

  const distKm = getDistanceKm(userLat, userLon, activeSiteLat, activeSiteLon);
  const distMeters = Math.round(distKm * 1000);
  const isInGeofence = distMeters <= geofenceRadius;

  const activeCenter = hasSiteCoords
    ? [siteLat, siteLon]
    : hasUserCoords
    ? [userLat, userLon]
    : [validCenterLat, validCenterLon];

  // Draw connecting route line whenever both user and site locations are present
  const shouldDrawRoute = !isPicker && showRoute && hasUserCoords && hasSiteCoords && distMeters > 30;
  const routePoints = hasUserCoords && hasSiteCoords ? [[userLat, userLon], [siteLat, siteLon]] : [];
  const boundsPoints = shouldDrawRoute
    ? routePoints
    : hasSiteCoords
    ? [[siteLat, siteLon]]
    : hasUserCoords
    ? [[userLat, userLon]]
    : [activeCenter];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-300 shadow-md ${className}`}
      style={{ height, minHeight: '260px' }}
    >
      {shouldDrawRoute && (
        <div className="absolute top-2.5 right-2.5 z-[1000] bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-xs flex items-center gap-2 border border-white/20 pointer-events-none">
          <span className={`w-2 h-2 rounded-full ${isInGeofence ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span>
            {distKm >= 1 ? `${distKm.toFixed(1)} km` : `${distMeters} m`} to {siteLocation?.name || 'Site'}
          </span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${isInGeofence ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
            {isInGeofence ? 'In 500m Zone' : 'Outside Geofence'}
          </span>
        </div>
      )}

      {isPicker && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 pointer-events-none border border-white/20 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Click map or drag pin to tag exact location</span>
        </div>
      )}

      <MapContainer
        center={activeCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | MapmyIndia (Mappls) GIS'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />
        <MapResizer />

        {isPicker && onLocationSelect && (
          <MapClickHandler onLocationSelect={onLocationSelect} />
        )}

        {shouldDrawRoute ? (
          <FitBounds points={boundsPoints} />
        ) : (
          <RecenterMap center={activeCenter} zoom={zoom} />
        )}

        {/* 500m Authorized Field Geofence Boundary Circle (strictly when valid site coordinates exist) */}
        {showGeofence && hasSiteCoords && siteLat !== null && siteLon !== null && !isNaN(siteLat) && !isNaN(siteLon) && (
          <Circle
            center={[siteLat, siteLon]}
            radius={geofenceRadius}
            pathOptions={{
              color: '#059669',
              fillColor: '#10B981',
              fillOpacity: 0.16,
              weight: 2,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="p-1.5 text-sm">
                <p className="font-bold text-slate-900">{siteLocation?.name || 'Active Field Zone'} Geofence</p>
                <p className="text-slate-600 font-medium text-xs mt-0.5">Radius: {geofenceRadius} meters</p>
                <p className="text-emerald-700 font-semibold text-xs mt-1">● Authorized Attendance Zone</p>
              </div>
            </Popup>
          </Circle>
        )}

        {/* User live device GPS marker (strictly when valid user coordinates exist) */}
        {!isPicker && hasUserCoords && userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon) && (
          <Marker position={[userLat, userLon]} icon={createPulseIcon('#1E63F0', userLocation?.title || 'Live GPS')}>
            <Popup>
              <div className="p-2 text-sm">
                <p className="font-bold text-slate-900">Your Current Device Position</p>
                <p className="text-slate-600 font-mono text-xs mt-0.5">{userLat.toFixed(6)}, {userLon.toFixed(6)}</p>
                <p className={`font-bold text-xs mt-1 ${isInGeofence ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isInGeofence
                    ? '● Inside Authorized 500m Attendance Zone'
                    : `● Outside Geofence (${distKm < 1 ? `${distMeters} m` : `${distKm.toFixed(1)} km`} from site)`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Site location marker (strictly when valid site coordinates exist) */}
        {hasSiteCoords && siteLat !== null && siteLon !== null && !isNaN(siteLat) && !isNaN(siteLon) && (isPicker || siteLat !== userLat || siteLon !== userLon) && (
          <Marker
            position={[siteLat, siteLon]}
            icon={createSiteIcon(siteLocation?.name || 'Tagged Site Location')}
            draggable={isPicker}
            eventHandlers={
              isPicker && onLocationSelect
                ? {
                    dragend: (e) => {
                      const pos = e.target.getLatLng();
                      onLocationSelect({
                        latitude: Number(pos.lat.toFixed(6)),
                        longitude: Number(pos.lng.toFixed(6)),
                      });
                    },
                  }
                : undefined
            }
          >
            <Popup>
              <div className="p-2 text-sm">
                <p className="font-bold text-slate-900">{siteLocation?.name || 'Tagged Substation'}</p>
                <p className="text-slate-600 text-xs">{siteLocation?.address || 'Field Substation'}</p>
                <p className="text-brand-600 font-mono text-xs mt-0.5">{siteLat.toFixed(6)}, {siteLon.toFixed(6)}</p>
                {isPicker ? (
                  <p className="text-emerald-700 font-bold text-xs mt-1">● Drag or click to change tagged location</p>
                ) : (
                  <p className="text-slate-700 font-medium text-xs mt-1">Geofence: {geofenceRadius}m Active</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Local Route polyline */}
        {shouldDrawRoute && routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color="#1E63F0"
            weight={4}
            opacity={0.9}
            dashArray="6, 6"
          />
        )}

        {/* Additional Team / Technician Markers (with strict coordinate validation) */}
        {Array.isArray(additionalMarkers) && additionalMarkers.map((m, idx) => {
          if (!m) return null;
          const mLat = Number(m.latitude);
          const mLon = Number(m.longitude);
          if (isNaN(mLat) || isNaN(mLon) || mLat === 0 || mLon === 0) return null;

          return (
            <Marker
              key={`m-${idx}-${m.employeeId || idx}`}
              position={[mLat, mLon]}
              icon={createPulseIcon(m.color || '#10B981', m.title || 'Technician')}
            >
              <Popup>
                <div className="p-2 text-sm">
                  <p className="font-bold text-slate-900">{m.title || 'Technician'}</p>
                  {m.subtitle && <p className="text-slate-600 text-xs mt-0.5">{m.subtitle}</p>}
                  <p className="text-brand-600 font-mono text-xs mt-1">
                    {mLat.toFixed(6)}, {mLon.toFixed(6)}
                  </p>
                  {m.time && (
                    <p className="text-slate-500 text-[11px] mt-0.5">Last Seen: {m.time}</p>
                  )}
                  {m.badge && (
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {m.badge}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map API & Engine Badge */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Map Engine: <strong>Leaflet + OpenStreetMap</strong> & <strong>Mappls GIS API</strong></span>
      </div>
    </div>
  );
};

export default InteractiveMap;
