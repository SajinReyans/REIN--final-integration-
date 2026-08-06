import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { useEnvironmentalData } from '../hooks/useEnvironmentalData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

type Range = 'day' | 'week' | 'month';

const opts: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11.5 } } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
    y: { grid: { color: 'rgba(147,164,181,0.18)' }, ticks: { font: { family: 'IBM Plex Mono', size: 10.5 }, color: '#93A4B5' } },
  },
};
const optsNoLegend = { ...opts, plugins: { legend: { display: false } } };

const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const api = (path: string) => `${backendUrl}${path}`;

interface ChartPoints { labels: string[]; values: number[] }

/** Bucket raw time-series readings into aggregated labels for the chosen range */
function bucketReadings(
  readings: Record<string, unknown>[],
  range: Range,
  valueKey: string,
): ChartPoints {
  if (readings.length === 0) return { labels: [], values: [] };

  const now = Date.now();

  if (range === 'day') {
    const buckets = ['12am', '4am', '8am', '12pm', '4pm', '8pm'];
    const sums: number[] = Array(6).fill(0);
    const counts: number[] = Array(6).fill(0);
    readings.forEach((r) => {
      const d = new Date(r.timestamp as string);
      const hour = d.getHours();
      const idx = Math.min(Math.floor(hour / 4), 5);
      const v = Number(r[valueKey]);
      if (Number.isFinite(v)) { sums[idx] += v; counts[idx]++; }
    });
    return { labels: buckets, values: sums.map((s, i) => counts[i] > 0 ? parseFloat((s / counts[i]).toFixed(1)) : 0) };
  }

  if (range === 'week') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sums: number[] = Array(7).fill(0);
    const counts: number[] = Array(7).fill(0);
    readings.forEach((r) => {
      const d = new Date(r.timestamp as string);
      const idx = d.getDay();
      const v = Number(r[valueKey]);
      if (Number.isFinite(v)) { sums[idx] += v; counts[idx]++; }
    });
    return { labels: days, values: sums.map((s, i) => counts[i] > 0 ? parseFloat((s / counts[i]).toFixed(1)) : 0) };
  }

  // month — group by week number within the last 28 days
  const weeks = ['W1', 'W2', 'W3', 'W4'];
  const sums: number[] = Array(4).fill(0);
  const counts: number[] = Array(4).fill(0);
  readings.forEach((r) => {
    const d = new Date(r.timestamp as string);
    const ageMs = now - d.getTime();
    const week = Math.min(Math.floor(ageMs / (7 * 86400 * 1000)), 3);
    const idx = 3 - week; // W1 oldest, W4 newest
    const v = Number(r[valueKey]);
    if (Number.isFinite(v)) { sums[idx] += v; counts[idx]++; }
  });
  return { labels: weeks, values: sums.map((s, i) => counts[i] > 0 ? parseFloat((s / counts[i]).toFixed(1)) : 0) };
}

function useAnalyticsData(range: Range) {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<ChartPoints>({ labels: [], values: [] });
  const [aqi, setAqi] = useState<ChartPoints>({ labels: [], values: [] });
  const [noise, setNoise] = useState<ChartPoints>({ labels: [], values: [] });

  useEffect(() => {
    setLoading(true);

    const limit = range === 'day' ? 100 : range === 'week' ? 500 : 1000;

    Promise.allSettled([
      fetch(api(`/api/weather/history?limit=${limit}&page=1`)).then((r) => r.ok ? r.json() : { data: [] }),
      fetch(api(`/api/air/readings/recent?limit=${limit}`)).then((r) => r.ok ? r.json() : []),
      fetch(api(`/api/noise/readings/recent?limit=${limit}`)).then((r) => r.ok ? r.json() : []),
    ]).then(([wRes, aRes, nRes]) => {
      const wData: Record<string, unknown>[] = wRes.status === 'fulfilled' ? (wRes.value?.data ?? wRes.value ?? []) : [];
      const aData: Record<string, unknown>[] = aRes.status === 'fulfilled' ? (Array.isArray(aRes.value) ? aRes.value : aRes.value?.data ?? []) : [];
      const nData: Record<string, unknown>[] = nRes.status === 'fulfilled' ? (Array.isArray(nRes.value) ? nRes.value : nRes.value?.data ?? []) : [];

      setWeather(bucketReadings(wData, range, 'temperature'));
      setAqi(bucketReadings(aData, range, 'pm25'));
      setNoise(bucketReadings(nData, range, 'noise_level_db'));
      setLoading(false);
    });
  }, [range]);

  return { loading, weather, aqi, noise };
}

function buildLineDataset(label: string, color: string, points: ChartPoints) {
  return {
    labels: points.labels,
    datasets: [{
      label,
      data: points.values,
      borderColor: color,
      backgroundColor: color + '22',
      tension: .4,
      fill: true,
      pointRadius: 3,
    }],
  };
}

