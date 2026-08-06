import { Volume2, Bell, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { EnvCard, LiveBadge } from './EnvPrimitives';
import { CardLabel, NoiseLevelBar } from './MetricCard';
import { CircularProgress } from './CircularProgress';

const NOISE_LEVEL = 48;
const NOISE_CATEGORY = 'Quiet';
const NOISE_SCORE = 88;

const ALERTS = [
  { title: 'Stable Soundscape', detail: 'All monitored zones within limits', ok: true },
  { title: 'No Active Alerts', detail: 'Ambient levels suitable for study zones', ok: true },
];

export function NoiseMonitoringCard() {
  return (
    <EnvCard className="flex h-full flex-col" aria-labelledby="noise-monitoring-title">
      <header className="mb-5 flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(124,58,237,0.10)] text-[#7C3AED]"
          aria-hidden="true"
        >
          <Volume2 className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h2
            id="noise-monitoring-title"
            className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]"
          >
            Noise Monitoring
          </h2>
          <p className="mt-0.5 text-sm text-[var(--ink-soft)]">Real-time ambient levels</p>
        </div>
      </header>

      {/* Top row: Intensity + Category */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-[var(--env-surface-muted)] p-4">
          <CardLabel>Current Intensity</CardLabel>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-4xl font-bold tabular-nums text-[var(--ink)]">
              {NOISE_LEVEL}
            </span>
            <span className="text-sm text-[var(--ink-faint)]">dB(A)</span>
          </div>
          <div className="mt-2">
            <LiveBadge label="Live" />
          </div>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Safe environment</p>
        </div>

        <div className="rounded-[18px] bg-[var(--env-surface-muted)] p-4">
          <CardLabel>Category</CardLabel>
          <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            {NOISE_CATEGORY}
          </p>
          <NoiseLevelBar level={NOISE_LEVEL} category={NOISE_CATEGORY} />
        </div>
      </div>

      {/* Acoustic Health */}
      <div className="mb-4 rounded-[18px] bg-[var(--env-surface-muted)] px-4 py-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--blue)]" strokeWidth={2} aria-hidden="true" />
          <CardLabel className="!text-[var(--ink-soft)]">Acoustic Health</CardLabel>
        </div>
        <div className="flex justify-center">
          <CircularProgress
            score={NOISE_SCORE}
            layout="hero"
            size={130}
            strokeWidth={8}
            subtitle="Healthy ambient sound conditions"
            ariaLabel={`Noise health score ${NOISE_SCORE} out of 100`}
          />
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="mt-auto">
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--ink-faint)]" strokeWidth={2} aria-hidden="true" />
          <CardLabel>Recent Alerts</CardLabel>
        </div>
        <div className="space-y-2" role="list" aria-label="Noise alerts">
          {ALERTS.map((a) => (
            <div
              key={a.title}
              role="listitem"
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--env-surface-muted)]"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{a.title}</p>
                <p className="text-xs text-[var(--ink-faint)]">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EnvCard>
  );
}
