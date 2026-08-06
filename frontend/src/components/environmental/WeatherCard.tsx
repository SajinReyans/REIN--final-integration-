import { Thermometer, Sun, Droplets, CloudSun, AlertTriangle } from 'lucide-react';
import { EnvPageShell, EnvCard, PageTitle, QuoteBox, StatusBadge } from './EnvPrimitives';
import { MiniWeatherMetric } from './MetricCard';
import { CircularProgress } from './CircularProgress';
import { STATUS_CONFIG, scoreToStatus } from '../../lib/env-status';

const WEATHER_SCORE = 82;

const METRICS = [
  {
    name: 'Temperature',
    value: '29.4',
    unit: '°C',
    trend: '+1.1° from yesterday morning',
    icon: Thermometer,
    status: 'good' as const,
    statusLabel: 'Comfortable',
    iconTint: 'blue' as const,
  },
  {
    name: 'Heat Index (Feels Like)',
    value: '31.2',
    unit: '°C',
    trend: 'Feels warmer due to humidity',
    icon: Sun,
    status: 'moderate' as const,
    statusLabel: 'Warm',
    iconTint: 'orange' as const,
  },
  {
    name: 'Dew Point',
    value: '18.5',
    unit: '°C',
    trend: 'Moderate moisture in the air',
    icon: Droplets,
    status: 'good' as const,
    statusLabel: 'Normal',
    iconTint: 'cyan' as const,
  },
];

export function WeatherCard() {
  const scoreStatus = STATUS_CONFIG[scoreToStatus(WEATHER_SCORE)];

  return (
    <EnvPageShell className="page-anim space-y-10">
      {/* Page header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <PageTitle eyebrow="Weather" title="Weather Today" accent="blue" />
        <QuoteBox accent="blue" className="lg:max-w-sm">
          Today&apos;s weather shapes your plans and your well-being.
          Stay informed with real-time conditions before stepping outside.
        </QuoteBox>
      </div>

      {/* ── Full-width horizontal health score card ── */}
      <EnvCard className="bg-[var(--env-hero-weather)] px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="w-full flex-1 text-center lg:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--blue)]">
              Weather Health Score
            </p>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--ink-soft)]">
              An overall environmental score calculated from temperature, humidity, heat index,
              UV exposure, wind conditions, precipitation, and active weather alerts.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <StatusBadge
                color={scoreStatus.color}
                bg={scoreStatus.bg}
                label={scoreStatus.label}
              />
              <span className="text-sm text-[var(--ink-soft)]">
                Partly Cloudy · 29.4°C · Comfortable
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <CircularProgress
              score={WEATHER_SCORE}
              layout="horizontal"
              label="Overall Score"
              size={130}
              strokeWidth={9}
              ariaLabel={`Weather health score ${WEATHER_SCORE} out of 100`}
            />
          </div>
        </div>
      </EnvCard>

      {/* ── Everything else below ── */}
      <section aria-labelledby="weather-conditions-heading">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="weather-conditions-heading"
              className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]"
            >
              Current Weather Conditions
            </h2>
            <p className="mt-2 text-[15px] text-[var(--ink-soft)]">
              Live readings from campus weather stations
            </p>
          </div>
          <span className="text-sm text-[var(--ink-faint)]">Updated just now</span>
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {METRICS.map((m) => (
            <MiniWeatherMetric key={m.name} {...m} />
          ))}
        </div>

        {/* Status + Alerts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EnvCard className="flex flex-col">
            <div className="flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.10)] text-[#3B82F6]"
                aria-hidden="true"
              >
                <CloudSun className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <StatusBadge color={scoreStatus.color} bg={scoreStatus.bg} label="Stable" />
            </div>
            <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
              Weather Status — Partly Cloudy
            </h3>
            <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              Light SW winds at 9 km/h. Humidity holding near 54%. No precipitation expected before evening.
            </p>
          </EnvCard>

          <EnvCard className="flex flex-col border-[var(--red-soft)] bg-[var(--red-soft)]/20">
            <div className="flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(239,68,68,0.12)] text-[#EF4444]"
                aria-hidden="true"
              >
                <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <StatusBadge
                color={STATUS_CONFIG.moderate.color}
                bg={STATUS_CONFIG.moderate.bg}
                label="1 Active"
              />
            </div>
            <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
              Weather Alerts
            </h3>
            <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              Heat advisory possible tomorrow
            </p>
          </EnvCard>
        </div>
      </section>
    </EnvPageShell>
  );
}
