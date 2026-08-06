import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px]', className)}>
      {children}
    </div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}

export function GlassCard({ children, className, hover = false, padding = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-white/60 bg-white/80 shadow-[var(--dash-shadow)] backdrop-blur-md',
        'dark:border-white/10 dark:bg-slate-900/80',
        hover && 'transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--dash-shadow-lg)]',
        padding && 'p-6 sm:p-7',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  meta?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ title, subtitle, meta, children, className }: DashboardSectionProps) {
  return (
    <motion.section variants={fadeUp} className={cn('space-y-5', className)} aria-labelledby={title.replace(/\s/g, '-')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={title.replace(/\s/g, '-')} className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)] sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-[var(--ink-soft)]">{subtitle}</p>}
        </div>
        {meta && <span className="text-xs font-medium text-[var(--ink-faint)]">{meta}</span>}
      </div>
      {children}
    </motion.section>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  quote: string | string[];
  accent?: 'blue' | 'green';
}

export function PageHeader({ eyebrow, title, quote, accent = 'blue' }: PageHeaderProps) {
  const lines = Array.isArray(quote) ? quote : [quote];
  const border = accent === 'green' ? 'border-[var(--green)]' : 'border-[var(--primary)]';
  const bg = accent === 'green' ? 'bg-emerald-50/80 dark:bg-emerald-950/30' : 'bg-blue-50/80 dark:bg-blue-950/30';

  return (
    <motion.header variants={fadeUp} className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">{eyebrow}</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
      </div>
      <blockquote className={cn('max-w-md rounded-[12px] border-l-4 px-5 py-4 text-sm leading-relaxed text-[var(--ink-soft)]', border, bg)}>
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </blockquote>
    </motion.header>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

export function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color, background: bg }}>
      {label}
    </span>
  );
}
