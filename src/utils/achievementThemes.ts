import { scaleSequential, scaleLinear } from 'd3-scale';
import { interpolateViridis, interpolatePlasma, interpolateInferno, interpolateTurbo } from 'd3-scale-chromatic';

export interface AchievementTheme {
  id: string;
  name: string;
  description: string;
  background: string;
  foreground: string;
  accent: string;
  secondary: string;
  text: string;
  textSecondary: string;
  colorScale: (value: number) => string;
  
  // Typography
  displayFont: string;
  bodyFont: string;
  
  // Achievement styling
  achievementColor: string;
  highlightColor: string;
  
  // Layout
  glowEffect?: boolean;
  textureOverlay?: string;
  gradientBackground?: string;
}

export const achievementThemes: Record<string, AchievementTheme> = {
  // Victory Gold - Elegant celebration of achievement
  victory: {
    id: 'victory',
    name: 'Victory Gold',
    description: 'Elegant gold celebration of your achievement',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1611 50%, #0a0a0a 100%)',
    foreground: '#ffd700',
    accent: '#ffed4e',
    secondary: '#b8860b',
    text: '#ffffff',
    textSecondary: '#d4af37',
    colorScale: scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(['#b8860b', '#ffd700', '#ffed4e']),
    displayFont: '"Playfair Display", serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    achievementColor: '#ffed4e',
    highlightColor: '#fff700',
    glowEffect: true,
  },
  
  // Urban Neon - Vibrant cityscape energy
  neon: {
    id: 'neon',
    name: 'Urban Neon',
    description: 'Electric city energy for urban warriors',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1138 50%, #0a0e27 100%)',
    foreground: '#00ffff',
    accent: '#ff0080',
    secondary: '#8000ff',
    text: '#ffffff',
    textSecondary: '#00d4ff',
    colorScale: scaleSequential(interpolatePlasma),
    displayFont: '"Orbitron", monospace',
    bodyFont: '"Inter", system-ui, sans-serif',
    achievementColor: '#ff0080',
    highlightColor: '#ff40a0',
    glowEffect: true,
  },
  
  // Nature Explorer - Earth tones for outdoor adventures
  nature: {
    id: 'nature',
    name: 'Nature Explorer',
    description: 'Earth tones celebrating outdoor adventures',
    background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 50%, #1a2e1a 100%)',
    foreground: '#90ee90',
    accent: '#32cd32',
    secondary: '#228b22',
    text: '#f0fff0',
    textSecondary: '#98fb98',
    colorScale: scaleSequential(interpolateViridis),
    displayFont: '"Playfair Display", serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    achievementColor: '#32cd32',
    highlightColor: '#7cfc00',
    textureOverlay: 'radial-gradient(circle at 20% 80%, rgba(120,158,120,0.3), transparent 50%)',
  },
  
  // Minimalist Champion - Clean geometric celebration
  champion: {
    id: 'champion',
    name: 'Minimalist Champion',
    description: 'Clean, powerful celebration of victory',
    background: '#000000',
    foreground: '#ffffff',
    accent: '#ff3333',
    secondary: '#666666',
    text: '#ffffff',
    textSecondary: '#cccccc',
    colorScale: scaleLinear<string>()
      .domain([0, 0.3, 0.7, 1])
      .range(['#666666', '#ffffff', '#ff6666', '#ff3333']),
    displayFont: '"Bebas Neue", Impact, sans-serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    achievementColor: '#ff3333',
    highlightColor: '#ff6666',
  },
  
  // Fire Storm - Intense heat for powerful performances
  fire: {
    id: 'fire',
    name: 'Fire Storm',
    description: 'Blazing heat for your most intense efforts',
    background: 'linear-gradient(135deg, #1a0a0a 0%, #330000 50%, #1a0a0a 100%)',
    foreground: '#ff4500',
    accent: '#ff6600',
    secondary: '#cc3300',
    text: '#ffffff',
    textSecondary: '#ffaa80',
    colorScale: scaleSequential(interpolateInferno),
    displayFont: '"Orbitron", monospace',
    bodyFont: '"Inter", system-ui, sans-serif',
    achievementColor: '#ff6600',
    highlightColor: '#ff8800',
    glowEffect: true,
  },
  
  // Ocean Depth - Deep blue for endurance achievements  
  ocean: {
    id: 'ocean',
    name: 'Ocean Depth',
    description: 'Deep blue for endurance and persistence',
    background: 'linear-gradient(135deg, #001122 0%, #002244 50%, #001122 100%)',
    foreground: '#00ccff',
    accent: '#0080ff',
    secondary: '#004080',
    text: '#ffffff',
    textSecondary: '#80d4ff',
    colorScale: scaleSequential(interpolateTurbo),
    displayFont: '"Playfair Display", serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    achievementColor: '#0080ff',
    highlightColor: '#40a0ff',
  },
};

// Achievement celebration words for dynamic titles
export const achievementWords = {
  conquered: ['CONQUERED', 'CRUSHED', 'DEMOLISHED', 'DESTROYED', 'DOMINATED'],
  completed: ['ACHIEVED', 'ACCOMPLISHED', 'FINISHED', 'COMPLETED', 'MASTERED'],
  distance: ['DISTANCE WARRIOR', 'MILE CRUSHER', 'ENDURANCE HERO', 'LONG HAUL CHAMPION'],
  speed: ['SPEED DEMON', 'PACE MASTER', 'VELOCITY CHAMPION', 'SWIFT WARRIOR'],
  elevation: ['HILL CRUSHER', 'MOUNTAIN CONQUEROR', 'ELEVATION MASTER', 'CLIMB CHAMPION'],
  dedication: ['DEDICATION', 'COMMITMENT', 'PERSISTENCE', 'DETERMINATION', 'GRIT'],
};

// Generate inspiring title based on activity data
export function generateAchievementTitle(activity: any): string {
  const distance = activity.totalDistance / 1000;
  const elevation = activity.totalElevationGain;
  const avgPace = activity.averagePace;
  
  // Distance-based achievements
  if (distance >= 42.195) return 'MARATHON LEGEND';
  if (distance >= 21.1) return 'HALF MARATHON HERO';
  if (distance >= 10) return 'DISTANCE DESTROYER';
  if (distance >= 5) return 'MILE CRUSHER';
  
  // Elevation-based achievements
  if (elevation >= 1000) return 'MOUNTAIN CONQUEROR';
  if (elevation >= 500) return 'HILL CRUSHER';
  
  // Speed-based (fast pace)
  if (avgPace <= 4) return 'SPEED DEMON';
  if (avgPace <= 5) return 'PACE MASTER';
  
  // Default inspirational titles
  const defaultTitles = ['ACHIEVEMENT UNLOCKED', 'GOAL CRUSHER', 'PERSONAL VICTORY', 'EFFORT REWARDED'];
  return defaultTitles[Math.floor(Math.random() * defaultTitles.length)];
}

// Generate motivational subtitle
export function generateMotivationalSubtitle(activity: any): string {
  const distance = (activity.totalDistance / 1000).toFixed(1);
  const time = formatDuration(activity.totalTime);
  const elevation = Math.round(activity.totalElevationGain);
  
  const phrases = [
    `${distance}km of pure determination`,
    `${time} of unstoppable effort`,
    `${elevation}m of vertical victory`,
    `Every step counted, every mile mattered`,
    `Pushing limits, breaking boundaries`,
    `Where dedication meets achievement`,
  ];
  
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}