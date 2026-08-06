export type EnvStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous';

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  ring: string;
  gradient: string;
}

export const STATUS_CONFIG: Record<EnvStatus, StatusConfig> = {
  excellent: {
    label: 'Excellent',
    color: '#1F9D6C',
    bg: 'rgba(31,157,108,0.12)',
    border: 'rgba(31,157,108,0.25)',
    ring: '#1F9D6C',
    gradient: 'from-emerald-500/10 to-teal-500/5',
  },
  good: {
    label: 'Good',
    color: '#1D6FA5',
    bg: 'rgba(29,111,165,0.12)',
    border: 'rgba(29,111,165,0.25)',
    ring: '#1D6FA5',
    gradient: 'from-cyan-500/10 to-blue-500/5',
  },
  moderate: {
    label: 'Moderate',
    color: '#E8A33D',
    bg: 'rgba(232,163,61,0.14)',
    border: 'rgba(232,163,61,0.28)',
    ring: '#E8A33D',
    gradient: 'from-amber-500/10 to-yellow-500/5',
  },
  poor: {
    label: 'Poor',
    color: '#E87A3D',
    bg: 'rgba(232,122,61,0.14)',
    border: 'rgba(232,122,61,0.28)',
    ring: '#E87A3D',
    gradient: 'from-orange-500/10 to-amber-500/5',
  },
  hazardous: {
    label: 'Hazardous',
    color: '#E1523D',
    bg: 'rgba(225,82,61,0.14)',
    border: 'rgba(225,82,61,0.28)',
    ring: '#E1523D',
    gradient: 'from-red-500/10 to-rose-500/5',
  },
};

export function scoreToStatus(score: number): EnvStatus {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 55) return 'moderate';
  if (score >= 35) return 'poor';
  return 'hazardous';
}

export function aqiToStatus(aqi: number): EnvStatus {
  if (aqi <= 25) return 'excellent';
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'poor';
  return 'hazardous';
}
