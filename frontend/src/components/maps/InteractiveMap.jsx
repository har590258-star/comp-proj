import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Component to dynamically re-center map to employee position
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
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
}) => {
  // 1. Employee real live location is primary
  const hasUserCoords = userLocation?.latitude !== null && userLocation?.latitude !== undefined &&
                        userLocation?.longitude !== null && userLocation?.longitude !== undefined;

  const userLat = hasUserCoords ? Number(userLocation.latitude) : (center ? center[0] : 12.9716);
  const userLon = hasUserCoords ? Number(userLocation.longitude) : (center ? center[1] : 77.5946);

  // 2. Active site location (always keep authentic site coordinates)
  const hasSiteCoords = siteLocation?.latitude !== undefined && siteLocation?.latitude !== null &&
                        siteLocation?.longitude !== undefined && siteLocation?.longitude !== null;

  const siteLat = hasSiteCoords ? Number(siteLocation.latitude) : userLat;
  const siteLon = hasSiteCoords ? Number(siteLocation.longitude) : userLon;

  const distKm = getDistanceKm(userLat, userLon, siteLat, siteLon);
  const distMeters = Math.round(distKm * 1000);
  const isInGeofence = distMeters <= geofenceRadius;

  const activeCenter = hasUserCoords ? [userLat, userLon] : (center || [siteLat, siteLon]);

  // Draw connecting route line and fit bounds whenever both user location and site location are present
  const shouldDrawRoute = showRoute && hasUserCoords && hasSiteCoords && distMeters > 50;
  const routePoints = [[userLat, userLon], [siteLat, siteLon]];
  const boundsPoints = shouldDrawRoute ? routePoints : [[userLat, userLon]];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-300 shadow-md ${className}`}
      style={{ height, minHeight: '300px' }}
    >
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

        {shouldDrawRoute ? (
          <FitBounds points={boundsPoints} />
        ) : (
          <RecenterMap center={activeCenter} zoom={zoom} />
        )}

        {/* 500m Authorized Field Geofence Boundary Circle */}
        {showGeofence && (
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

        {/* User live device GPS marker */}
        {hasUserCoords && (
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

        {/* Site location marker */}
        {siteLocation && (siteLat !== userLat || siteLon !== userLon) && (
          <Marker position={[siteLat, siteLon]} icon={createSiteIcon(siteLocation.name || 'Assigned Site')}>
            <Popup>
              <div className="p-2 text-sm">
                <p className="font-bold text-slate-900">{siteLocation.name || 'Assigned Site'}</p>
                <p className="text-slate-600 text-xs">{siteLocation.address || 'Field Substation'}</p>
                <p className="text-brand-600 font-mono text-xs mt-0.5">{siteLat.toFixed(6)}, {siteLon.toFixed(6)}</p>
                <p className="text-slate-700 font-medium text-xs mt-1">Geofence: {geofenceRadius}m Active</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Local Route polyline */}
        {shouldDrawRoute && (
          <Polyline
            positions={routePoints}
            color="#1E63F0"
            weight={4}
            opacity={0.9}
            dashArray="6, 6"
          />
        )}

        {/* Additional Team / Technician Markers */}
        {additionalMarkers && additionalMarkers.map((m, idx) => (
          m.latitude && m.longitude ? (
            <Marker
              key={`m-${idx}`}
              position={[Number(m.latitude), Number(m.longitude)]}
              icon={createPulseIcon(m.color || '#10B981', m.title)}
            >
              <Popup>
                <div className="p-2 text-sm">
                  <p className="font-bold text-slate-900">{m.title}</p>
                  {m.subtitle && <p className="text-slate-600 text-xs mt-0.5">{m.subtitle}</p>}
                  <p className="text-brand-600 font-mono text-xs mt-1">
                    {Number(m.latitude).toFixed(6)}, {Number(m.longitude).toFixed(6)}
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
          ) : null
        ))}
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
