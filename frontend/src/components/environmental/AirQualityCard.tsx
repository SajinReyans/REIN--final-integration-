import { Wind } from 'lucide-react';
import { EnvCard, LiveBadge, SectionEyebrow } from './EnvPrimitives';
import { PMTile, GasRow } from './MetricCard';
import type { EnvStatus } from '../../lib/env-status';

interface ParticulateMetric {
  name: string;
  value: number;
  unit: string;
  status: EnvStatus;
}

interface GasMetric {
  symbol: string;
  fullName: string;
  value: number;
  unit: string;
  status: EnvStatus;
  statusLabel: string;
}

const PARTICULATES: ParticulateMetric[] = [
  { name: 'PM1', value: 12, unit: 'µg/m³', status: 'excellent' },
  { name: 'PM2.5', value: 18, unit: 'µg/m³', status: 'good' },
  { name: 'PM4', value: 24, unit: 'µg/m³', status: 'moderate' },
  { name: 'PM10', value: 32, unit: 'µg/m³', status: 'good' },
];

const GASES: GasMetric[] = [
  { symbol: 'CO₂', fullName: 'Carbon Dioxide', value: 410, unit: 'ppm', status: 'good', statusLabel: 'Normal' },
  { symbol: 'CO', fullName: 'Carbon Monoxide', value: 0.4, unit: 'ppm', status: 'excellent', statusLabel: 'Safe' },
  { symbol: 'O₃', fullName: 'Ozone', value: 42, unit: 'ppb', status: 'moderate', statusLabel: 'Elevated' },
  { symbol: 'NOx', fullName: 'Nitrogen Oxides', value: 18, unit: 'ppb', status: 'good', statusLabel: 'Normal' },
  { symbol: 'VOC', fullName: 'Volatile Organic Compounds', value: 3, unit: 'index', status: 'excellent', statusLabel: 'Low' },
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AirQualityCard() {
  return (
    <EnvCard className="px-6 py-8 sm:px-10 sm:py-10" aria-labelledby="air-quality-title">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(16,185,129,0.10)] text-[#10B981]"
            aria-hidden="true"
          >
            <Wind className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2
              id="air-quality-title"
              className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)] sm:text-2xl"
            >
              Air Quality Monitoring
            </h2>
            <p className="mt-1 text-[15px] text-[var(--ink-soft)]">Campus-wide sensor network</p>
          </div>
        </div>
        <LiveBadge />
      </header>

      {/* Particulate Matter — open 4-col grid */}
      <div className="mb-12">
        <SectionEyebrow className="mb-5">Particulate Matter</SectionEyebrow>
        <div
          className="grid grid-cols-2 gap-5 sm:grid-cols-4"
          role="list"
          aria-label="Particulate matter readings"
        >
          {PARTICULATES.map((pm) => (
            <div key={pm.name} role="listitem">
              <PMTile
                name={pm.name}
                value={pm.value}
                unit={pm.unit}
                status={pm.status}
                statusLabel={capitalize(pm.status)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Atmospheric Gases — spacious list */}
      <div>
        <SectionEyebrow className="mb-5">Atmospheric Gases</SectionEyebrow>
        <div
          className="divide-y divide-[var(--env-border)] rounded-2xl border border-[var(--env-border)] bg-[var(--env-surface-muted)]/40"
          role="list"
          aria-label="Atmospheric gas readings"
        >
          {GASES.map((gas) => (
            <div key={gas.symbol} role="listitem" className="px-2 first:pt-1 last:pb-1">
              <GasRow {...gas} />
            </div>
          ))}
        </div>
      </div>
    </EnvCard>
  );
}
