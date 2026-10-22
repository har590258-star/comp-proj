import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, MapPin, CheckCircle } from 'lucide-react';

// Custom Map Auto-Fit Bounds
const RouteBoundsFitter = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;
    try {
      if (points.length === 1) {
        map.setView(points[0], 15);
      } else {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
        });
      }
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (_) {}
      }, 200);
    } catch (e) {
      console.warn('Map fit bounds warning:', e);
    }
  }, [points, map]);

  return null;
};

// Map Resizer to prevent grey tiles inside containers or modals
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (_) {}
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Custom SVG Markers
const createCheckInIcon = (title = 'Check-In') => {
  return L.divIcon({
    className: 'custom-checkin-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="background: #059669; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 14px rgba(5,150,105,0.4); border: 2px solid #ffffff; display: flex; align-items: center; gap: 5px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></span>
          <span>${title}</span>
        </div>
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: #10B981; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #059669; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createCheckOutIcon = (title = 'Check-Out') => {
  return L.divIcon({
    className: 'custom-checkout-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="background: #2563EB; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 14px rgba(37,99,235,0.4); border: 2px solid #ffffff; display: flex; align-items: center; gap: 5px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></span>
          <span>${title}</span>
        </div>
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: #3B82F6; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #2563EB; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const ShiftRouteMap = ({
  checkInLocation,
  checkOutLocation,
  checkInSiteName = 'Check-In Site',
  checkOutSiteName = 'Check-Out Site',
  checkInTime = '--',
  checkOutTime = '--',
  distanceFormatted = '--',
  workingHours = '--',
  waypoints = [],
  height = '340px',
  className = '',
}) => {
  const inLat = checkInLocation?.latitude != null ? Number(checkInLocation.latitude) : null;
  const inLon = checkInLocation?.longitude != null ? Number(checkInLocation.longitude) : null;
  const hasIn = inLat !== null && inLon !== null && !isNaN(inLat) && !isNaN(inLon);

  const outLat = checkOutLocation?.latitude != null ? Number(checkOutLocation.latitude) : null;
  const outLon = checkOutLocation?.longitude != null ? Number(checkOutLocation.longitude) : null;
  const hasOut = outLat !== null && outLon !== null && !isNaN(outLat) && !isNaN(outLon);

  // Generate route points array
  const points = [];
  if (hasIn) points.push([inLat, inLon]);

  // If there are intermediate waypoints, insert them
  if (Array.isArray(waypoints) && waypoints.length > 0) {
    waypoints.forEach((wp) => {
      const wLat = Number(wp.latitude);
      const wLon = Number(wp.longitude);
      if (!isNaN(wLat) && !isNaN(wLon)) {
        points.push([wLat, wLon]);
      }
    });
  }

  if (hasOut) points.push([outLat, outLon]);

  const defaultCenter = hasIn ? [inLat, inLon] : hasOut ? [outLat, outLon] : [12.962879, 77.5968];

  if (!hasIn && !hasOut) {
    return (
      <div
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-500 ${className}`}
        style={{ height }}
      >
        <MapPin className="w-8 h-8 text-slate-400 mb-2" />
        <p className="font-bold text-sm text-slate-700">GPS Coordinates Not Available</p>
        <p className="text-xs text-slate-500 mt-1">This shift has no recorded check-in or check-out GPS coordinates.</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-300 shadow-md ${className}`}
      style={{ height, minHeight: '260px' }}
    >
      {/* Floating Distance & Metrics Badge */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-lg border border-white/20 flex flex-wrap items-center gap-3 text-xs pointer-events-auto">
        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
          <Navigation className="w-3.5 h-3.5" />
          <span>Distance: <strong className="text-white text-sm font-black font-mono">{distanceFormatted}</strong></span>
        </div>
        {workingHours && workingHours !== '--' && (
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold border-l border-white/20 pl-3">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>Shift: <strong className="text-white">{workingHours}</strong></span>
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Mappls GIS'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />
        <MapResizer />
        <RouteBoundsFitter points={points} />

        {/* Route Polyline connecting Check-In to Check-Out */}
        {points.length > 1 && (
          <>
            {/* Background shadow stroke for route */}
            <Polyline
              positions={points}
              color="#1E293B"
              weight={6}
              opacity={0.4}
            />
            {/* Primary animated route line */}
            <Polyline
              positions={points}
              color="#2563EB"
              weight={4}
              opacity={0.95}
              dashArray="8, 6"
            />
          </>
        )}

        {/* Check-In Marker */}
        {hasIn && (
          <Marker position={[inLat, inLon]} icon={createCheckInIcon(`Start: ${checkInSiteName}`)}>
            <Popup>
              <div className="p-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold mb-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Shift Check-In</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{checkInSiteName}</p>
                <p className="text-slate-600 font-medium mt-0.5">Time: <strong className="text-slate-900">{checkInTime}</strong></p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">{inLat.toFixed(6)}, {inLon.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Check-Out Marker */}
        {hasOut && (
          <Marker position={[outLat, outLon]} icon={createCheckOutIcon(`End: ${checkOutSiteName}`)}>
            <Popup>
              <div className="p-2 text-xs">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Shift Check-Out</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{checkOutSiteName}</p>
                <p className="text-slate-600 font-medium mt-0.5">Time: <strong className="text-slate-900">{checkOutTime}</strong></p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">{outLat.toFixed(6)}, {outLon.toFixed(6)}</p>
                <p className="text-emerald-700 font-bold text-[11px] mt-1">Traveled from Check-In: {distanceFormatted}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Bottom Floating Legend / Route Summary */}
      <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-[11px] font-semibold text-slate-700">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>In: {checkInSiteName}</span>
        </div>
        <span className="text-slate-300">➔</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Out: {checkOutSiteName}</span>
        </div>
      </div>
    </div>
  );
};

export default ShiftRouteMap;
