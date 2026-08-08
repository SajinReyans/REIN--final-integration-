import type { PageKey } from './types';

export const pageTitles: Record<PageKey, string> = {
  dashboard:  'Dashboard',
  map:        'Campus Map',
  weather:    'Weather',
  air:        'Air Quality',
  noise:      'Noise',
  'engineered-features': 'Engineered Features',
  management: 'Sensor Management',
  analytics:  'Analytics',
  ai:         'AI Insights',
};

export interface Building {
  id: string; name: string; status: 'good' | 'warn' | 'bad';
  x: number; y: number;
  health: number; aqi: number; temp: number; hum: number; noise: number;
}

export const buildings: Building[] = [
  { id: 'A', name: 'Workshop & Fabrication Block', status: 'good', x: 22, y: 11, health: 90, aqi: 36, temp: 29.0, hum: 52, noise: 47 },
  { id: 'B', name: 'Solar-Roof Workshop Shed',     status: 'warn', x: 16, y: 22, health: 72, aqi: 57, temp: 30.6, hum: 57, noise: 54 },
  { id: 'C', name: 'Hostel Tower A',               status: 'good', x: 33, y: 19, health: 89, aqi: 34, temp: 28.8, hum: 53, noise: 42 },
  { id: 'D', name: 'Hostel Tower B',               status: 'warn', x: 62, y: 19, health: 71, aqi: 59, temp: 30.3, hum: 58, noise: 55 },
  { id: 'E', name: 'Residential Block C',          status: 'good', x: 76, y: 26, health: 92, aqi: 30, temp: 28.5, hum: 50, noise: 40 },
  { id: 'F', name: 'Facilities Building',          status: 'good', x: 69, y: 29, health: 86, aqi: 39, temp: 29.2, hum: 54, noise: 45 },
  { id: 'G', name: 'Sports Ground Complex',        status: 'good', x: 40, y: 34, health: 94, aqi: 29, temp: 29.6, hum: 51, noise: 43 },
  { id: 'H', name: 'Main Academic Block',          status: 'bad',  x: 46, y: 55, health: 57, aqi: 68, temp: 31.2, hum: 62, noise: 70 },
  { id: 'I', name: 'B-block',                      status: 'warn', x: 68, y: 45, health: 70, aqi: 60, temp: 30.5, hum: 59, noise: 56 },
  { id: 'J', name: 'Transport Yard',               status: 'good', x: 60, y: 78, health: 88, aqi: 37, temp: 29.4, hum: 53, noise: 48 },
];

export function statusColor(s: string) {
  return s === 'good' ? '#1F9D6C' : s === 'warn' ? '#E8A33D' : '#E1523D';
}
