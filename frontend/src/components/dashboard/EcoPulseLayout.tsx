import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  Clock,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Sparkles,
  Sun,
  Thermometer,
  TriangleAlert,
  Wind,
} from 'lucide-react';
import { useEnvironmentalData } from '../../hooks/useEnvironmentalData';
import type { ForecastDay, GasReading, ParticulateReading } from '../../hooks/useEnvironmentalData';
import { cn } from '../../lib/utils';
import { LiveBadge } from './DashboardSection';
import { ScoreRing } from './ScoreRing';
import { NoiseLevelBar } from './MetricCard';
/* EcoPulse Pro tokens — theme-aware (solid white cards over campus photo) */
const EP_CARD =
  'rounded-[14px] border border-[#e8edf5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.08)] dark:border-[var(--border)] dark:bg-[var(--surface)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]';
/* Weather + Air professional spacing (inline styles — immune to CSS resets) */
const EP_PAD_STYLE = { padding: 20 } as const;
const PAGE_INSET = { padding: '32px 36px 48px' } as const;
const SECTION_GAP = 'gap-5';
const GRID_GAP = 'gap-4';

const ICON_STYLES = {
  blue: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', icon: 'text-emerald-600 dark:text-emerald-400' },
  cyan: { bg: 'bg-teal-50 dark:bg-teal-950/50', icon: 'text-teal-600 dark:text-teal-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/40', icon: 'text-orange-500 dark:text-orange-400' },
  red: { bg: 'bg-red-50 dark:bg-red-950/40', icon: 'text-red-500 dark:text-red-400' },
};

