import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface EnvPageShellProps {
  children: ReactNode;
  className?: string;
}

export function EnvPageShell({ children, className }: EnvPageShellProps) {
  return (
    <div className={cn('env-page mx-auto w-full max-w-[1440px]', className)}>
      {children}
    </div>
  );
}

interface EnvCardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function EnvCard({ children, className, padding = true }: EnvCardProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] bg-[var(--env-card)] shadow-[var(--env-shadow)]',
        'border border-[var(--env-border)]/60',
        padding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageTitleProps {
  eyebrow: string;
  title: string;
  accent?: 'blue' | 'green';
}

export function PageTitle({ eyebrow, title, accent = 'blue' }: PageTitleProps) {
  const accentColor = accent === 'green' ? 'text-[var(--green)]' : 'text-[var(--blue)]';
  return (
    <div>
      <p className={cn('text-[11px] font-bold uppercase tracking-[0.16em]', accentColor)}>
        {eyebrow}
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-[32px] font-bold leading-tight tracking-tight text-[var(--ink)]">
        {title}
      </h1>
    </div>
  );
}

interface QuoteBoxProps {
  children: ReactNode;
  accent?: 'blue' | 'green';
  className?: string;
}

export function QuoteBox({ children, accent = 'blue', className }: QuoteBoxProps) {
  const styles =
    accent === 'green'
      ? 'border-[var(--green)] bg-[var(--green-soft)]/40'
      : 'border-[var(--blue)] bg-[var(--blue-soft)]/50';

  return (
    <blockquote
      className={cn(
        'max-w-md rounded-2xl border-l-4 px-5 py-4 text-sm leading-relaxed text-[var(--ink-soft)]',
        styles,
        className,
      )}
    >
      {children}
    </blockquote>
  );
}

export function LiveBadge({ label = 'Live' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--green-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--green-deep)]">
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
      </span>
      {label}
    </span>
  );
}

export function StatusBadge({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

export function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

export function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]', className)}>
      {children}
    </p>
  );
}
