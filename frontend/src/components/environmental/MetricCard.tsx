import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type EnvStatus, STATUS_CONFIG } from '../../lib/env-status';
import { StatusBadge } from './EnvPrimitives';

export const ICON_TINTS = {
  blue:   { bg: 'rgba(59,130,246,0.10)',  color: '#3B82F6' },
  cyan:   { bg: 'rgba(6,182,212,0.10)',   color: '#06B6D4' },
  orange: { bg: 'rgba(249,115,22,0.10)',  color: '#F97316' },
  amber:  { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
  green:  { bg: 'rgba(16,185,129,0.10)',  color: '#10B981' },
  purple: { bg: 'rgba(124,58,237,0.10)',  color: '#7C3AED' },
  red:    { bg: 'rgba(239,68,68,0.10)',    color: '#EF4444' },
} as const;

export type IconTint = keyof typeof ICON_TINTS;

/* ── Small square weather metric (reference top row) ── */
export interface MiniWeatherMetricProps {
  name: string;
  value: string | number;
  unit: string;
  trend: string;
  icon: LucideIcon;
  statusLabel: string;
  status: EnvStatus;
  iconTint?: IconTint;
}

export function MiniWeatherMetric({
  name,
  value,
  unit,
  trend,
  icon: Icon,
  statusLabel,
  status,
  iconTint = 'blue',
}: MiniWeatherMetricProps) {
  const config = STATUS_CONFIG[status];
  const tint = ICON_TINTS[iconTint];

  return (
    <article
      className="flex flex-col rounded-[20px] bg-[var(--env-card)] p-6 shadow-[var(--env-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--env-shadow-hover)] sm:p-7"
      aria-label={`${name}: ${value} ${unit}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: tint.bg, color: tint.color }}
          aria-hidden="true"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <StatusBadge color={config.color} bg={config.bg} label={statusLabel} />
      </div>
      <p className="mt-4 text-[13px] font-medium text-[var(--ink-soft)]">{name}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-[28px] font-bold tabular-nums text-[var(--ink)]">
          {value}
        </span>
        <span className="text-sm text-[var(--ink-faint)]">{unit}</span>
      </div>
      <p className="mt-2 text-xs text-[var(--ink-faint)]">{trend}</p>
    </article>
  );
}

/* ── PM tile with bottom color bar ── */
export interface PMTileProps {
  name: string;
  value: number;
  unit: string;
  status: EnvStatus;
  statusLabel: string;
}

export function PMTile({ name, value, unit, status, statusLabel }: PMTileProps) {
  const config = STATUS_CONFIG[status];

  return (
    <article
      className="overflow-hidden rounded-[16px] bg-[var(--env-surface-muted)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--env-shadow-hover)]"
      aria-label={`${name}: ${value} ${unit}, ${statusLabel}`}
    >
      <div className="px-4 pb-3 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{name}</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-[var(--ink)]">
            {value}
          </span>
          <span className="text-[11px] text-[var(--ink-faint)]">{unit}</span>
        </div>
        <p className="mt-2 text-[11px] font-semibold" style={{ color: config.color }}>
          {statusLabel}
        </p>
      </div>
      <div className="h-1 w-full" style={{ background: config.color }} aria-hidden="true" />
    </article>
  );
}

/* ── Gas list row ── */
export interface GasRowProps {
  symbol: string;
  fullName: string;
  value: number;
  unit: string;
  status: EnvStatus;
  statusLabel: string;
}

export function GasRow({ symbol, fullName, value, unit, status, statusLabel }: GasRowProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className="flex items-center gap-4 rounded-xl px-5 py-4 transition-colors hover:bg-[var(--env-surface-muted)]"
      aria-label={`${symbol} ${fullName}: ${value} ${unit}, ${statusLabel}`}
    >
      <div className="w-10 shrink-0">
        <p className="text-sm font-bold text-[var(--ink)]">{symbol}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[var(--ink-faint)]">{fullName}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="font-[family-name:var(--font-display)] text-base font-semibold tabular-nums text-[var(--ink)]">
          {value}
        </span>
        <span className="ml-1 text-xs text-[var(--ink-faint)]">{unit}</span>
      </div>
      <StatusBadge color={config.color} bg={config.bg} label={statusLabel} />
    </div>
  );
}

/* ── Noise level bar ── */
export function NoiseLevelBar({ level, category }: { level: number; category: string }) {
  const pct = Math.min(100, Math.max(0, (level / 100) * 100));

  return (
    <div className="mt-3">
      <div className="relative h-2 overflow-hidden rounded-full bg-[var(--env-surface-muted)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--green)] via-[var(--amber)] to-[var(--red)]"
          style={{ width: '100%', opacity: 0.25 }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--green)] shadow-sm"
          style={{ left: `calc(${pct}% - 6px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-[var(--ink-faint)]">
        <span>Silent</span>
        <span className="font-medium text-[var(--ink-soft)]">{category}</span>
        <span>Very Loud</span>
      </div>
    </div>
  );
}

export function CardLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]', className)}>
      {children}
    </p>
  );
}