/* Soft campus photo under light frost — matches light-theme weather reference */
const WEATHER_PAGE_BG = {
  backgroundColor: 'var(--weather-page-bg-color)',
  backgroundImage: 'var(--weather-page-bg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

const AIR_PAGE_BG = {
  backgroundColor: 'var(--air-page-bg-color)',
  backgroundImage: 'var(--air-page-bg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

// HUMIDITY_BARS removed — live humidity readings come from the useEnvironmentalData() history buffer.

function AreaStatChart({ color, data }: { color: string; data?: number[] }) {
  const rawValues = data && data.length > 0 ? data : [42, 38, 55, 72, 48, 35, 52];
  const values = rawValues.length === 1 ? [rawValues[0], rawValues[0]] : rawValues;
  const w = 240;
  const h = 72;
  const padX = 8;
  const padY = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const divisor = Math.max(values.length - 1, 1);
  const points = values.map((v, i) => {
    const x = padX + (i / divisor) * (w - padX * 2);
    const y = padY + (1 - (v - min) / range) * (h - padY * 2);
    return { x: Number.isFinite(x) ? x : padX, y: Number.isFinite(y) ? y : h / 2 };
  });

  if (points.length === 0) return null;

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    })
    .join(' ');

  const areaPath = `${linePath} L ${lastPoint.x},${h - 2} L ${firstPoint.x},${h - 2} Z`;
  const gridYs = [0.2, 0.45, 0.7].map((t) => padY + t * (h - padY * 2));
  const fillId = `area-fill-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[72px] w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {gridYs.map((y) => (
        <line
          key={y}
          x1={padX}
          y1={y}
          x2={w - padX}
          y2={y}
          className="stroke-[#e2e8f0] dark:stroke-[#2a2a2a]"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WeatherHealthBanner({ score, description }: { score: number; description: string }) {
  return (
    <article
      className={cn(EP_CARD, 'relative flex shrink-0 items-center gap-4 sm:gap-5')}
      style={EP_PAD_STYLE}
      aria-label={`Weather health score ${score}`}
    >
      <div className="relative z-10 shrink-0">
        <ScoreRing
          score={score}
          size={92}
          strokeWidth={9}
          ringColor="var(--green)"
          trackColor="var(--green-soft)"
        />
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 pr-2">
          <h2 className="text-[1.15rem] font-bold tracking-tight text-[var(--ink)]">Weather Health Score</h2>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            Optimal Zone
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-soft)]">{description}</p>
      </div>
      <Sun
        className="pointer-events-none absolute right-4 top-1/2 h-24 w-24 -translate-y-1/2 text-amber-200/35 dark:text-amber-400/20"
        strokeWidth={1}
        aria-hidden="true"
      />
    </article>
  );
}

interface WeatherMetricCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  iconTint: keyof typeof ICON_STYLES;
  sparkColor: string;
  chartData?: number[];
}

function WeatherMetricTile({
  label,
  value,
  unit,
  icon: Icon,
  iconTint,
  sparkColor,
  chartData,
}: WeatherMetricCardProps) {
  const style = ICON_STYLES[iconTint];

  return (
    <article className={cn(EP_CARD, 'flex aspect-square min-h-0 flex-col')} style={EP_PAD_STYLE} aria-label={`${label}: ${value}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.bg}`} aria-hidden="true">
        <Icon className={`h-4 w-4 ${style.icon}`} strokeWidth={1.75} />
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">{label}</p>
      <p className="mt-1 break-words text-[1.65rem] font-bold leading-none tracking-tight text-[var(--ink)]">
        {value}
        {unit && <span className="ml-0.5 text-sm font-semibold text-[var(--ink)]">{unit}</span>}
      </p>
      <div className="mt-auto min-w-0 pt-3">
        <AreaStatChart color={sparkColor} data={chartData} />
      </div>
    </article>
  );
}

export function HeatAdvisoryTile({ count, message }: { count: number; message: string }) {
  return (
    <article
      className={cn(
        'flex aspect-square min-h-0 flex-col rounded-[14px] border border-red-200 bg-red-50 shadow-[0_2px_12px_rgba(239,68,68,0.08)] dark:border-red-900/60 dark:bg-red-950/50',
      )}
      style={EP_PAD_STYLE}
      aria-label="Heat advisory alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-950/80 dark:text-red-400" aria-hidden="true">
          <TriangleAlert className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-950 dark:text-red-400">
          Active
        </span>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-red-400">Alerts</p>
      <p className="mt-1 text-[1.35rem] font-bold leading-none tracking-tight text-red-600 dark:text-red-400">
        {count} Active
      </p>
      <p className="mt-2 line-clamp-3 text-[11px] leading-snug text-[var(--ink-soft)]">{message}</p>
    </article>
  );
}

function SectionMeta({ updated, dark = false }: { updated: string; dark?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className={cn('inline-flex items-center gap-1.5 text-sm', dark ? 'text-white/80' : 'text-[var(--ink-soft)]')}>
        <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        Updated {updated}
      </span>
      <LiveBadge />
    </div>
  );
}

function ForecastIcon({ condition }: { condition: ForecastDay['condition'] }) {
  if (condition === 'sunny') return <Sun className="h-6 w-6 text-amber-400" strokeWidth={1.6} aria-hidden="true" />;
  if (condition === 'rain') return <CloudRain className="h-6 w-6 text-teal-400" strokeWidth={1.6} aria-hidden="true" />;
  return <CloudSun className="h-6 w-6 text-[var(--ink-faint)]" strokeWidth={1.6} aria-hidden="true" />;
}

function SevenDayOutlook({ days, metric, onUnit }: { days: ForecastDay[]; metric: boolean; onUnit: (m: boolean) => void }) {
  const display = (c: number) => (metric ? c : Math.round(c * 1.8 + 32));

  return (
    <section className={cn(EP_CARD, 'shrink-0')} style={EP_PAD_STYLE} aria-label="7-day atmospheric outlook">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-bold text-[var(--ink)]">7-Day Atmospheric Outlook</h3>
        <div className="inline-flex shrink-0 rounded-lg bg-[var(--surface-alt)] p-0.5" role="group" aria-label="Temperature unit">
          <button
            type="button"
            onClick={() => onUnit(false)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[10px] font-semibold transition',
              !metric ? 'bg-[var(--ink)] text-[var(--surface)] shadow-sm' : 'text-[var(--ink-soft)]',
            )}
          >
            Imperial
          </button>
          <button
            type="button"
            onClick={() => onUnit(true)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[10px] font-semibold transition',
              metric ? 'bg-[var(--ink)] text-[var(--surface)] shadow-sm' : 'text-[var(--ink-soft)]',
            )}
          >
            Metric
          </button>
        </div>
      </div>
      <div className={cn('mt-3 grid grid-cols-7', GRID_GAP)}>
        {days.map((d, i) => (
          <div
            key={`${d.day}-${i}`}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1 overflow-hidden rounded-xl p-3',
              i === 0
                ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800'
                : 'bg-[var(--surface-alt)]',
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{d.day}</span>
            <ForecastIcon condition={d.condition} />
            <span className="text-sm font-bold text-[var(--ink)]">{display(d.high)}°</span>
            <span className="text-[11px] text-[var(--ink-faint)]">{display(d.low)}°</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HumidityTrendsCard({ humidityHistory }: { humidityHistory: number[] }) {
  const bars = humidityHistory.length > 0
    ? humidityHistory.map((h, i) => ({ label: `T-${humidityHistory.length - 1 - i}`, h: Math.round(h) }))
    : Array(7).fill({ label: '—', h: 0 });
  const peak = Math.max(...bars.map((b) => b.h), 1);

  return (
    <article className={cn(EP_CARD, 'flex min-h-[160px] flex-col')} style={EP_PAD_STYLE} aria-label="Humidity and precipitation trends">
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-bold text-[var(--ink)]">Humidity & Precipitation Trends</h3>
        <Cloud className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="mt-3 flex min-h-0 flex-1 items-end gap-1.5 sm:gap-2">
        {bars.map((b, i) => {
          const active = b.h === peak && b.h > 0;
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex h-20 w-full items-end justify-center sm:h-24">
                <div
                  className={cn(
                    'w-[70%] max-w-[28px] rounded-t-md',
                    active ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600',
                  )}
                  style={{ height: `${b.h > 0 ? (b.h / 100) * 100 : 3}%` }}
                />
              </div>
              <span className="text-[9px] font-medium text-[var(--ink-faint)]">{b.h > 0 ? `${b.h}%` : '—'}</span>
            </div>
          );
        })}
      </div>
      {humidityHistory.length === 0 && (
        <p className="mt-2 text-center text-[11px] text-[var(--ink-faint)]">Waiting for humidity readings…</p>
      )}
    </article>
  );
}

function AIProjectionCard({ prediction }: { prediction?: { text: string; confidence: number } | null }) {
  return (
    <article className={cn(EP_CARD, 'flex flex-col')} style={EP_PAD_STYLE} aria-label="AI projection">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" aria-hidden="true">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[var(--ink)]">AI Projection</h3>
          <p className="mt-1 text-[12px] leading-snug text-[var(--ink-soft)]">
            {prediction?.text ?? 'ML predictions will appear here once the model publishes to /api/weather/predictions/latest.'}
          </p>
        </div>
      </div>
      {prediction && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold">
            <span className="text-[var(--ink-faint)]">Confidence Interval</span>
            <span className="shrink-0 text-emerald-600 dark:text-emerald-400">{(prediction.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-alt)]">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(prediction.confidence * 100).toFixed(0)}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}

function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function WindVectorCard({ speedMs, directionDeg }: { speedMs: number; directionDeg: number }) {
  const compass = degreesToCompass(directionDeg);
  const kmh = (speedMs * 3.6).toFixed(1);
  const label = speedMs > 0 ? `${compass} ${kmh} km/h` : 'Connecting…';
  return (
    <article className={cn(EP_CARD, 'flex items-center gap-3')} style={EP_PAD_STYLE} aria-label="Wind vector">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400" aria-hidden="true">
        <Wind className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">Wind Vector</p>
        <p className="mt-0.5 text-base font-bold text-[var(--ink)]">{label}</p>
      </div>
    </article>
  );
}

/* ── Weather page ── */

export function WeatherPageLayout() {
  const { weather, lastUpdated, history } = useEnvironmentalData();
  const [metric, setMetric] = useState(true);
  const [weatherPrediction, setWeatherPrediction] = useState<{ text: string; confidence: number } | null>(null);

  // Fetch the latest ML weather prediction from the backend
  useEffect(() => {
    const base = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';
    fetch(`${base}/api/weather/predictions/latest`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: any) => {
        if (p?.predicted_temperature != null) {
          setWeatherPrediction({
            text: `Predicted ${Number(p.predicted_temperature).toFixed(1)} °C · ${p.predicted_weather_status ?? ''}`.trim().replace(/·\s*$/, ''),
            confidence: Number(p.confidence_score ?? 0),
          });
        }
      })
      .catch(() => null);
  }, []);

  const temp = weather.metrics.find((m) => m.id === 'temp');
  const skyMetric = weather.metrics.find((m) => m.id === 'sky');

  // Parse live wind speed + direction
  let windSpeedMs = weather.details?.windSpeed ?? 0;
  let windDirDeg = weather.details?.windDirection ?? 0;
  if (!windSpeedMs && skyMetric?.supportingText) {
    const wm = skyMetric.supportingText.match(/Wind ([\d.]+) m\/s.*Dir ([\d.]+)°/);
    if (wm) { windSpeedMs = parseFloat(wm[1]); windDirDeg = parseFloat(wm[2]); }
  }

  const tempVal = weather.details?.temperature != null && weather.details.temperature !== 0 ? weather.details.temperature.toFixed(1) : String(temp?.value ?? '--');
  const humVal = weather.details?.humidity != null && weather.details.humidity !== 0 ? weather.details.humidity.toFixed(0) : '--';
  const rainVal = weather.details?.rainfall != null ? weather.details.rainfall.toFixed(1) : '0.0';

  const quoteLine = weather.quote ? `"${weather.quote[0]}" "${weather.quote[1]}"` : '"Today\'s weather shapes your plans and well-being."';

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
          ...WEATHER_PAGE_BG,
        }}
      />

      <div
        className="relative z-10 h-full overflow-y-auto font-[family-name:var(--font-weather)] antialiased"
        style={{ color: 'var(--ink)' }}
      >
        <div className={cn('flex min-h-full flex-col', SECTION_GAP)} style={PAGE_INSET}>
          {/* Title + quote — always first, always visible */}
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0, flex: '1 1 280px' }}>
              <h1
                style={{
                  margin: 0,
                  color: '#2563eb',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                }}
              >
                Today&apos;s Weather
              </h1>
              <p
                style={{
                  margin: '10px 0 0',
                  maxWidth: 720,
                  color: '#64748b',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 15,
                  fontStyle: 'italic',
                  lineHeight: 1.55,
                }}
              >
                {quoteLine}
              </p>
            </div>
            <SectionMeta updated={lastUpdated} />
          </div>

          <WeatherHealthBanner score={weather.score} description={weather.healthDescription} />

          {/* Primary Weather Parameters Grid: Temperature, Humidity, Rainfall, Wind Speed, Wind Direction */}
          <div className={cn('grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5', GRID_GAP)}>
            <WeatherMetricTile
              label="Temperature"
              value={tempVal}
              unit="°C"
              icon={Thermometer}
              iconTint="blue"
              sparkColor="#10b981"
              chartData={history.temperature}
            />
            <WeatherMetricTile
              label="Humidity"
              value={humVal}
              unit="%"
              icon={Droplets}
              iconTint="cyan"
              sparkColor="#14b8a6"
              chartData={history.humidity}
            />
            <WeatherMetricTile
              label="Rainfall"
              value={rainVal}
              unit="mm"
              icon={CloudRain}
              iconTint="orange"
              sparkColor="#f59e0b"
              chartData={[0, 0, Number(rainVal)]}
            />
            <WeatherMetricTile
              label="Wind Speed"
              value={windSpeedMs.toFixed(1)}
              unit="m/s"
              icon={Wind}
              iconTint="cyan"
              sparkColor="#10b981"
              chartData={[0, windSpeedMs]}
            />
            <WeatherMetricTile
              label="Wind Direction"
              value={`${windDirDeg.toFixed(0)}°`}
              unit={degreesToCompass(windDirDeg)}
              icon={Wind}
              iconTint="orange"
              sparkColor="#f97316"
              chartData={[windDirDeg]}
            />
          </div>

          <SevenDayOutlook days={weather.forecast} metric={metric} onUnit={setMetric} />

          <div className={cn('grid grid-cols-1 pb-2 lg:grid-cols-[1.55fr_1fr]', GRID_GAP)}>
            <HumidityTrendsCard humidityHistory={history.humidity} />
            <div className={cn('flex flex-col', GRID_GAP)}>
              <AIProjectionCard prediction={weatherPrediction} />
              <WindVectorCard speedMs={windSpeedMs} directionDeg={windDirDeg} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Air page helpers ── */

const AIR_STATUS_COLOR: Record<string, string> = {
  excellent: '#22c55e',
  good: '#3b82f6',
  moderate: '#f59e0b',
  poor: '#f97316',
  hazardous: '#ef4444',
};

const AIR_STATUS_COLOR_DARK: Record<string, string> = {
  excellent: '#34d399',
  good: '#60a5fa',
  moderate: '#fbbf24',
  poor: '#fb923c',
  hazardous: '#f87171',
};

function airStatusColor(status: string, dark = false) {
  const map = dark ? AIR_STATUS_COLOR_DARK : AIR_STATUS_COLOR;
  return map[status] ?? (dark ? '#a3a3a3' : '#94a3b8');
}

function useIsDark() {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

function AirSparkIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
      <path
        d="M1 8.5 C3 8.5 3.5 2 5.5 2 C7.5 2 8 10 10 10 C12 10 12.5 4 14.5 4 C16 4 16.5 7 17 8"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AirSectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span className="mt-[3px] h-[18px] w-[3px] shrink-0 rounded-full bg-[#7c5cbf] dark:bg-emerald-400" aria-hidden="true" />
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">{title}</h2>
        <p className="mt-0.5 text-[12px] text-[var(--ink-faint)]">{subtitle}</p>
      </div>
    </div>
  );
}

function PMCard({ pm }: { pm: ParticulateReading }) {
  const dark = useIsDark();
  const color = airStatusColor(pm.status, dark);

  return (
    <article
      className="relative flex min-h-[140px] flex-col overflow-hidden rounded-[14px] bg-white dark:bg-[var(--surface)]"
      style={{ padding: '20px 20px 24px' }}
      aria-label={`${pm.name}: ${pm.value} ${pm.unit}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide text-neutral-700 dark:text-[var(--ink-faint)]">{pm.name}</p>
        <AirSparkIcon color={color} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-2 text-center">
        <p className="text-[2rem] font-bold leading-none tracking-tight tabular-nums text-black dark:text-[var(--ink)]">
          {pm.value}
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-neutral-800 dark:text-[var(--ink-faint)]">{pm.unit}</p>
      </div>
      <div className="flex items-center justify-center gap-1.5 pb-1">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
        <span className="text-[12px] font-semibold" style={{ color }}>
          {pm.statusLabel}
        </span>
      </div>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: color }}
        aria-hidden="true"
      />
    </article>
  );
}

