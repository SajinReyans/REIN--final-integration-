import { motion } from 'framer-motion';
import { scoreToStatus, STATUS_CONFIG } from '../../lib/env-status';
import { cn } from '../../lib/utils';

interface CircularProgressProps {
  score: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  ariaLabel?: string;
  layout?: 'default' | 'compact' | 'horizontal' | 'hero';
  subtitle?: string;
  className?: string;
}

export function CircularProgress({
  score,
  label,
  size = 120,
  strokeWidth = 8,
  ariaLabel,
  layout = 'default',
  subtitle,
  className,
}: CircularProgressProps) {
  const status = scoreToStatus(score);
  const config = STATUS_CONFIG[status];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreSize =
    layout === 'hero'
      ? 'text-5xl'
      : size >= 140
        ? 'text-3xl'
        : size >= 110
          ? 'text-2xl'
          : 'text-xl';

  const ring = (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          opacity={0.35}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-[family-name:var(--font-display)] font-bold tabular-nums text-[var(--ink)]', scoreSize)}>
          {score}
        </span>
        {layout === 'hero' ? (
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-faint)]">
            Score
          </span>
        ) : (
          <span className="text-[10px] font-medium text-[var(--ink-faint)]">/ 100</span>
        )}
      </div>
    </div>
  );

  if (layout === 'hero') {
    return (
      <div
        className={cn('flex flex-col items-center text-center', className)}
        role="img"
        aria-label={ariaLabel ?? `Score: ${score} out of 100, ${config.label}`}
      >
        {ring}
        <span
          className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: config.bg, color: config.color }}
        >
          {config.label}
        </span>
        {subtitle && (
          <p className="mt-3 max-w-[220px] text-xs leading-relaxed text-[var(--ink-soft)]">{subtitle}</p>
        )}
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div
        className={cn('flex items-center gap-5', className)}
        role="img"
        aria-label={ariaLabel ?? `${label ?? 'Score'}: ${score} out of 100, ${config.label}`}
      >
        {ring}
        <div>
          {label && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">{label}</p>
          )}
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-[var(--ink)]">
            {score} <span className="text-sm font-medium text-[var(--ink-faint)]">/ 100</span>
          </p>
          <span
            className="mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: config.bg, color: config.color }}
          >
            {config.label}
          </span>
          {subtitle && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex flex-col items-center', className)}
      role="img"
      aria-label={ariaLabel ?? `${label ?? 'Score'}: ${score} out of 100, ${config.label}`}
    >
      {ring}
      <div className="mt-2 text-center">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: config.bg, color: config.color }}
        >
          {config.label}
        </span>
        {label && <p className="mt-1 text-[11px] font-medium text-[var(--ink-faint)]">{label}</p>}
      </div>
    </div>
  );
}
