import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="logo-icon">🚶</div>
        <div>
          <h1>WalkPlanner</h1>
          <p>ウォーキングルートプランナー</p>
        </div>
      </div>
      <nav className="header-nav">
        <a href="#how" className="nav-link">使い方</a>
        <a href="#about" className="nav-link">について</a>
      </nav>
    </header>
  );
}
