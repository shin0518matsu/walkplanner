import React, { useState } from 'react';
import './Sidebar.css';

const TAG_CONFIG = {
  park:       { label: '公園', className: 'tag-park' },
  flat:       { label: '平坦', className: 'tag-flat' },
  hill:       { label: '起伏', className: 'tag-hill' },
  river:      { label: '川沿い', className: 'tag-river' },
  historical: { label: '歴史', className: 'tag-historical' },
  scenic:     { label: '景色', className: 'tag-scenic' },
};

const DIFFICULTY_CONFIG = {
  easy:   { label: '初級', color: '#1D9E75' },
  medium: { label: '中級', color: '#378ADD' },
  hard:   { label: '上級', color: '#D85A30' },
};

export default function Sidebar({
  mode, setMode, waypoints, distance, suggestions,
  loadingSuggestions, routeAnalysis, onFetchSuggestions,
  onFetchAnalysis, onClear, apiUrl,
}) {
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');

  const time = distance > 0 ? Math.round(distance / 4 * 60) : 0;
  const calories = distance > 0 ? Math.round(distance * 60) : 0;

  async function geocodePlace(name) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&accept-language=ja`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.length > 0) return [parseFloat(d[0].lat), parseFloat(d[0].lon)];
    return null;
  }

  async function handleGeocode() {
    if (!startText.trim() || !endText.trim()) {
      setGeoError('出発地と目的地を両方入力してください');
      return;
    }
    setGeocoding(true);
    setGeoError('');
    try {
      const [s, e] = await Promise.all([geocodePlace(startText), geocodePlace(endText)]);
      if (!s) { setGeoError(`「${startText}」が見つかりませんでした`); return; }
      if (!e) { setGeoError(`「${endText}」が見つかりませんでした`); return; }
      if (window.__walkplanner_addPoints) {
        window.__walkplanner_addPoints([s, e]);
      }
    } catch (err) {
      setGeoError('検索中にエラーが発生しました');
    } finally {
      setGeocoding(false);
    }
  }

  function handleClear() {
    onClear();
    if (window.__walkplanner_clear) window.__walkplanner_clear();
    setStartText('');
    setEndText('');
    setGeoError('');
  }

  return (
    <aside className="sidebar">

      {/* モード切替 */}
      <div className="sidebar-section">
        <div className="section-label">入力モード</div>
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'click' ? 'active' : ''}`}
            onClick={() => setMode('click')}
          >地図クリック</button>
          <button
            className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >テキスト入力</button>
        </div>

        {mode === 'click' ? (
          <div className="click-hint">
            <p>地図上をクリックしてポイントを追加</p>
            {waypoints.length > 0 && (
              <div className="wp-count">{waypoints.length}地点設定済み</div>
            )}
          </div>
        ) : (
          <div className="text-inputs">
            <div className="input-group">
              <label><span className="dot dot-start" />出発地</label>
              <input
                type="text"
                value={startText}
                onChange={e => setStartText(e.target.value)}
                placeholder="例：甲府駅"
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
              />
            </div>
            <div className="input-group">
              <label><span className="dot dot-end" />目的地</label>
              <input
                type="text"
                value={endText}
                onChange={e => setEndText(e.target.value)}
                placeholder="例：武田神社"
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
              />
            </div>
            {geoError && <p className="geo-error">{geoError}</p>}
            <button className="btn btn-primary" onClick={handleGeocode} disabled={geocoding}>
              {geocoding ? '検索中...' : 'ルートを検索'}
            </button>
          </div>
        )}
        <button className="btn btn-clear" onClick={handleClear}>🗑 クリア</button>
      </div>

      {/* ルート情報 */}
      <div className="sidebar-section">
        <div className="section-label">ルート情報</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">合計距離</div>
            <div className="stat-value">{distance.toFixed(2)}</div>
            <div className="stat-unit">km</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">目安時間</div>
            <div className="stat-value">{time}</div>
            <div className="stat-unit">分</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">消費カロリー</div>
            <div className="stat-value">{calories}</div>
            <div className="stat-unit">kcal</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ポイント数</div>
            <div className="stat-value">{waypoints.length}</div>
            <div className="stat-unit">地点</div>
          </div>
        </div>

        {distance > 0.1 && (
          <button className="btn btn-secondary" onClick={onFetchAnalysis} style={{ marginTop: 10 }}>
            🤖 AIにルートを分析してもらう
          </button>
        )}

        {routeAnalysis && (
          <div className="route-analysis">
            <p className="analysis-advice">💡 {routeAnalysis.advice}</p>
            {routeAnalysis.tips && routeAnalysis.tips.map((tip, i) => (
              <p key={i} className="analysis-tip">• {tip}</p>
            ))}
          </div>
        )}
      </div>

      {/* AIコース提案 */}
      <div className="sidebar-section sidebar-section--flex">
        <div className="section-label">AIコース提案</div>
        <button className="btn btn-ai" onClick={onFetchSuggestions} disabled={loadingSuggestions}>
          {loadingSuggestions ? '提案を生成中...' : '✨ AIにコースを提案してもらう'}
        </button>

        {loadingSuggestions && (
          <div className="ai-loading">
            <div className="spinner" />
            <span>AIがあなたのエリアを分析中...</span>
          </div>
        )}

        <div className="suggestions-list">
          {suggestions.map((course, i) => {
            const diff = DIFFICULTY_CONFIG[course.difficulty] || DIFFICULTY_CONFIG.easy;
            return (
              <div key={i} className="suggestion-card" onClick={() => {}}>
                <div className="suggestion-header">
                  <span className="suggestion-title">{course.title}</span>
                  <span className="difficulty-badge" style={{ color: diff.color }}>{diff.label}</span>
                </div>
                <div className="suggestion-meta">
                  {course.distance} · {course.time}
                </div>
                <p className="suggestion-desc">{course.description}</p>
                <div className="suggestion-tags">
                  {(course.tagTypes || []).map((t, j) => {
                    const cfg = TAG_CONFIG[t];
                    return cfg ? (
                      <span key={j} className={`tag ${cfg.className}`}>{cfg.label}</span>
                    ) : null;
                  })}
                </div>
                {course.highlights && course.highlights.length > 0 && (
                  <div className="highlights">
                    {course.highlights.map((h, j) => (
                      <span key={j} className="highlight">📍 {h}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loadingSuggestions && suggestions.length === 0 && (
          <p className="empty-hint">ボタンを押すと現在の地図エリアのおすすめコースを提案します</p>
        )}
      </div>

    </aside>
  );
}
