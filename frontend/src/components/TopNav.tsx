import React, { useEffect, useState } from 'react';
import { pageTitles } from '../data';
import type { PageKey } from '../types';

interface Props { page: PageKey; dark: boolean; onTheme: () => void; }

export const TopNav: React.FC<Props> = ({ page, dark, onTheme }) => {
  const [now, setNow] = useState(new Date());
  const [ago, setAgo] = useState(12);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setAgo(a => a >= 59 ? 0 : a + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="topnav">
      {/* Left — date/time */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.2, minWidth: 180 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
          {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.3px' }}>
          {now.toLocaleTimeString()}
        </span>
      </div>

      {/* Center */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--green)' }}>●</span>
        <span>{pageTitles[page]}</span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Updated {ago}s ago
        </span>

        <button className="icon-btn" title="Toggle theme" onClick={onTheme}>
          {dark
            ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          }
        </button>

        <button className="icon-btn" title="Notifications" style={{ position: 'relative' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>5</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px', borderRadius: 24, border: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--blue),var(--green))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)' }}>RM</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>R. Menon</div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Facilities Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
};