function GasCard({ gas }: { gas: GasReading }) {
  const dark = useIsDark();
  const color = airStatusColor(gas.status, dark);

  return (
    <article
      className="relative flex min-h-[128px] flex-col overflow-hidden rounded-[14px] bg-white dark:bg-[var(--surface)]"
      style={{ padding: '20px 20px 24px' }}
      aria-label={`${gas.symbol}: ${gas.value} ${gas.unit}`}
    >
      <p className="text-center text-[12px] font-semibold text-neutral-800 dark:text-[var(--ink-soft)]">{gas.symbol}</p>
      <div className="flex flex-1 flex-col items-center justify-center py-1.5 text-center">
        <p className="text-[1.55rem] font-bold leading-none tracking-tight tabular-nums text-black dark:text-[var(--ink)]">
          {gas.value}
        </p>
        <p className="mt-1 text-[10px] font-medium text-neutral-800 dark:text-[var(--ink-faint)]">{gas.unit}</p>
      </div>
      <div className="flex items-center justify-center gap-1.5 pb-1">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
        <span className="text-[11px] font-semibold" style={{ color }}>
          {gas.statusLabel}
        </span>
      </div>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: color }}
        aria-hidden="true"
      />
    </article>
  );
}

const AIR_LEGEND: { label: string; color: string; darkColor: string }[] = [
  { label: 'Excellent', color: '#22c55e', darkColor: '#34d399' },
  { label: 'Good', color: '#3b82f6', darkColor: '#60a5fa' },
  { label: 'Moderate', color: '#f59e0b', darkColor: '#fbbf24' },
  { label: 'Poor', color: '#f97316', darkColor: '#fb923c' },
  { label: 'Unhealthy', color: '#ef4444', darkColor: '#f87171' },
  { label: 'Hazardous', color: '#991b1b', darkColor: '#f87171' },
];

