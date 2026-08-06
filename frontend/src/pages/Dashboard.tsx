import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HERO_SLIDES = [
  '/dashboard-slides/slide-1.png',
  '/dashboard-slides/slide-2.png',
  '/dashboard-slides/slide-3.png',
  '/dashboard-slides/slide-4.png',
];

const SLIDE_INTERVAL_MS = 4500;

const baseOpts: any = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11.5 } } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
    y: { grid: { color: 'rgba(147,164,181,0.18)' }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
  },
};

/* ---------- helpers ---------- */
function KpiCard({ label, value, unit, status, statusLabel, color, sparkData, pct, dir, iconPath }: {
  label: string; value: string; unit: string; status: string; statusLabel: string;
  color: string; sparkData: number[]; pct: string; dir: 'up' | 'down'; iconPath: React.ReactNode;
}) {
  const sparkChart = {
    labels: sparkData.map((_, i) => i),
    datasets: [{ data: sparkData, borderColor: color, borderWidth: 2, pointRadius: 0, tension: .4, fill: true, backgroundColor: color + '22' }],
  };
  const sparkOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  };
  return (
    <div className="card">
      <div className="flex-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>{iconPath}</svg>
        </div>
        <span className={`badge ${status}`}>{statusLabel}</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginTop: 2, color: 'var(--ink)' }}>
        {value}<span style={{ fontSize: 14, color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontWeight: 500 }}> {unit}</span>
      </div>
      <div style={{ height: 44, marginTop: 10 }}>
        <Line data={sparkChart} options={sparkOpts} />
      </div>
      <div className={`trend ${dir}`} style={{ marginTop: 6 }}>
        {dir === 'up' ? '▲' : '▼'} {pct} vs last week
      </div>
    </div>
  );
}

function AlertRow({ level, title, loc, time }: { level: string; title: string; loc: string; time: string }) {
  const nodeClass = level === 'bad' ? 'off' : level === 'warn' ? 'warn' : 'on';
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span className={`pulse-node ${nodeClass}`} style={{ marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{loc}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{time}</div>
    </div>
  );
}

function HeroSlideshowCard() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="card card-pad-lg"
      style={{
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 280,
        background: 'var(--blue-deep)',
      }}
    >
      {HERO_SLIDES.map((src, i) => (
        <div
          key={src}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === slide ? 1 : 0,
            transform: i === slide ? 'scale(1.04)' : 'scale(1)',
            transition: 'opacity 1.1s ease, transform 5.5s ease',
            zIndex: 0,
          }}
        />
      ))}

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(115deg, rgba(18,76,116,0.88) 0%, rgba(29,111,165,0.78) 48%, rgba(31,157,108,0.62) 100%)',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 12.5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: .85, fontWeight: 600 }}>Overall Campus Environmental Health</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, marginTop: 6 }}>Excellent — Campus is thriving today</div>
          <div style={{ marginTop: 14, fontSize: 14.5, opacity: .9, lineHeight: 1.6 }}>All 9 monitored zones report healthy conditions. Air quality is favorable across every building, ambient noise sits below policy thresholds, and weather conditions remain stable through the evening.</div>
          <div style={{ marginTop: 18, fontStyle: 'italic', fontSize: 14, opacity: .85, borderLeft: '3px solid rgba(255,255,255,.5)', paddingLeft: 14 }}>"The campus breathes easiest when every sensor tells the same quiet story."</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="62" stroke="rgba(255,255,255,.25)" strokeWidth="12" fill="none"/>
            <circle cx="75" cy="75" r="62" stroke="#ffffff" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="389.5" strokeDashoffset="42" transform="rotate(-90 75 75)"/>
            <text x="75" y="70" textAnchor="middle" fontFamily="Space Grotesk" fontSize="34" fontWeight="700" fill="#fff">89</text>
            <text x="75" y="92" textAnchor="middle" fontFamily="Inter" fontSize="12" fill="#fff" opacity=".85">Health Score</text>
          </svg>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'flex',
          gap: 8,
        }}
        role="tablist"
        aria-label="Campus photo slides"
      >
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === slide}
            aria-label={`Show campus photo ${i + 1}`}
            onClick={() => setSlide(i)}
            style={{
              width: i === slide ? 22 : 8,
              height: 8,
              borderRadius: 99,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === slide ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'width .35s ease, background .35s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const envData = {
    labels: days,
    datasets: [
      { label: 'AQI', data: [55,50,48,46,44,43,42], borderColor: '#1D6FA5', backgroundColor: '#1D6FA522', tension:.4, fill: true, pointRadius: 3 },
      { label: 'Temp (°C)', data: [27,28,30,31,29,28,29], borderColor: '#E8A33D', backgroundColor: '#E8A33D11', tension:.4, fill: false, pointRadius: 3 },
      { label: 'Noise (dB)', data: [52,51,49,50,48,47,48], borderColor: '#1F9D6C', backgroundColor: '#1F9D6C11', tension:.4, fill: false, pointRadius: 3 },
    ],
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-0"
        style={{
          left: 'var(--sidebar-w)',
          top: 'var(--topnav-h)',
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--dashboard-page-bg-color)',
          backgroundImage: 'var(--dashboard-page-bg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="page-anim relative z-10 h-full overflow-y-auto" style={{ padding: 'var(--page-pad)' }}>
      <HeroSlideshowCard />

      <div className="grid-3 mt-24">
        <KpiCard label="Air Quality Index" value="42" unit="AQI" status="good" statusLabel="Good" color="#1D6FA5" sparkData={[55,50,48,46,44,43,42]} pct="-6.1%" dir="up" iconPath={<><path d="M4 8h11a3 3 0 1 0-3-3"/><path d="M2 13h15a3 3 0 1 1-3 3"/><path d="M4 18h9a2.5 2.5 0 1 1-2.5 2.5"/></>} />
        <KpiCard label="Weather" value="29°C" unit="Partly Cloudy" status="info" statusLabel="Stable" color="#E8A33D" sparkData={[27,28,30,31,29,28,29]} pct="+0.8%" dir="up" iconPath={<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4-2A5 5 0 0 0 6.5 19h11z"/>} />
        <KpiCard label="Noise Level" value="48" unit="dB(A)" status="good" statusLabel="Quiet" color="#124C74" sparkData={[52,51,49,50,48,47,48]} pct="-3.4%" dir="up" iconPath={<><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></>} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--grid-gap)', marginTop: 'var(--section-gap)' }}>
        <div className="card">
          <div className="flex-between">
            <div>
              <div className="section-title" style={{ fontSize: 17 }}>Environmental Trend</div>
              <div className="section-sub" style={{ marginBottom: 0 }}>7-day composite of AQI, temperature and noise</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12.5 }}>7D</button>
              <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12.5 }}>30D</button>
            </div>
          </div>
          <div style={{ height: 280, marginTop: 12 }}>
            <Line data={envData} options={baseOpts} />
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ fontSize: 17 }}>Recent Alerts</div>
          <div className="section-sub">Auto-generated from sensor thresholds</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <AlertRow level="bad"  title="Noise threshold exceeded"  loc="Block C · Library Annex"   time="4m ago" />
            <AlertRow level="warn" title="AQI trending upward"       loc="Block A · Engineering"     time="22m ago" />
            <AlertRow level="warn" title="Sensor signal weak"        loc="Node 14 · Hostel Wing 2"   time="41m ago" />
            <AlertRow level="good" title="Air quality restored"      loc="Block D · Cafeteria"       time="1h ago" />
            <AlertRow level="info" title="Scheduled maintenance"     loc="Weather Station 02"        time="2h ago" />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
