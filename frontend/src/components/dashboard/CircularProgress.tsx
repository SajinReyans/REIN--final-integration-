import { motion } from 'framer-motion';
import { scoreToStatus, STATUS_CONFIG } from '../../lib/env-status';
import { cn } from '../../lib/utils';

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  layout?: 'default' | 'horizontal' | 'hero';
  label?: string;
  subtitle?: string;
  ariaLabel?: string;
  className?: string;
}

export function CircularProgress({
  score,
  size = 120,
  strokeWidth = 8,
  layout = 'default',
  label,
  subtitle,
  ariaLabel,
  className,
}: CircularProgressProps) {
  const status = scoreToStatus(score);
  const config = STATUS_CONFIG[status];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const ring = (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-200 dark:text-slate-700" />
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
        <span className={cn('font-[family-name:var(--font-display)] font-bold tabular-nums text-[var(--ink)]', size >= 130 ? 'text-4xl' : 'text-2xl')}>
          {score}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">
          {layout === 'hero' ? 'Score' : '/ 100'}
        </span>
      </div>
    </div>
  );

  if (layout === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-6', className)} role="img" aria-label={ariaLabel ?? `Score ${score} out of 100, ${config.label}`}>
        {ring}
        <div>
          {label && <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{label}</p>}
          <StatusPillInline config={config} className="mt-2" />
          {subtitle && <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--ink-soft)]">{subtitle}</p>}
        </div>
      </div>
    );
  }

  if (layout === 'hero') {
    return (
      <div className={cn('flex flex-col items-center text-center', className)} role="img" aria-label={ariaLabel ?? `Score ${score} out of 100`}>
        {ring}
        <StatusPillInline config={config} className="mt-3" />
        {subtitle && <p className="mt-2 max-w-[200px] text-xs text-[var(--ink-soft)]">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex flex-col items-center', className)} role="img" aria-label={ariaLabel ?? `Score ${score} out of 100`}>
      {ring}
      <StatusPillInline config={config} className="mt-2" />
    </div>
  );
}

function StatusPillInline({ config, className }: { config: (typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG]; className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold', className)} style={{ color: config.color, background: config.bg }}>
      {config.label}
    </span>
  );
}
