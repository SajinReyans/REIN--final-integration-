import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { buildings, statusColor } from '../data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

type Range = 'day' | 'week' | 'month';
const labelsFor: Record<Range, string[]> = {
  day: ['12am','4am','8am','12pm','4pm','8pm'],
  week: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  month: ['W1','W2','W3','W4'],
};

const opts: any = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11.5 } } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
    y: { grid: { color: 'rgba(147,164,181,0.18)' }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
  },
};
const optsNoLegend = { ...opts, plugins: { legend: { display: false } } };

function rnd(labels: string[], base: number, spread: number) {
  return labels.map(() => Math.round(base + (Math.random() - .5) * spread));
}

export const Analytics: React.FC = () => {
  const [range, setRange] = useState<Range>('week');
  const L = labelsFor[range];

  const lineData = (label: string, color: string, base: number, spread: number) => ({
    labels: L,
    datasets: [{ label, data: rnd(L, base, spread), borderColor: color, backgroundColor: color + '22', tension: .4, fill: true, pointRadius: 3 }],
  });

  const compareData = {
    labels: buildings.map(b => b.id),
    datasets: [{ label: 'Health Score', data: buildings.map(b => b.health), backgroundColor: buildings.map(b => statusColor(b.status)), borderRadius: 6 }],
  };

  const sensorData = {
    labels: ['Uptime','Delivery','Delay','Offline'],
    datasets: [{ data: [98,99,82,91], backgroundColor: ['#1F9D6C','#1D6FA5','#E8A33D','#E1523D'], borderRadius: 8 }],
  };

  return (
    <div className="page-anim">
      <div className="flex-between">
        <div>
          <div className="section-title">Environmental Summary</div>
          <div className="section-sub" style={{ marginBottom: 0 }}>Cross-campus performance analytics</div>
        </div>
        <button className="btn btn-green" onClick={() => alert('Generating report…')}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          Generate Report
        </button>
      </div>

      {/* Range toggle */}
      <div style={{ display: 'flex', gap: 8, margin: 'var(--stack-gap) 0 var(--section-gap)' }}>
        {(['day','week','month'] as Range[]).map(r => (
          <button key={r} className={`btn ${range === r ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '8px 18px', fontSize: 12.5 }} onClick={() => setRange(r)}>
            {r[0].toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid-2">
        {[
          { title: 'AQI Trend',           id: 'aqi',     color: '#1D6FA5', base: 45, spread: 14 },
          { title: 'Weather Trend',        id: 'weather', color: '#E8A33D', base: 29, spread: 4  },
          { title: 'Noise Trend',          id: 'noise',   color: '#124C74', base: 50, spread: 10 },
        ].map(c => (
          <div key={c.id} className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>{c.title}</div>
            <div style={{ height: 220 }}>
              <Line data={lineData(c.title, c.color, c.base, c.spread)} options={opts} />
            </div>
          </div>
        ))}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>Sensor Performance</div>
          <div style={{ height: 220 }}>
            <Bar data={sensorData} options={optsNoLegend} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--grid-gap)', marginTop: 'var(--section-gap)' }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>Campus Comparison</div>
          <div style={{ height: 260 }}>
            <Bar data={compareData} options={optsNoLegend} />
          </div>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--ink)' }}>Environmental Heatmap</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
            {buildings.map(b => (
              <div key={b.id} title={b.name} style={{ aspectRatio: '1', borderRadius: 8, background: statusColor(b.status), opacity: .4 + (b.health / 100) * .6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {b.id}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>Darker = healthier composite score</div>
        </div>
      </div>
    </div>
  );
};
