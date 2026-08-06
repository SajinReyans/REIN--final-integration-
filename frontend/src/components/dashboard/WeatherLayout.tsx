import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { CheckCircle2, CloudSun, TriangleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScoreRing } from './ScoreRing';
import { fadeUp } from './DashboardSection';
import { STATUS_CONFIG, scoreToStatus } from '../../lib/env-status';
import type { WeatherMetric } from '../../hooks/useEnvironmentalData';

const CARD =
  'h-full w-full rounded-[20px] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.07)] border border-slate-100/90';

const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400';

const ICON_STYLES = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-[#007aff]' },
  cyan:   { bg: 'bg-cyan-50',   icon: 'text-cyan-500' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500' },
  green:  { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
};

const BAR_COLORS = {
  blue: 'bg-[#007aff]',
  cyan: 'bg-cyan-400',
  orange: 'bg-orange-400',
  amber: 'bg-amber-400',
  green: 'bg-emerald-400',
};

interface HealthScoreCardProps {
  score: number;
  description: string;
}

export function HealthScoreCard({ score, description }: HealthScoreCardProps) {
  const status = STATUS_CONFIG[scoreToStatus(score)];

  return (
    <motion.article
      variants={fadeUp}
      className={`${CARD} flex flex-col items-center px-4 py-5 text-center`}
      aria-label={`Weather health score ${score} out of 100`}
    >
      <p className={LABEL}>Weather Health Score</p>
      <div className="my-3">
        <ScoreRing score={score} size={140} strokeWidth={9} />
      </div>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: status.bg, color: status.color }}
      >
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        {status.label}
      </span>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{description}</p>
    </motion.article>
  );
}

interface MiniMetricCardProps {
  metric: WeatherMetric;
  barPct?: number;
}

export function MiniMetricCard({ metric, barPct = 65 }: MiniMetricCardProps) {
  const Icon = metric.icon;
  const style = ICON_STYLES[metric.iconTint];
  const bar = BAR_COLORS[metric.iconTint];
  const config = STATUS_CONFIG[metric.status];

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -2 }}
      className={`${CARD} flex flex-col p-4 transition-shadow duration-200 hover:shadow-[0_8px_28px_rgba(15,23,42,0.1)]`}
      aria-label={`${metric.name}: ${metric.value} ${metric.unit}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg}`} aria-hidden="true">
          <Icon className={`h-5 w-5 ${style.icon}`} strokeWidth={1.75} />
        </div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: config.color, background: config.bg }}>
          {metric.statusLabel}
        </span>
      </div>
      <p className={`mt-3 ${LABEL}`}>{metric.name}</p>
      <p className="mt-1 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
        {metric.value}
        {metric.unit && (
          <span className="ml-0.5 text-lg font-medium text-slate-500">{metric.unit}</span>
        )}
      </p>
      <div className="mt-auto pt-3">
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${barPct}%` }} />
        </div>
      </div>
    </motion.article>
  );
}

interface StatusCardProps {
  label: string;
  description: string;
  updated: string;
}

export function StatusCard({ label, description, updated }: StatusCardProps) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -2 }}
      className={`${CARD} relative flex flex-col overflow-hidden p-4 transition-shadow duration-200`}
      aria-label={`Weather status: ${label}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007aff]" aria-hidden="true">
          <CloudSun className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-400">
          Updated {updated}
        </span>
      </div>
      <p className={`mt-3 ${LABEL}`}>Status</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{label}</h3>
      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
      <CloudSun className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 text-blue-100 opacity-70" strokeWidth={1} aria-hidden="true" />
    </motion.article>
  );
}

interface AlertsCardProps {
  count: number;
  message: string;
}

export function AlertsCard({ count, message }: AlertsCardProps) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -2 }}
      className="flex h-full w-full flex-col rounded-[20px] border border-red-100 bg-red-50/90 p-4 shadow-[0_4px_20px_rgba(239,68,68,0.07)]"
      aria-label={`${count} weather alert${count !== 1 ? 's' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500" aria-hidden="true">
          <TriangleAlert className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-medium text-red-600">
          {count} Alert{count !== 1 ? 's' : ''}
        </span>
      </div>
      <p className={`mt-3 ${LABEL} !text-red-400`}>Alerts</p>
      <p className="mt-1 text-[13px] text-slate-500">Active campus advisories</p>
      <p className="mt-2 flex-1 text-[13px] font-medium text-red-600">{message}</p>
    </motion.article>
  );
}

interface ForecastDay {
  day: string;
  icon: LucideIcon;
  description: string;
  high: string;
  low: string;
  rain: string;
}

export function ForecastCard({ days }: { days: ForecastDay[] }) {
  return (
    <motion.article variants={fadeUp} className={`${CARD} flex flex-col p-4`} aria-label="Upcoming weather conditions">
      <p className={LABEL}>Upcoming Conditions</p>
      <ul className="mt-3 flex flex-1 flex-col justify-center space-y-3" role="list">
        {days.map((d) => {
          const Icon = d.icon;
          return (
            <li key={d.day} className="flex items-center gap-4" role="listitem">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50" aria-hidden="true">
                <Icon className="h-5 w-5 text-[#007aff]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{d.day}</p>
                <p className="text-xs text-slate-500">{d.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium tabular-nums text-slate-900">{d.high} / {d.low}</p>
                <p className="text-xs text-slate-400">{d.rain}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.article>
  );
}

export function CampusOverviewCard() {
  return (
    <motion.article
      variants={fadeUp}
      className="relative h-full min-h-[240px] w-full overflow-hidden rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.07)] sm:min-h-[280px] lg:min-h-[320px]"
      aria-label="Campus regional overview"
    >
      <img
        src="/campus-weather.png"
        alt="Campus weather station live view"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" aria-hidden="true" />
      <div className="relative flex h-full min-h-[240px] flex-col justify-end p-5 sm:min-h-[280px] lg:min-h-[320px] lg:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/80">Regional Overview</p>
        <p className="mt-1 text-lg font-medium text-white lg:text-xl">Campus Weather Station · Live View</p>
      </div>
    </motion.article>
  );
}

export function WeatherLightScope({ children }: { children: ReactNode }) {
  return (
    <div
      className="weather-light font-sans text-slate-900 antialiased"
      style={{ colorScheme: 'light', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {children}
    </div>
  );
}