export const Analytics: React.FC = () => {
  const [range, setRange] = useState<Range>('week');
  const { loading, weather, aqi, noise } = useAnalyticsData(range);
  const live = useEnvironmentalData();

  // Derive live sensor performance metrics from actual backend responses
  const hasWeather = live.weather.details?.temperature > 0 || live.history.temperature.some(v => v > 0);
  const hasAir = live.air.score > 0 || live.history.aqi.some(v => v > 0);
  const hasNoise = live.noise.level > 0 || live.history.noiseLevel.some(v => v > 0);

  const activeCount = (hasWeather ? 1 : 0) + (hasAir ? 1 : 0) + (hasNoise ? 1 : 0);
  const deliveryPct = Math.round((activeCount / 3) * 100);
  const weatherUptime = hasWeather ? 100 : 0;
  const airUptime = hasAir ? 100 : 0;
  const noiseUptime = hasNoise ? 100 : 0;

  const sensorData = {
    labels: ['Weather Uptime', 'Air Uptime', 'Noise Uptime', 'Overall Delivery'],
    datasets: [{
      data: [weatherUptime, airUptime, noiseUptime, deliveryPct],
      backgroundColor: ['#1F9D6C', '#1D6FA5', '#E8A33D', '#124C74'],
      borderRadius: 8,
    }],
  };

  // Derive per-floor / module health comparison directly from live readings
  const floorReadings = live.air.floors;
  const zoneLabels = floorReadings.length > 0
    ? floorReadings.map(f => `${f.floorLevel.toUpperCase()} Floor`)
    : ['Weather Station', 'Air Node', 'Noise Node'];

  const zoneScores = floorReadings.length > 0
    ? floorReadings.map(f => Math.max(0, 100 - Math.round(f.pm25 * 1.5 + f.co2 / 20)))
    : [live.weather.score, live.air.score, live.noise.score];

  const compareData = {
    labels: zoneLabels,
    datasets: [{
      label: 'Live Health Score',
      data: zoneScores,
      backgroundColor: zoneScores.map(s => s >= 80 ? '#1F9D6C' : s >= 60 ? '#E8A33D' : '#E1523D'),
      borderRadius: 6,
    }],
  };

  return (
    <div className="page-anim">
      <div className="flex-between">
        <div>
          <div className="section-title">Environmental Summary</div>
          <div className="section-sub" style={{ marginBottom: 0 }}>Cross-campus performance analytics — live backend data</div>
        </div>
        <button className="btn btn-green" onClick={() => window.print()}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          Export Summary
        </button>
      </div>

      {/* Range toggle */}
      <div style={{ display: 'flex', gap: 8, margin: 'var(--stack-gap) 0 var(--section-gap)' }}>
        {(['day', 'week', 'month'] as Range[]).map(r => (
          <button
            key={r}
            className={`btn ${range === r ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 18px', fontSize: 12.5 }}
            onClick={() => setRange(r)}
          >
            {r[0].toUpperCase() + r.slice(1)}
          </button>
        ))}
        {loading && (
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', alignSelf: 'center', marginLeft: 8 }}>
            Loading backend history…
          </span>
        )}
      </div>

      <div className="grid-2">
        {[
          { title: 'Temperature Trend (°C)',   id: 'weather', color: '#E8A33D', data: weather },
          { title: 'PM2.5 Trend (µg/m³)',      id: 'aqi',     color: '#1D6FA5', data: aqi    },
          { title: 'Noise Trend (dB)',          id: 'noise',   color: '#124C74', data: noise  },
        ].map(c => (
          <div key={c.id} className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>{c.title}</div>
            <div style={{ height: 220 }}>
              {c.data.labels.length > 0
                ? <Line data={buildLineDataset(c.title, c.color, c.data)} options={opts} />
                : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
                    Waiting for telemetry readings…
                  </div>
              }
            </div>
          </div>
        ))}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>Live Sensor Uptime & Delivery (%)</div>
          <div style={{ height: 220 }}>
            <Bar data={sensorData} options={optsNoLegend} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--grid-gap)', marginTop: 'var(--section-gap)' }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>Zone / Floor Health Breakdown</div>
          <div style={{ height: 260 }}>
            <Bar data={compareData} options={optsNoLegend} />
          </div>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--ink)' }}>Live Node Health Heatmap</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'WS', name: 'Weather Node', score: live.weather.score, active: hasWeather },
              { id: 'AQ', name: 'Air Quality Node', score: live.air.score, active: hasAir },
              { id: 'NS', name: 'Noise Sensor', score: live.noise.score, active: hasNoise },
            ].map(node => {
              const bg = node.active ? (node.score >= 80 ? '#1F9D6C' : node.score >= 60 ? '#E8A33D' : '#3B82F6') : '#E1523D';
              return (
                <div
                  key={node.id}
                  title={`${node.name}: ${node.active ? `Score ${node.score}` : 'Offline'}`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 10,
                    background: bg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    padding: 6,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14 }}>{node.id}</span>
                  <span style={{ fontSize: 9.5, opacity: 0.9, marginTop: 2 }}>{node.active ? `${node.score} pts` : 'Offline'}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 12 }}>
            Green/Blue = Active & Normal · Red = Offline / High Risk
          </div>
        </div>
      </div>
    </div>
  );
};
