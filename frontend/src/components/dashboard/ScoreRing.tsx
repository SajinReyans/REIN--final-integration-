import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  ariaLabel?: string;
  className?: string;
  ringColor?: string;
  trackColor?: string;
}

export function ScoreRing({
  score,
  size = 160,
  strokeWidth = 11,
  ariaLabel,
  className,
  ringColor = '#007aff',
  trackColor = '#dbeafe',
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex', className)}
      role="img"
      aria-label={ariaLabel ?? `Health score ${score} out of 100`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-bold leading-none tracking-tight tabular-nums text-[var(--ink)]',
              size >= 120 ? 'text-[2rem]' : size >= 88 ? 'text-xl' : 'text-lg',
            )}
          >
            {score}
            <span className={cn('font-medium text-[var(--ink-faint)]', size >= 120 ? 'text-base' : 'text-sm')}>
              {' '}
              / 100
            </span>
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            Score
          </span>
        </div>
      </div>
    </div>
  );
}
