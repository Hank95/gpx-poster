import { scaleSequential, scaleLinear } from 'd3-scale';
import { interpolateCool, interpolatePlasma } from 'd3-scale-chromatic';

export interface StyleConfig {
  background: string;
  foreground: string;
  accent: string;
  text: string;
  textSecondary: string;
  colorScale: (value: number) => string;
  font: string;
}

export const stylePresets: Record<string, StyleConfig> = {
  minimal: {
    background: '#0b0d10',
    foreground: '#ffffff',
    accent: '#ffffff',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    colorScale: scaleSequential(interpolateCool),
    font: 'Inter, system-ui, sans-serif',
  },
  neon: {
    background: '#0a0e27',
    foreground: '#00ffff',
    accent: '#ff00ff',
    text: '#ffffff',
    textSecondary: '#64748b',
    colorScale: scaleSequential(interpolatePlasma),
    font: 'Inter, system-ui, sans-serif',
  },
  blueprint: {
    background: '#0f1b2a',
    foreground: '#00ffff',
    accent: '#ffffff',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    colorScale: scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(['#00ffff', '#0088ff', '#ffffff']),
    font: 'JetBrains Mono, monospace',
  },
  retro: {
    background: '#f5e6d3',
    foreground: '#8b4513',
    accent: '#ff0000',
    text: '#2c1810',
    textSecondary: '#5d4037',
    colorScale: scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(['#8b4513', '#d2691e', '#ff0000']),
    font: 'Georgia, serif',
  },
};

export const hrZoneColors = [
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#fb923c',
  '#ef4444',
];

export function getHRZoneColor(hr: number, maxHR: number): string {
  const percentage = (hr / maxHR) * 100;
  if (percentage < 60) return hrZoneColors[0];
  if (percentage < 70) return hrZoneColors[1];
  if (percentage < 80) return hrZoneColors[2];
  if (percentage < 90) return hrZoneColors[3];
  return hrZoneColors[4];
}