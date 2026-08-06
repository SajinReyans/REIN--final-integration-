import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const baseOpts: any = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11.5 } } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
    y: { grid: { color: 'rgba(147,164,181,0.18)' }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
  },
};

const moduleData = {
  weather: {
    title: "Today's Weather",
    quote: '"Every gust and degree, measured across the whole campus."',
    overview: { big: '29°C', badge: 'Partly Cloudy · Comfortable', desc: 'Winds light from the southwest at 9 km/h. Humidity holding near 54%. No precipitation expected before evening.' },
    stats: [['Temperature','29.4','°C','+1.1°'],['Humidity','54','%','-3%'],['Wind Speed','9','km/h','+2'],['UV Index','6','Moderate','—']] as [string,string,string,string][],
    chartLabel: 'Temperature & Humidity (7-day)',
    datasets: [{ label: 'Temp °C', data: [27,28,30,31,29,28,29], color: '#E8A33D' },{ label: 'Humidity %', data: [58,55,50,49,54,56,54], color: '#1D6FA5' }],
    alerts: [['warn','Heat advisory possible tomorrow','Campus-wide','1h ago'],['good','Conditions stable','All zones','3h ago'],['info','Weather station calibrated','Station 02','5h ago']] as [string,string,string,string][],
  },
  air: {
    title: "Today's Air Quality",
    quote: '"Clean air is the quietest form of care a campus can offer."',
    overview: { big: '42 AQI', badge: 'Good', desc: 'PM2.5 and PM10 levels remain within safe limits across 8 of 10 monitored zones. Slight elevation detected near Library Annex due to nearby construction.' },
    stats: [['PM2.5','18','µg/m³','-4'],['PM10','32','µg/m³','-2'],['CO₂','410','ppm','+6'],['VOC Index','3','Low','—']] as [string,string,string,string][],
    chartLabel: 'AQI Components (7-day)',
    datasets: [{ label: 'PM2.5', data: [22,20,19,18,17,18,18], color: '#1D6FA5' },{ label: 'PM10', data: [36,34,33,32,31,33,32], color: '#1F9D6C' }],
    alerts: [['bad','AQI spike detected','Library Annex','22m ago'],['warn','Elevated dust','Engineering Block B','1h ago'],['good','AQI normalized','Cafeteria Block D','2h ago']] as [string,string,string,string][],
  },
  noise: {
    title: "Today's Noise Levels",
    quote: '"A campus at its best is heard as gently as it is seen."',
    overview: { big: '48 dB(A)', badge: 'Quiet', desc: 'Ambient noise remains within institutional comfort thresholds for 9 of 10 zones. Library Annex continues to register elevated levels from nearby renovation work.' },
    stats: [['Average dB','48','dB(A)','-2'],['Peak dB','71','dB(A)','+5'],['Quiet Hours Compliance','96','%','+1%'],['Noise Complaints','2','today','—']] as [string,string,string,string][],
    chartLabel: 'Noise Levels (7-day)',
    datasets: [{ label: 'Average dB', data: [52,51,49,50,48,47,48], color: '#124C74' },{ label: 'Peak dB', data: [68,70,66,72,69,71,71], color: '#E1523D' }],
    alerts: [['bad','Noise threshold exceeded','Library Annex','4m ago'],['warn','Elevated activity','Hostel Wing 2','40m ago'],['good','Levels normalized','Sports Complex','2h ago']] as [string,string,string,string][],
  },
};

type ModKey = keyof typeof moduleData;

export const EnvModule: React.FC<{ type: ModKey }> = ({ type }) => {
  const d = moduleData[type];

  const overviewSparkData = {
    labels: days,
    datasets: [{ data: d.datasets[0].data, borderColor: d.datasets[0].color, backgroundColor: d.datasets[0].color + '22', borderWidth: 2, pointRadius: 0, tension: .4, fill: true }],
  };
  const overviewOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  const mainData = {
    labels: days,
    datasets: d.datasets.map(ds => ({ label: ds.label, data: ds.data, borderColor: ds.color, backgroundColor: ds.color + '22', tension: .4, fill: true, pointRadius: 3 })),
  };

  const alertBadge = (lvl: string) => {
    const cls = lvl === 'bad' ? 'bad' : lvl === 'warn' ? 'warn' : lvl === 'good' ? 'good' : 'info';
    const lbl = lvl === 'bad' ? 'Critical' : lvl === 'warn' ? 'Warning' : lvl === 'good' ? 'Resolved' : 'Info';
    return <span className={`badge ${cls}`}>{lbl}</span>;
  };

  return (
    <div className="page-anim">
      <div className="section-title" style={{ fontSize: 24 }}>{d.title}</div>
      <div className="quote-strip">{d.quote}</div>

      {/* Overview card */}
      <div className="card mt-24" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px' }}>Today's Overview</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, marginTop: 6, color: 'var(--ink)' }}>{d.overview.big}</div>
          <span className="badge good" style={{ marginTop: 6 }}>{d.overview.badge}</span>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 12, maxWidth: 640, lineHeight: 1.6 }}>{d.overview.desc}</div>
        </div>
        <div style={{ flexShrink: 0, width: 180, height: 90 }}>
          <Line data={overviewSparkData} options={overviewOpts} />
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid-4 mt-24">
        {d.stats.map(s => {
          const isDown = s[3].startsWith('-');
          return (
            <div key={s[0]} className="card">
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>{s[0]}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--ink)' }}>
                {s[1]}<span style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-body)' }}> {s[2]}</span>
              </div>
              <div className={`trend ${isDown ? 'down' : 'up'}`} style={{ marginTop: 6 }}>
                {isDown ? '▼' : '▲'} {s[3]} today
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-day chart */}
      <div className="card mt-24">
        <div className="section-title" style={{ fontSize: 16 }}>{d.chartLabel}</div>
        <div style={{ height: 280, marginTop: 10 }}>
          <Line data={mainData} options={baseOpts} />
        </div>
      </div>

      {/* Alerts table */}
      <div className="card mt-24">
        <div className="section-title" style={{ fontSize: 16 }}>Recent Alerts</div>
        <table>
          <thead><tr><th>Severity</th><th>Message</th><th>Location</th><th>Time</th></tr></thead>
          <tbody>
            {d.alerts.map((a, i) => (
              <tr key={i}>
                <td>{alertBadge(a[0])}</td>
                <td>{a[1]}</td>
                <td>{a[2]}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>{a[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
