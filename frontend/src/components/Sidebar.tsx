import React from 'react';
import type { PageKey } from '../types';

const navGroups = [
  {
    label: 'Monitor',
    items: [
      { key: 'dashboard' as PageKey, label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></> },
      { key: 'map'       as PageKey, label: 'Campus Map', icon: <><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></> },
      { key: 'weather'   as PageKey, label: 'Weather',    icon: <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4-2A5 5 0 0 0 6.5 19h11z"/> },
      { key: 'air'       as PageKey, label: 'Air Quality', icon: <><path d="M4 8h11a3 3 0 1 0-3-3"/><path d="M2 13h15a3 3 0 1 1-3 3"/><path d="M4 18h9a2.5 2.5 0 1 1-2.5 2.5"/></> },
      { key: 'noise'     as PageKey, label: 'Noise',      icon: <><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></> },
    ],
  },
  {
    label: 'Operate',
    items: [
      { key: 'management' as PageKey, label: 'Management', icon: <path d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4z"/> },
      { key: 'analytics'  as PageKey, label: 'Analytics',  icon: <><path d="M4 19V9M11 19V4M18 19v-6"/><path d="M2 19h20"/></> },
    ],
  },
];

interface SidebarProps {
  active: PageKey;
  onNav: (p: PageKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onNav }) => (
  <div className="sidebar">
    {/* Brand */}
    <div style={{ height: 'var(--topnav-h)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,var(--blue) 0%,var(--green) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} width={22} height={22}>
          <path d="M12 3c-3 3-5 6-5 9a5 5 0 0 0 10 0c0-3-2-6-5-9z"/>
          <path d="M12 21v-6M9 15h6" strokeWidth={1.4}/>
        </svg>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '.5px', color: 'var(--ink)' }}>REIN</div>
        <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '.2px' }}>REC Environmental Intelligence Network</div>
      </div>
    </div>

    {/* Nav */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 14px' }}>
      {navGroups.map(group => (
        <React.Fragment key={group.label}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', letterSpacing: 1, textTransform: 'uppercase', padding: '14px 12px 8px' }}>
            {group.label}
          </div>
          {group.items.map(item => (
            <button key={item.key} className={`nav-item ${active === item.key ? 'active' : ''}`} onClick={() => onNav(item.key)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={19} height={19}>{item.icon}</svg>
              {item.label}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>

    {/* Floating AI mascot */}
    <div className="ai-mascot-slot">
      <button
        type="button"
        className="ai-mascot-fab"
        onClick={() => onNav('ai')}
        aria-label="Open AI Predictions — Pulse"
        title="AI Predictions"
        aria-current={active === 'ai' ? 'page' : undefined}
      >
        <img src="/ai-mascot.png" alt="" draggable={false} />
        <span className="ai-mascot-label">Pulse</span>
        <span className="ai-mascot-hint">click here</span>
      </button>
    </div>

    {/* Footer */}
    <div style={{ padding: '12px 22px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink-faint)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--green-deep)', fontWeight: 600 }}>
        <span className="pulse-node on" />
        All systems nominal
      </div>
      <div>v2.4.1 · Campus Network Node 07</div>
    </div>
  </div>
);
