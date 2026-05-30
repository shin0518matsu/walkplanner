import React, { useEffect } from 'react';
import './AdBanner.css';

const ADSENSE_CLIENT = process.env.REACT_APP_ADSENSE_CLIENT;

export default function AdBanner({ slot }) {
  useEffect(() => {
    if (ADSENSE_CLIENT && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {}
    }
  }, []);

  // AdSense未設定の場合はプレースホルダーを表示（開発用）
  if (!ADSENSE_CLIENT) {
    return (
      <div className={`ad-banner ad-banner--${slot} ad-placeholder`}>
        <span>広告スペース（AdSense審査通過後に表示）</span>
      </div>
    );
  }

  return (
    <div className={`ad-banner ad-banner--${slot}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot === 'top' ? '1234567890' : '0987654321'}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
