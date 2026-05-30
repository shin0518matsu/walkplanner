import React, { useState, useCallback } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AdBanner from './components/AdBanner';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function App() {
  const [waypoints, setWaypoints] = useState([]);
  const [distance, setDistance] = useState(0);
  const [mode, setMode] = useState('click'); // 'click' | 'text'
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState(null);
  const [mapCenter, setMapCenter] = useState([35.663, 138.568]);
  const [status, setStatus] = useState('地図をクリックしてルートを作成してください');

  const handleWaypointsChange = useCallback((newWaypoints, newDistance) => {
    setWaypoints(newWaypoints);
    setDistance(newDistance);
    if (newWaypoints.length === 0) {
      setStatus('地図をクリックしてルートを作成してください');
      setRouteAnalysis(null);
    } else if (newWaypoints.length === 1) {
      setStatus('出発地を設定しました。次のポイントを追加してください');
    } else {
      setStatus(`${newDistance.toFixed(2)}km のルートが設定されています`);
    }
  }, []);

  const handleMapCenterChange = useCallback((center) => {
    setMapCenter(center);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch(`${API_URL}/api/suggest-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: mapCenter[0],
          lng: mapCenter[1],
        }),
      });
      const data = await res.json();
      if (data.courses) setSuggestions(data.courses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [mapCenter]);

  const fetchRouteAnalysis = useCallback(async () => {
    if (distance < 0.1) return;
    try {
      const res = await fetch(`${API_URL}/api/analyze-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance: distance.toFixed(2), points: waypoints.length }),
      });
      const data = await res.json();
      setRouteAnalysis(data);
    } catch (e) {
      console.error(e);
    }
  }, [distance, waypoints.length]);

  return (
    <div className="app">
      <Header />
      <AdBanner slot="top" />
      <div className="main-layout">
        <Sidebar
          mode={mode}
          setMode={setMode}
          waypoints={waypoints}
          distance={distance}
          suggestions={suggestions}
          loadingSuggestions={loadingSuggestions}
          routeAnalysis={routeAnalysis}
          onFetchSuggestions={fetchSuggestions}
          onFetchAnalysis={fetchRouteAnalysis}
          onClear={() => handleWaypointsChange([], 0)}
          apiUrl={API_URL}
        />
        <div className="map-container">
          <MapView
            mode={mode}
            onWaypointsChange={handleWaypointsChange}
            onMapCenterChange={handleMapCenterChange}
          />
          <div className="status-bar">
            <span className="status-dot" />
            <span>{status}</span>
          </div>
        </div>
      </div>
      <AdBanner slot="bottom" />
    </div>
  );
}
