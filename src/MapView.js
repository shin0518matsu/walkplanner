import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function calcDistance(wps) {
  let total = 0;
  for (let i = 1; i < wps.length; i++) {
    total += wps[i - 1].distanceTo(wps[i]);
  }
  return total / 1000;
}

function makeIcon(color, label) {
  return L.divIcon({
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;font-family:sans-serif;">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: '',
  });
}

export default function MapView({ mode, onWaypointsChange, onMapCenterChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const waypointsRef = useRef([]);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const updateVisuals = useCallback(() => {
    const wps = waypointsRef.current;
    const markers = markersRef.current;

    // ポリライン更新
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (wps.length >= 2) {
      polylineRef.current = L.polyline(wps, {
        color: '#1D9E75',
        weight: 4,
        opacity: 0.85,
      }).addTo(mapInstanceRef.current);
    }

    // マーカーアイコン更新
    markers.forEach((m, i) => {
      const isStart = i === 0;
      const isEnd = i === wps.length - 1 && wps.length > 1;
      const color = isStart ? '#1D9E75' : isEnd ? '#D85A30' : '#378ADD';
      const label = isStart ? 'S' : isEnd ? 'G' : i + 1;
      m.setIcon(makeIcon(color, label));
    });

    const dist = calcDistance(wps);
    onWaypointsChange(wps, dist);
  }, [onWaypointsChange]);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([35.663, 138.568], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      if (mode !== 'click') return;
      const latlng = e.latlng;
      waypointsRef.current = [...waypointsRef.current, latlng];
      const idx = waypointsRef.current.length;
      const color = idx === 1 ? '#1D9E75' : '#378ADD';
      const label = idx === 1 ? 'S' : idx;
      const marker = L.marker(latlng, { icon: makeIcon(color, label) })
        .addTo(map)
        .on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
        });
      markersRef.current = [...markersRef.current, marker];
      updateVisuals();
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      onMapCenterChange([c.lat, c.lng]);
    });

    mapInstanceRef.current = map;
  }, []); // eslint-disable-line

  // モード変更時にクリックハンドラを制御
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.off('click');
    map.on('click', (e) => {
      if (mode !== 'click') return;
      const latlng = e.latlng;
      waypointsRef.current = [...waypointsRef.current, latlng];
      const idx = waypointsRef.current.length;
      const color = idx === 1 ? '#1D9E75' : '#378ADD';
      const label = idx === 1 ? 'S' : idx;
      const marker = L.marker(latlng, { icon: makeIcon(color, label) }).addTo(map);
      markersRef.current = [...markersRef.current, marker];
      updateVisuals();
    });
  }, [mode, updateVisuals]);

  // 外部からclearを受け取る
  useEffect(() => {
    window.__walkplanner_clear = () => {
      waypointsRef.current = [];
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
      onWaypointsChange([], 0);
    };
    window.__walkplanner_addPoints = (points) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      window.__walkplanner_clear();
      const latlngs = points.map(p => L.latLng(p[0], p[1]));
      latlngs.forEach((ll, i) => {
        const isStart = i === 0;
        const isEnd = i === latlngs.length - 1;
        const color = isStart ? '#1D9E75' : isEnd ? '#D85A30' : '#378ADD';
        const label = isStart ? 'S' : isEnd ? 'G' : i + 1;
        const marker = L.marker(ll, { icon: makeIcon(color, label) }).addTo(map);
        markersRef.current.push(ll);
        waypointsRef.current.push(ll);
        markersRef.current[i] = marker;
      });
      updateVisuals();
      map.fitBounds(latlngs, { padding: [40, 40] });
    };
  }, [onWaypointsChange, updateVisuals]);

  return <div ref={mapRef} style={{ flex: 1, minHeight: 0 }} />;
}
