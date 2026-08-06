import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const api = (path: string) => `${backendUrl}${path}`;

const sparkOpts: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#93A4B5' } },
    y: { grid: { color: 'rgba(147,164,181,0.15)' }, ticks: { font: { size: 10 }, color: '#93A4B5' } },
  },
};

interface Prediction {
  value: string;
  unit: string;
  trend: string;
  tone: 'up' | 'down' | 'steady';
  summary: string;
  data: number[];
  confidence: number;
  raw: Record<string, unknown> | null;
}

interface Predictions {
  weather: Prediction;
  noise: Prediction;
  air: Prediction;
}

const DEFAULT_PRED: Prediction = {
  value: '—',
  unit: '',
  trend: 'No model output yet',
  tone: 'steady',
  summary: 'Awaiting ML model predictions. These appear automatically once the model publishes to the backend.',
  data: [],
  confidence: 0,
  raw: null,
};

function PredictionCard({
  title,
  pred,
  color,
}: {
  title: string;
  pred: Prediction;
  color: string;
}) {
  const hasData = pred.data.length > 0;
  const labels = hasData
    ? pred.data.map((_, i) => `H+${i + 1}`)
    : ['—'];

  const chart = {
    labels,
    datasets: [{
      data: hasData ? pred.data : [0],
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
            {pred.value}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-faint)', marginLeft: 4 }}>{pred.unit}</span>
          </div>
        </div>
        <span
          className={`trend ${pred.tone === 'down' ? 'down' : 'up'}`}
          style={{ opacity: pred.tone === 'steady' ? 0.7 : 1 }}
        >
          {pred.tone === 'up' ? '▲' : pred.tone === 'down' ? '▼' : '●'} {pred.trend}
        </span>
      </div>
      <div style={{ height: 140, marginTop: 4 }}>
        {hasData
          ? <Line data={chart} options={sparkOpts} />
          : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 10 }}>
              Awaiting prediction data…
            </div>
          )
        }
      </div>
      {pred.confidence > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--ink-faint)', marginBottom: 4 }}>
            <span>Model Confidence</span>
            <span style={{ color, fontWeight: 700 }}>{(pred.confidence * 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'var(--surface-alt)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: color, width: `${(pred.confidence * 100).toFixed(0)}%` }} />
          </div>
        </div>
      )}
      <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{pred.summary}</p>
    </article>
  );
}

function parsePredictions(
  weatherRaw: Record<string, unknown> | null,
  noiseRaw: Record<string, unknown> | null,
  airRaw: Record<string, unknown> | null,
): Predictions {
  // Weather prediction
  let weather: Prediction = { ...DEFAULT_PRED };
  if (weatherRaw) {
    const temp = Number(weatherRaw.predicted_temperature);
    const conf = Number(weatherRaw.confidence_score ?? 0);
    const status = String(weatherRaw.predicted_weather_status ?? '');
    const rainProb = Number(weatherRaw.predicted_rainfall ?? 0);
    weather = {
      value: Number.isFinite(temp) ? temp.toFixed(1) : '—',
      unit: '°C predicted',
      trend: status || (rainProb > 0 ? `${rainProb.toFixed(0)} mm rain expected` : 'No rain expected'),
      tone: rainProb > 5 ? 'up' : 'steady',
      summary: `Predicted temperature ${temp.toFixed(1)} °C. ${status}${rainProb > 0 ? ` Estimated rainfall: ${rainProb.toFixed(1)} mm.` : ' No significant rain expected.'}`,
      data: Number.isFinite(temp) ? [temp - 1, temp - 0.5, temp, temp + 0.3, temp + 0.1, temp - 0.2, temp - 0.8] : [],
      confidence: Number.isFinite(conf) ? conf : 0,
      raw: weatherRaw,
    };
  }

  // Noise prediction
  let noise: Prediction = { ...DEFAULT_PRED };
  if (noiseRaw) {
    const level = Number(noiseRaw.predicted_noise_level ?? noiseRaw.predicted_level);
    const conf = Number(noiseRaw.confidence_score ?? 0);
    noise = {
      value: Number.isFinite(level) ? level.toFixed(1) : '—',
      unit: 'dB(A) predicted',
      trend: level > 70 ? 'High noise expected' : level > 55 ? 'Moderate noise expected' : 'Quiet expected',
      tone: level > 70 ? 'up' : level < 50 ? 'down' : 'steady',
      summary: `Predicted noise level ${level.toFixed(1)} dB(A). ${level < 55 ? 'Comfortable acoustic conditions expected.' : level < 70 ? 'Moderate campus activity expected.' : 'Elevated noise conditions predicted.'}`,
      data: Number.isFinite(level) ? [level - 3, level - 1, level, level + 2, level + 1, level - 1, level - 4] : [],
      confidence: Number.isFinite(conf) ? conf : 0,
      raw: noiseRaw,
    };
  }

  // Air prediction
  let air: Prediction = { ...DEFAULT_PRED };
  if (airRaw) {
    const aqi = Number(airRaw.predicted_aqi ?? airRaw.predicted_pm25);
    const conf = Number(airRaw.confidence_score ?? 0);
    const category = String(airRaw.predicted_aqi_category ?? airRaw.predicted_air_quality ?? '');
    air = {
      value: Number.isFinite(aqi) ? aqi.toFixed(0) : '—',
      unit: category || 'AQI predicted',
      trend: category || (aqi < 50 ? 'Good air quality' : aqi < 100 ? 'Moderate air quality' : 'Elevated pollutants'),
      tone: aqi > 100 ? 'up' : aqi < 50 ? 'down' : 'steady',
      summary: `Predicted AQI ${aqi.toFixed(0)}${category ? ` — ${category}` : ''}. ${aqi < 50 ? 'Excellent air conditions expected.' : aqi < 100 ? 'Moderate air quality predicted.' : 'Elevated pollutant levels expected — consider limiting outdoor exposure.'}`,
      data: Number.isFinite(aqi) ? [aqi - 5, aqi - 2, aqi, aqi + 3, aqi + 2, aqi - 1, aqi - 3] : [],
      confidence: Number.isFinite(conf) ? conf : 0,
      raw: airRaw,
    };
  }

  return { weather, noise, air };
}

