export interface Point {
  lat: number;
  lng: number;
  ele?: number;
  time?: Date;
  hr?: number;
  cadence?: number;
  power?: number;
  temp?: number;
}

export interface ProcessedPoint extends Point {
  distance: number;
  pace: number;
  grade: number;
  speed: number;
  normalizedHR?: number;
  normalizedPace?: number;
  normalizedPower?: number;
}

export interface Activity {
  name?: string;
  date?: Date;
  points: Point[];
  totalDistance: number;
  totalElevationGain: number;
  totalTime: number;
  averagePace: number;
  averageHR?: number;
  maxHR?: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface ProcessedActivity extends Activity {
  processedPoints: ProcessedPoint[];
  splits: Split[];
  fastestSplit?: Split;
  steepestClimb?: Segment;
  maxHRSegment?: Segment;
}

export interface Split {
  index: number;
  distance: number;
  time: number;
  pace: number;
  elevationGain: number;
  averageHR?: number;
}

export interface Segment {
  startIndex: number;
  endIndex: number;
  distance: number;
  grade: number;
  description: string;
}

export type VisualizationTemplate = 'ribbon' | 'skyline' | 'topo' | 'pulse' | 'rosette';
export type StylePreset = 'minimal' | 'neon' | 'blueprint' | 'retro';

export interface VisualizationConfig {
  template: VisualizationTemplate;
  style: StylePreset;
  colorMapping: 'hr' | 'pace' | 'elevation' | 'power';
  thicknessScale: number;
  showLabels: boolean;
  showSplits: boolean;
  showHighlights: boolean;
}

export interface ExportSettings {
  format: 'png' | 'pdf' | 'svg';
  resolution: number;
  aspectRatio: '24x36' | '1x1' | '4x5' | '9x16' | '16x9';
  includeQR?: boolean;
  qrUrl?: string;
}