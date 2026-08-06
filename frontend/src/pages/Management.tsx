import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { buildings, statusColor } from '../data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const lineOpts: any = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11.5 } } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
    y: { grid: { color: 'rgba(147,164,181,0.18)' }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
  },
};

function makeLine(data: number[], color: string, label: string) {
  return { labels: days, datasets: [{ label, data, borderColor: color, backgroundColor: color + '22', tension: .4, fill: true, pointRadius: 2 }] };
}

function StatCard({ label, val, tone }: { label: string; val: string; tone: 'good' | 'warn' | 'bad' | 'info' }) {
  const nodeClass = tone === 'good' ? 'on' : tone === 'warn' ? 'warn' : tone === 'bad' ? 'off' : 'on';
  return (
    <div className="card">
      <div className="flex-between">
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>{label}</span>
        <span className={`pulse-node ${nodeClass}`} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, marginTop: 6, color: 'var(--ink)' }}>{val}</div>
    </div>
  );
}

export const Management: React.FC = () => (
  <div className="page-anim">
    <div className="section-title">Sensor Management</div>
    <div className="section-sub">Fleet health across every campus node</div>

    <div className="grid-4">
      <StatCard label="Total Sensors"          val="142" tone="info" />
      <StatCard label="Active"                 val="128" tone="good" />
      <StatCard label="Inactive"               val="9"   tone="bad" />
      <StatCard label="Maintenance Required"   val="5"   tone="warn" />
    </div>

    <div className="section-title mt-24" style={{ fontSize: 17 }}>Buildings</div>
    <div className="grid-3">
      {buildings.map(b => {
        const col = statusColor(b.status);
        const badgeClass = b.status === 'good' ? 'good' : b.status === 'warn' ? 'warn' : 'bad';
        const badgeLabel = b.status === 'good' ? 'Healthy' : b.status === 'warn' ? 'Caution' : 'Critical';
        return (
          <div key={b.id} className="card card-flush" style={{ overflow: 'hidden' }}>
            <div style={{ height: 110, background: `linear-gradient(160deg,${col}33,${col}0d)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={1.5}>
                <path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6"/>
              </svg>
            </div>
            <div style={{ padding: 'var(--card-pad-sm)' }}>
              <div className="flex-between">
                <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>{b.name}</div>
                <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                <div>Sensors: <b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{8 + (b.id.charCodeAt(0) % 4)}</b></div>
                <div>Active:  <b style={{ color: 'var(--green-deep)', fontFamily: 'var(--font-mono)' }}>{6 + (b.id.charCodeAt(0) % 3)}</b></div>
                <div>Offline: <b style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{b.status === 'bad' ? 2 : b.status === 'warn' ? 1 : 0}</b></div>
                <div>Updated: <b style={{ fontFamily: 'var(--font-mono)' }}>2m ago</b></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <div className="section-title mt-24" style={{ fontSize: 17 }}>Sensor Health Trends</div>
    <div className="grid-2">
      {[
        { id: 'uptime',  title: 'Sensor Uptime (%)',              data: [98,97,99,96,98,99,99.2], color: '#1F9D6C' },
        { id: 'delay',   title: 'Communication Delay (ms)',       data: [120,140,110,160,130,105,98], color: '#1D6FA5' },
        { id: 'offline', title: 'Offline Frequency (events/day)', data: [3,5,2,6,4,2,1],           color: '#E1523D' },
        { id: 'packet',  title: 'Packet Delivery Rate (%)',       data: [99.1,98.7,99.3,98.2,99,99.4,99.6], color: '#124C74' },
      ].map(({ id, title, data, color }) => (
        <div key={id} className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>{title}</div>
          <div style={{ height: 220 }}>
            <Line data={makeLine(data, color, title)} options={lineOpts} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
