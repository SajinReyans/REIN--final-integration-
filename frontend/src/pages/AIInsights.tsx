import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const hours = ['Now', '3h', '6h', '9h', '12h', '15h', '18h', '21h', '24h'];

const sparkOpts: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#93A4B5' } },
    y: { grid: { color: 'rgba(147,164,181,0.15)' }, ticks: { font: { size: 10 }, color: '#93A4B5' } },
  },
};

function PredictionCard({
  title,
  value,
  unit,
  trend,
  tone,
  summary,
  color,
  data,
}: {
  title: string;
  value: string;
  unit: string;
  trend: string;
  tone: 'up' | 'down' | 'steady';
  summary: string;
  color: string;
  data: number[];
}) {
  const chart = {
    labels: hours,
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: color + '22',
      borderWidth: 2.5,
      pointRadius: 3,
      pointBackgroundColor: color,
      tension: 0.4,
      fill: true,
    }],
  };

  return (
    <article className="card" style={{ padding: 'var(--card-pad)' }}>
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
            {title}
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>
            {value}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-faint)', marginLeft: 4 }}>{unit}</span>
          </div>
        </div>
        <span
          className={`trend ${tone === 'down' ? 'down' : 'up'}`}
          style={{ opacity: tone === 'steady' ? 0.7 : 1 }}
        >
          {tone === 'up' ? '▲' : tone === 'down' ? '▼' : '●'} {trend}
        </span>
      </div>
      <div style={{ height: 140, marginTop: 4 }}>
        <Line data={chart} options={sparkOpts} />
      </div>
      <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{summary}</p>
    </article>
  );
}

export const AIInsights: React.FC = () => {
  return (
    <div className="page-anim" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <img
          src="/ai-mascot.png"
          alt=""
          width={56}
          height={56}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.18))' }}
        />
        <div>
          <div className="section-title" style={{ marginBottom: 2 }}>AI Predictions</div>
          <div className="section-sub" style={{ marginBottom: 0 }}>
            Short-range forecast for temperature, rain chance, and noise
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 'var(--section-gap)' }}>
        <PredictionCard
          title="Temperature Prediction"
          value="30.6"
          unit="°C peak"
          trend="+1.2° next 12h"
          tone="up"
          color="#E8A33D"
          data={[29.4, 29.8, 30.1, 30.6, 30.4, 29.9, 28.7, 27.8, 27.2]}
          summary="Warming through early afternoon, then easing after sunset. Stay comfortable outdoors until ~15:00."
        />
        <PredictionCard
          title="Rain Prediction"
          value="28"
          unit="% chance"
          trend="Rising after 18h"
          tone="up"
          color="#1D6FA5"
          data={[8, 10, 12, 15, 18, 22, 28, 35, 32]}
          summary="Mostly dry daytime. Light shower risk builds after 18:00 — low probability of lasting rain overnight."
        />
        <PredictionCard
          title="Noise Trend Prediction"
          value="52"
          unit="dB(A)"
          trend="Quieter tonight"
          tone="down"
          color="#124C74"
          data={[48, 51, 55, 58, 56, 53, 49, 44, 40]}
          summary="Daytime campus activity peaking midday. Levels decline toward evening study hours — remain within comfort thresholds."
        />
      </div>

      <div className="card" style={{ marginTop: 'var(--grid-gap)', padding: 'var(--card-pad)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          AI Outlook
        </div>
        <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-soft)' }}>
          Next 24 hours look stable overall: warm and mostly dry through afternoon, slight shower chance later, and quieter acoustic conditions after peak campus hours. No threshold breaches predicted for temperature or noise.
        </p>
      </div>
    </div>
  );
};
