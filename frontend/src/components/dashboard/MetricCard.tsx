import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { STATUS_CONFIG, type EnvStatus } from '../../lib/env-status';
import { fadeUp } from './DashboardSection';
import type { Trend } from '../../hooks/useEnvironmentalData';

const ICON_TINTS = {
  blue:   { bg: 'bg-blue-500/10',   text: 'text-[#007aff]' },
  cyan:   { bg: 'bg-cyan-500/10',   text: 'text-cyan-600' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-600' },
  green:  { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
};

export interface MetricCardProps {
  name: string;
  value: string | number;
  unit?: string;
  supportingText?: string;
  icon?: LucideIcon;
  status?: EnvStatus;
  statusLabel?: string;
  iconTint?: keyof typeof ICON_TINTS;
  trend?: Trend;
  variant?: 'weather' | 'pm' | 'gas';
  fullName?: string;
  className?: string;
}

export function MetricCard({
  name,
  value,
  unit = '',
  supportingText,
  icon: Icon,
  status = 'good',
  statusLabel,
  iconTint = 'blue',
  trend,
  variant = 'weather',
  fullName,
  className,
}: MetricCardProps) {
  const config = STATUS_CONFIG[status];
  const tint = ICON_TINTS[iconTint];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  if (variant === 'pm') {
    return (
      <motion.article
        variants={fadeUp}
        whileHover={{ scale: 1.02 }}
        className={cn(
          'overflow-hidden rounded-[20px] border border-white/60 bg-white/80 shadow-[var(--dash-shadow)] backdrop-blur-md',
          'dark:border-white/10 dark:bg-slate-900/80',
          'transition-shadow duration-200 hover:shadow-[var(--dash-shadow-lg)]',
          className,
        )}
        aria-label={`${name}: ${value} ${unit}, ${statusLabel}`}
      >
        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{name}</p>
            {trend && <TrendIcon className="h-3.5 w-3.5" style={{ color: config.color }} aria-hidden="true" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-[var(--ink)]">{value}</span>
            <span className="text-xs text-[var(--ink-faint)]">{unit}</span>
          </div>
          <p className="mt-2 text-xs font-medium" style={{ color: config.color }}>{statusLabel}</p>
        </div>
        <div className="h-1 w-full" style={{ background: config.color }} aria-hidden="true" />
      </motion.article>
    );
  }

  if (variant === 'gas') {
    return (
      <motion.article
        variants={fadeUp}
        whileHover={{ scale: 1.02 }}
        className={cn(
          'flex items-center gap-4 rounded-[12px] border border-white/60 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm',
          'dark:border-white/10 dark:bg-slate-900/60',
          'transition-all duration-200 hover:shadow-[var(--dash-shadow)]',
          className,
        )}
        aria-label={`${name} ${fullName}: ${value} ${unit}`}
      >
        <div className="w-12 shrink-0">
          <p className="text-sm font-bold text-[var(--ink)]">{name}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-[var(--ink-faint)]">{fullName}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tabular-nums">{value}</span>
          <span className="ml-1 text-xs text-[var(--ink-faint)]">{unit}</span>
        </div>
        <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: config.color, background: config.bg }}>
          {statusLabel}
        </span>
      </motion.article>
    );
  }

  /* weather variant */
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'flex h-full min-h-[148px] flex-col rounded-[20px] border border-white/60 bg-white/80 p-5 shadow-[var(--dash-shadow)] backdrop-blur-md',
        'dark:border-white/10 dark:bg-slate-900/80',
        'transition-shadow duration-200 hover:shadow-[var(--dash-shadow-lg)]',
        className,
      )}
      aria-label={`${name}: ${value}${unit ? ` ${unit}` : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        {Icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-[12px]', tint.bg, tint.text)} aria-hidden="true">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
        )}
        {statusLabel && (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: config.color, background: config.bg }}>
            {statusLabel}
          </span>
        )}
      </div>
      <p className="mt-4 text-[13px] font-medium text-[var(--ink-soft)]">{name}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-[28px] font-bold leading-none tabular-nums text-[var(--ink)]">
          {value}
        </span>
        {unit && <span className="text-sm text-[var(--ink-faint)]">{unit}</span>}
      </div>
      {supportingText && <p className="mt-auto pt-3 text-xs text-[var(--ink-faint)]">{supportingText}</p>}
    </motion.article>
  );
}

export function NoiseLevelBar({ level }: { level: number }) {
  const pct = Math.min(100, Math.max(8, level));

  return (
    <div className="mt-3" role="progressbar" aria-valuenow={level} aria-valuemin={0} aria-valuemax={100} aria-label="Noise level indicator">
      <div className="relative h-2.5 overflow-visible rounded-full">
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#2563eb] shadow-md"
          style={{ left: `calc(${pct}% - 7px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
        <span>Silent</span>
        <span>Very Loud</span>
      </div>
    </div>
  );
}
