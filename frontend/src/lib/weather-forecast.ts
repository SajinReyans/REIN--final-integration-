import type { ForecastDay } from '../hooks/useEnvironmentalData';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export interface ForecastInput {
  tempC: number;
  heatIndexC: number;
  dewPointC: number;
  condition: string;
  alertActive: boolean;
  /** Recent daily high readings from campus sensors (oldest → newest, today last). */
  recentDailyHighsC: number[];
}

function dayLabelsFromToday(count = 7, start = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return DAY_NAMES[d.getDay()];
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Project the next 7 daily highs from current reading + recent sensor trend. */
function projectDailyHighs(currentC: number, historyC: number[]): number[] {
  if (historyC.length < 2) {
    return Array.from({ length: 7 }, (_, i) => round1(currentC + Math.sin(i * 0.9) * 1.2));
  }

  const deltas = historyC.slice(1).map((v, i) => v - historyC[i]);
  const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
  const mean = historyC.reduce((sum, v) => sum + v, 0) / historyC.length;

  const highs: number[] = [currentC];
  for (let i = 1; i < 7; i++) {
    const momentum = avgDelta * Math.max(0.35, 1 - i * 0.1);
    const reversion = (mean - highs[i - 1]) * 0.12;
    highs.push(round1(highs[i - 1] + momentum + reversion));
  }
  return highs;
}

/** Estimate nightly low from projected high, dew point, and heat-index humidity load. */
function projectDailyLow(highC: number, dewPointC: number, heatIndexC: number, tempC: number): number {
  const humidityLoad = Math.max(0, heatIndexC - tempC);
  const dewOffset = Math.max(0, dewPointC - 14) * 0.25;
  const drop = 4.5 + humidityLoad * 0.8 + dewOffset;
  return round1(Math.max(dewPointC - 1, highC - drop));
}

/** Map thermodynamic readings to a forecast condition bucket. */
function deriveCondition(
  highC: number,
  dewPointC: number,
  heatIndexC: number,
  alertActive: boolean,
  dayIndex: number,
): ForecastDay['condition'] {
  const spread = highC - dewPointC;
  const humid = heatIndexC - highC > 1.8;

  if (alertActive && dayIndex <= 2 && humid && spread < 11) return 'rain';
  if (spread < 9 && humid && dayIndex >= 2) return 'rain';
  if (highC >= 31 && spread >= 12) return 'sunny';
  if (highC >= 29 && !humid) return 'sunny';
  return 'partly';
}

export function buildSevenDayForecast(input: ForecastInput): ForecastDay[] {
  const { tempC, heatIndexC, dewPointC, alertActive, recentDailyHighsC } = input;
  const highs = projectDailyHighs(tempC, recentDailyHighsC);
  const labels = dayLabelsFromToday();

  return labels.map((day, i) => {
    const high = highs[i];
    const low = projectDailyLow(high, dewPointC, heatIndexC, tempC);
    const condition = deriveCondition(high, dewPointC, heatIndexC, alertActive, i);

    return {
      day,
      condition,
      high: Math.round(high),
      low: Math.round(low),
    };
  });
}

export function parseMetricC(value: string | number): number {
  return typeof value === 'number' ? value : Number.parseFloat(value);
}