function AirHealthScoreCard({ score, healthDescription, category }: { score: number; healthDescription: string; category: string }) {
  const dark = useIsDark();

  return (
    <article
      className={cn(EP_CARD, 'flex flex-col items-center rounded-[16px] text-center')}
      style={EP_PAD_STYLE}
      aria-label={`Air health score ${score}`}
    >
      <p className="w-full text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        Air Health Score
      </p>
      <div className="mt-5">
        <ScoreRing
          score={score}
          size={148}
          strokeWidth={12}
          ariaLabel={`Air health score ${score}`}
          ringColor={dark ? '#34d399' : '#2563eb'}
          trackColor={dark ? '#2a2a2a' : '#e2e8f0'}
        />
      </div>
      <p className={cn('mt-4 text-[1.35rem] font-bold', dark ? 'text-emerald-400' : 'text-[#2563eb]')}>
        {category || 'Live'}
      </p>
      <p className="mt-1 max-w-[240px] text-[12px] leading-snug text-[var(--ink-soft)]">{healthDescription}</p>
      <button
        type="button"
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:from-teal-600 hover:to-emerald-600"
      >
        View Safety Recommendations
      </button>
    </article>
  );
}

function AboutAirCard({ aboutDescription }: { aboutDescription: string }) {
  const dark = useIsDark();

  return (
    <article className={cn(EP_CARD, 'rounded-[16px]')} style={EP_PAD_STYLE} aria-label="About air quality">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">About Air Quality</p>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--ink-soft)]">{aboutDescription}</p>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5" role="list">
        {AIR_LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[12px] text-[var(--ink-soft)]" role="listitem">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: dark ? item.darkColor : item.color }}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ── Air page ── */

export function AirPageLayout() {
  const { air, lastUpdated } = useEnvironmentalData();
  const quoteLine = `${air.quote[0]} ${air.quote[1]}`;

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
          ...AIR_PAGE_BG,
        }}
      />

      <div className="relative z-10 h-full overflow-y-auto font-[family-name:var(--font-weather)] text-[var(--ink)] antialiased">
        <div className={cn('mx-auto flex max-w-[1440px] flex-col', SECTION_GAP)} style={PAGE_INSET}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-[1.75rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white lg:text-[1.85rem]">
                Air Conditions
              </h1>
              <p
                className="mt-2.5 max-w-xl text-[15px] italic leading-relaxed text-[var(--ink-soft)]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {quoteLine}
              </p>
            </div>
            <SectionMeta updated={lastUpdated} />
          </div>

          <div className={cn('grid grid-cols-1 lg:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.85fr)]', GRID_GAP)}>
            <div className={cn('flex min-w-0 flex-col', SECTION_GAP)}>
              <section aria-label="Particulate matter" className="min-w-0">
                <AirSectionTitle
                  title="Particulate Matter"
                  subtitle="Campus-wide sensor network results."
                />
                <div className={cn('grid grid-cols-2 sm:grid-cols-4', GRID_GAP)}>
                  {air.particulates.map((pm) => (
                    <PMCard key={pm.id} pm={pm} />
                  ))}
                </div>
              </section>

              <section aria-label="Atmospheric gases" className="min-w-0">
                <AirSectionTitle
                  title="Atmospheric Gases"
                  subtitle="Gas concentrations across monitored zones."
                />
                <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5', GRID_GAP)}>
                  {air.gases.map((gas) => (
                    <GasCard key={gas.id} gas={gas} />
                  ))}
                </div>
              </section>
              {air.floors && air.floors.length > 0 && (
                <section aria-label="Floor comparison" className="min-w-0">
                  <AirSectionTitle
                    title="Per-Floor Comparison"
                    subtitle="Multi-level building environment sensors (Bottom vs Top Floor)."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {air.floors.map((fl) => (
                      <article key={fl.floorLevel} className={cn(EP_CARD, 'rounded-[16px] p-5')}>
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-3">
                          <h3 className="text-base font-bold capitalize text-[#1e3a5f] dark:text-white">
                            {fl.floorLevel} Floor
                          </h3>
                          <span className="text-[11px] font-mono text-[var(--ink-faint)]">
                            {fl.timestamp ? new Date(fl.timestamp).toLocaleTimeString() : 'Live'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-2 rounded-lg bg-[var(--surface-alt)]">
                            <span className="block text-[10px] uppercase font-bold text-[var(--ink-faint)]">PM2.5</span>
                            <span className="text-lg font-bold text-[var(--ink)] tabular-nums">{fl.pm25}</span>
                            <span className="block text-[9px] text-[var(--ink-faint)]">µg/m³</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--surface-alt)]">
                            <span className="block text-[10px] uppercase font-bold text-[var(--ink-faint)]">PM10</span>
                            <span className="text-lg font-bold text-[var(--ink)] tabular-nums">{fl.pm10}</span>
                            <span className="block text-[9px] text-[var(--ink-faint)]">µg/m³</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--surface-alt)]">
                            <span className="block text-[10px] uppercase font-bold text-[var(--ink-faint)]">CO₂</span>
                            <span className="text-lg font-bold text-[var(--ink)] tabular-nums">{fl.co2}</span>
                            <span className="block text-[9px] text-[var(--ink-faint)]">ppm</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--surface-alt)]">
                            <span className="block text-[10px] uppercase font-bold text-[var(--ink-faint)]">NOx</span>
                            <span className="text-lg font-bold text-[var(--ink)] tabular-nums">{fl.nox}</span>
                            <span className="block text-[9px] text-[var(--ink-faint)]">ppb</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--surface-alt)]">
                            <span className="block text-[10px] uppercase font-bold text-[var(--ink-faint)]">VOC</span>
                            <span className="text-lg font-bold text-[var(--ink)] tabular-nums">{fl.voc}</span>
                            <span className="block text-[9px] text-[var(--ink-faint)]">idx</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--surface-alt)]">
                            <span className="block text-[10px] uppercase font-bold text-[var(--ink-faint)]">CO</span>
                            <span className="text-lg font-bold text-[var(--ink)] tabular-nums">{fl.co}</span>
                            <span className="block text-[9px] text-[var(--ink-faint)]">ppm</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className={cn('flex min-w-0 flex-col', GRID_GAP)}>
              <AirHealthScoreCard
                score={air.score}
                healthDescription={air.healthDescription}
                category={air.healthDescription.split(' · ')[0] || 'Live'}
              />
              <AboutAirCard aboutDescription={air.aboutDescription} />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Noise page ── */