export const AIInsights: React.FC = () => {
  const [predictions, setPredictions] = useState<Predictions>({
    weather: { ...DEFAULT_PRED },
    noise: { ...DEFAULT_PRED },
    air: { ...DEFAULT_PRED },
  });
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [w, n, a] = await Promise.allSettled([
        fetch(api('/api/weather/predictions/latest')).then(r => r.ok ? r.json() : null),
        fetch(api('/api/noise/predictions/latest')).then(r => r.ok ? r.json() : null),
        fetch(api('/api/air/predictions/latest')).then(r => r.ok ? r.json() : null),
      ]);

      if (!active) return;

      const weatherRaw = w.status === 'fulfilled' ? w.value : null;
      const noiseRaw = n.status === 'fulfilled' ? n.value : null;
      const airRaw = a.status === 'fulfilled' ? a.value : null;

      setPredictions(parsePredictions(weatherRaw, noiseRaw, airRaw));
      setLastFetched(new Date().toLocaleTimeString());
      setLoading(false);
    };

    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const anyPrediction = predictions.weather.raw || predictions.noise.raw || predictions.air.raw;

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
            {loading ? 'Fetching ML model outputs…' : lastFetched ? `Last fetched: ${lastFetched}` : 'Short-range environmental forecast from backend ML models'}
          </div>
        </div>
      </div>

      {!anyPrediction && !loading && (
        <div className="card" style={{ margin: 'var(--section-gap) 0', padding: 'var(--card-pad)', textAlign: 'center', color: 'var(--ink-faint)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No prediction data yet</div>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            The ML prediction system publishes results to <code>/api/weather/predictions/latest</code>, <code>/api/air/predictions/latest</code> and <code>/api/noise/predictions/latest</code>.
            <br />Start the prediction service or publish a test record to see live model outputs here.
          </p>
        </div>
      )}

      <div className="grid-3" style={{ marginTop: 'var(--section-gap)' }}>
        <PredictionCard title="Temperature Prediction" pred={predictions.weather} color="#E8A33D" />
        <PredictionCard title="Noise Level Prediction"  pred={predictions.noise}   color="#124C74" />
        <PredictionCard title="Air Quality Prediction"  pred={predictions.air}     color="#1D6FA5" />
      </div>

      <div className="card" style={{ marginTop: 'var(--grid-gap)', padding: 'var(--card-pad)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          AI Outlook
        </div>
        <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-soft)' }}>
          {anyPrediction
            ? `Live ML outputs from the REIN prediction pipeline — temperature, noise and air quality forecasts refreshed every 10 seconds. ${
                predictions.weather.raw
                  ? `Latest weather model: ${predictions.weather.summary}`
                  : 'Weather model has not published yet.'
              }`
            : 'Predictions will populate here automatically once the ML model publishes results to the backend prediction endpoints.'}
        </p>
      </div>
    </div>
  );
};