const NOISE_PAGE_BG = {
  backgroundColor: 'var(--noise-page-bg-color)',
  backgroundImage: 'var(--noise-page-bg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

const NOISE_INSET = { padding: '24px 28px 28px' } as const;
const NOISE_PAD = { padding: 18 } as const;
const NOISE_GAP = 'gap-3.5';

const NOISE_CATEGORIES: {
  id: 'low' | 'moderate' | 'high';
  label: string;
  range: string;
  color: string;
  darkColor: string;
}[] = [
    { id: 'low', label: 'Low', range: '< 55 dB(A)', color: '#22c55e', darkColor: '#34d399' },
    { id: 'moderate', label: 'Moderate', range: '55–70 dB(A)', color: '#f59e0b', darkColor: '#fbbf24' },
    { id: 'high', label: 'High', range: '> 70 dB(A)', color: '#ef4444', darkColor: '#f87171' },
  ];

function NoiseLevelCard({
  level,
  unit,
  category,
}: {
  level: number;
  unit: string;
  category: string;
}) {
  return (
    <article
      className={cn(EP_CARD, 'flex h-full flex-col rounded-[16px]')}
      style={NOISE_PAD}
      aria-label={`Noise level ${level} ${unit}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            Noise Level (dB)
          </p>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[3.25rem] font-bold leading-none tracking-tight tabular-nums text-[#1e3a5f] dark:text-white lg:text-[3.5rem]">
              {level}
            </span>
            <span className="text-[15px] font-medium text-[var(--ink-faint)]">{unit}</span>
          </div>
        </div>
        <LiveBadge />
      </div>
      <div className="mt-5 max-w-lg">
        <NoiseLevelBar level={level} />
      </div>
      <p className="mt-2.5 text-[13px] text-[var(--ink-soft)]">
        {category} — within campus comfort range
      </p>
    </article>
  );
}

function NoiseStatusCard({ label, detail }: { label: string; detail: string }) {
  return (
    <article
      className={cn(EP_CARD, 'flex h-full flex-col rounded-[16px]')}
      style={NOISE_PAD}
      aria-label="Current noise status"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        Current Noise Status
      </p>
      <div className="mt-3.5 flex flex-1 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[15px] font-bold leading-snug text-[var(--ink)]">{label}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function NoiseCategoryCard({ activeTier }: { activeTier: 'low' | 'moderate' | 'high' }) {
  const dark = useIsDark();

  return (
    <article
      className={cn(EP_CARD, 'flex h-full flex-col rounded-[16px]')}
      style={NOISE_PAD}
      aria-label="Noise category"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        Noise Category
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--ink-faint)]">Low / Moderate / High</p>
      <div className="mt-3 grid flex-1 grid-cols-3 gap-2.5">
        {NOISE_CATEGORIES.map((cat) => {
          const active = cat.id === activeTier;
          const color = dark ? cat.darkColor : cat.color;
          return (
            <div
              key={cat.id}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border px-1.5 py-3 text-center',
                active ? 'shadow-sm' : 'opacity-80',
              )}
              style={{
                background: `${color}${active ? '22' : '12'}`,
                borderColor: active ? `${color}66` : `${color}33`,
              }}
              aria-current={active ? 'true' : undefined}
            >
              <span
                className="mb-2 block h-2.5 w-2.5 rounded-full"
                style={{ background: color }}
                aria-hidden="true"
              />
              <p className="text-[13px] font-bold text-[var(--ink)]">{cat.label}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-[var(--ink-faint)]">{cat.range}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function NoiseHealthScoreCard({ score, subtitle, category }: { score: number; subtitle: string; category: string }) {
  const dark = useIsDark();

  return (
    <article
      className={cn(EP_CARD, 'flex h-full flex-col items-center rounded-[16px] text-center')}
      style={NOISE_PAD}
      aria-label={`Noise health score ${score}`}
    >
      <p className="w-full text-left text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        Noise Health Score
      </p>
      <div className="my-auto flex flex-col items-center py-3">
        <ScoreRing
          score={score}
          size={132}
          strokeWidth={11}
          ariaLabel={`Noise health score ${score}`}
          ringColor={dark ? '#34d399' : '#2563eb'}
          trackColor={dark ? '#2a2a2a' : '#e2e8f0'}
        />
        <p className={cn('mt-3 text-[1.25rem] font-bold', dark ? 'text-emerald-400' : 'text-[#2563eb]')}>
          {category || 'Live'}
        </p>
        <p className="mt-1 max-w-[200px] text-[12px] leading-snug text-[var(--ink-soft)]">{subtitle}</p>
      </div>
    </article>
  );
}

function NoiseAlertsCard({
  alerts,
}: {
  alerts: { id: string; title: string; detail: string; ok: boolean }[];
}) {
  return (
    <article
      className={cn(EP_CARD, 'flex h-full flex-col rounded-[16px]')}
      style={NOISE_PAD}
      aria-label="Noise alerts"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        Noise Alerts
      </p>
      <ul className="mt-3 flex flex-1 flex-col gap-2.5" role="list">
        {alerts.map((a) => (
          <li
            key={a.id}
            role="listitem"
            className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-3.5 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30"
          >
            <span
              className={cn(
                'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                a.ok ? 'bg-emerald-500' : 'bg-red-500',
              )}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{a.title}</p>
              <p className="mt-0.5 text-[12.5px] text-[var(--ink-soft)]">{a.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function NoiseAboutCard({
  description,
  stats,
}: {
  description: string;
  stats: { label: string; value: string }[];
}) {
  return (
    <article
      className={cn(EP_CARD, 'flex h-full flex-col rounded-[16px]')}
      style={NOISE_PAD}
      aria-label="About noise monitoring"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        About Noise Monitoring
      </p>
      <div className="mt-3 flex flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">{description}</p>
        <ul className="w-full shrink-0 space-y-2 lg:w-[220px]" role="list">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0 last:pb-0"
              role="listitem"
            >
              <span className="text-[12.5px] text-[var(--ink-soft)]">{stat.label}</span>
              <span className="text-[12.5px] font-semibold tabular-nums text-[var(--ink)]">{stat.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function NoisePageLayout() {
  const { noise, lastUpdated } = useEnvironmentalData();

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
          ...NOISE_PAGE_BG,
        }}
      />

      <div className="relative z-10 h-full overflow-y-auto font-[family-name:var(--font-weather)] text-[var(--ink)] antialiased">
        <div
          className={cn('mx-auto flex min-h-full max-w-[1440px] flex-col', NOISE_GAP)}
          style={NOISE_INSET}
        >
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-[1.65rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white lg:text-[1.75rem]">
                Noise Monitoring
              </h1>
              <p
                className="mt-1.5 max-w-xl text-[14px] italic leading-relaxed text-[var(--ink-soft)]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {noise.quote}
              </p>
            </div>
            <SectionMeta updated={lastUpdated} />
          </div>

          {/* Reference layout: left stack + right score/alerts */}
          <div
            className={cn(
              'grid min-h-0 flex-1 grid-cols-1 content-start',
              'lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]',
              NOISE_GAP,
            )}
          >
            <div className={cn('flex min-w-0 flex-col', NOISE_GAP)}>
              <NoiseLevelCard level={noise.level} unit={noise.unit} category={noise.category} />
              <div className={cn('grid grid-cols-1 sm:grid-cols-2', NOISE_GAP)}>
                <NoiseStatusCard label={noise.statusLabel} detail={noise.statusDetail} />
                <NoiseCategoryCard activeTier={noise.categoryTier} />
              </div>
              <NoiseAboutCard description={noise.aboutDescription} stats={noise.stats} />
            </div>

            <aside className={cn('flex min-w-0 flex-col', NOISE_GAP)}>
              <NoiseHealthScoreCard score={noise.score} subtitle={noise.scoreSubtitle} category={noise.category} />
              <div className="min-h-0 flex-1">
                <NoiseAlertsCard alerts={noise.alerts} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
