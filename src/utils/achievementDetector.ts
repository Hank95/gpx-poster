import type { ProcessedActivity } from '../types/activity';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'distance' | 'speed' | 'elevation' | 'endurance' | 'consistency';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value?: number;
  unit?: string;
  isPersonalRecord?: boolean;
}

export interface ActivityAnalysis {
  achievements: Achievement[];
  highlights: Highlight[];
  personalRecords: PersonalRecord[];
  effortLevel: 'easy' | 'moderate' | 'hard' | 'extreme';
  inspirationalQuote: string;
}

export interface Highlight {
  type: 'fastest_split' | 'steepest_climb' | 'max_hr' | 'longest_effort' | 'elevation_gain';
  title: string;
  value: number;
  unit: string;
  description: string;
  position?: { lat: number; lng: number };
}

export interface PersonalRecord {
  type: string;
  value: number;
  unit: string;
  description: string;
  improvement?: number;
}

export function analyzeActivity(activity: ProcessedActivity): ActivityAnalysis {
  const achievements = detectAchievements(activity);
  const highlights = extractHighlights(activity);
  const personalRecords = checkPersonalRecords(activity);
  const effortLevel = calculateEffortLevel(activity);
  const inspirationalQuote = generateInspirationalQuote(activity, achievements);
  
  return {
    achievements,
    highlights,
    personalRecords,
    effortLevel,
    inspirationalQuote,
  };
}

function detectAchievements(activity: ProcessedActivity): Achievement[] {
  const achievements: Achievement[] = [];
  const distance = activity.totalDistance / 1000;
  const elevation = activity.totalElevationGain;
  const avgPace = activity.averagePace;
  const maxHR = activity.maxHR;
  const time = activity.totalTime;
  
  // Distance achievements
  if (distance >= 42.195) {
    achievements.push({
      id: 'marathon',
      title: 'Marathon Legend',
      description: 'Completed the ultimate endurance challenge',
      icon: '🏃‍♂️',
      category: 'distance',
      rarity: 'legendary',
      value: distance,
      unit: 'km',
    });
  } else if (distance >= 21.1) {
    achievements.push({
      id: 'half_marathon',
      title: 'Half Marathon Hero',
      description: 'Conquered 21.1km of determination',
      icon: '🎯',
      category: 'distance',
      rarity: 'epic',
      value: distance,
      unit: 'km',
    });
  } else if (distance >= 10) {
    achievements.push({
      id: 'double_digit',
      title: 'Double Digit Destroyer',
      description: 'Crushed 10+ kilometers',
      icon: '💪',
      category: 'distance',
      rarity: 'rare',
      value: distance,
      unit: 'km',
    });
  }
  
  // Speed achievements
  if (avgPace <= 3.5) {
    achievements.push({
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Lightning-fast pace maintained',
      icon: '⚡',
      category: 'speed',
      rarity: 'epic',
      value: avgPace,
      unit: 'min/km',
    });
  } else if (avgPace <= 4.5) {
    achievements.push({
      id: 'pace_master',
      title: 'Pace Master',
      description: 'Impressive speed consistency',
      icon: '🔥',
      category: 'speed',
      rarity: 'rare',
      value: avgPace,
      unit: 'min/km',
    });
  }
  
  // Elevation achievements
  if (elevation >= 1500) {
    achievements.push({
      id: 'mountain_conqueror',
      title: 'Mountain Conqueror',
      description: 'Scaled massive vertical challenges',
      icon: '⛰️',
      category: 'elevation',
      rarity: 'legendary',
      value: elevation,
      unit: 'm',
    });
  } else if (elevation >= 750) {
    achievements.push({
      id: 'hill_crusher',
      title: 'Hill Crusher',
      description: 'Dominated significant elevation gain',
      icon: '🏔️',
      category: 'elevation',
      rarity: 'epic',
      value: elevation,
      unit: 'm',
    });
  } else if (elevation >= 300) {
    achievements.push({
      id: 'elevation_warrior',
      title: 'Elevation Warrior',
      description: 'Conquered challenging climbs',
      icon: '🗻',
      category: 'elevation',
      rarity: 'rare',
      value: elevation,
      unit: 'm',
    });
  }
  
  // Endurance achievements (time-based)
  if (time >= 7200) { // 2+ hours
    achievements.push({
      id: 'endurance_hero',
      title: 'Endurance Hero',
      description: 'Sustained effort for 2+ hours',
      icon: '🏆',
      category: 'endurance',
      rarity: 'epic',
      value: Math.round(time / 3600),
      unit: 'hours',
    });
  } else if (time >= 3600) { // 1+ hour
    achievements.push({
      id: 'hour_warrior',
      title: 'Hour Warrior',
      description: 'Maintained focus for over an hour',
      icon: '⏱️',
      category: 'endurance',
      rarity: 'rare',
      value: Math.round(time / 60),
      unit: 'minutes',
    });
  }
  
  // Heart rate achievements
  if (maxHR && maxHR >= 190) {
    achievements.push({
      id: 'heart_champion',
      title: 'Heart Champion',
      description: 'Pushed cardiovascular limits',
      icon: '❤️',
      category: 'endurance',
      rarity: 'rare',
      value: maxHR,
      unit: 'bpm',
    });
  }
  
  return achievements;
}

function extractHighlights(activity: ProcessedActivity): Highlight[] {
  const highlights: Highlight[] = [];
  
  // Fastest split
  if (activity.fastestSplit) {
    highlights.push({
      type: 'fastest_split',
      title: 'Fastest Kilometer',
      value: activity.fastestSplit.pace,
      unit: 'min/km',
      description: `Split ${activity.fastestSplit.index + 1} - your speed burst`,
    });
  }
  
  // Steepest climb
  if (activity.steepestClimb) {
    highlights.push({
      type: 'steepest_climb',
      title: 'Steepest Challenge',
      value: activity.steepestClimb.grade,
      unit: '%',
      description: activity.steepestClimb.description,
    });
  }
  
  // Max heart rate moment
  if (activity.maxHRSegment && activity.maxHR) {
    highlights.push({
      type: 'max_hr',
      title: 'Peak Effort',
      value: activity.maxHR,
      unit: 'bpm',
      description: 'Maximum heart rate reached',
    });
  }
  
  // Total elevation gain
  if (activity.totalElevationGain > 100) {
    highlights.push({
      type: 'elevation_gain',
      title: 'Vertical Victory',
      value: activity.totalElevationGain,
      unit: 'm',
      description: 'Total elevation conquered',
    });
  }
  
  return highlights;
}

function checkPersonalRecords(activity: ProcessedActivity): PersonalRecord[] {
  // This would ideally check against stored user data
  // For now, we'll assume some achievements are PRs based on performance
  const records: PersonalRecord[] = [];
  const distance = activity.totalDistance / 1000;
  
  // Simulate PR detection (in real app, this would check user's history)
  if (distance >= 21.1) {
    records.push({
      type: 'longest_distance',
      value: distance,
      unit: 'km',
      description: 'New longest distance record!',
      improvement: 2.1, // km improvement
    });
  }
  
  if (activity.fastestSplit && activity.fastestSplit.pace <= 4.0) {
    records.push({
      type: 'fastest_kilometer',
      value: activity.fastestSplit.pace,
      unit: 'min/km',
      description: 'New fastest kilometer split!',
      improvement: 0.15, // 15 seconds faster
    });
  }
  
  return records;
}

function calculateEffortLevel(activity: ProcessedActivity): 'easy' | 'moderate' | 'hard' | 'extreme' {
  let effortScore = 0;
  
  const distance = activity.totalDistance / 1000;
  const elevation = activity.totalElevationGain;
  const avgPace = activity.averagePace;
  const time = activity.totalTime / 3600; // hours
  
  // Distance factor
  if (distance >= 20) effortScore += 3;
  else if (distance >= 10) effortScore += 2;
  else if (distance >= 5) effortScore += 1;
  
  // Elevation factor
  if (elevation >= 1000) effortScore += 3;
  else if (elevation >= 500) effortScore += 2;
  else if (elevation >= 250) effortScore += 1;
  
  // Pace factor (faster = higher effort)
  if (avgPace <= 4) effortScore += 3;
  else if (avgPace <= 5) effortScore += 2;
  else if (avgPace <= 6) effortScore += 1;
  
  // Time factor
  if (time >= 3) effortScore += 3;
  else if (time >= 2) effortScore += 2;
  else if (time >= 1) effortScore += 1;
  
  if (effortScore >= 8) return 'extreme';
  if (effortScore >= 6) return 'hard';
  if (effortScore >= 3) return 'moderate';
  return 'easy';
}

function generateInspirationalQuote(_activity: ProcessedActivity, achievements: Achievement[]): string {
  // const distance = activity.totalDistance / 1000;
  const hasSpeedAchievement = achievements.some(a => a.category === 'speed');
  const hasElevationAchievement = achievements.some(a => a.category === 'elevation');
  const hasDistanceAchievement = achievements.some(a => a.category === 'distance');
  
  const quotes = [
    "Every mile is a victory",
    "Stronger than yesterday",
    "The only bad workout is the one that didn't happen",
    "Progress, not perfection",
    "Your only limit is you",
    "Sweat is just fat crying",
    "Champions train, losers complain",
    "The comeback is always stronger than the setback",
  ];
  
  // Contextual quotes based on achievements
  if (hasDistanceAchievement) {
    quotes.push(
      "Distance doesn't matter, dedication does",
      "One step at a time, one mile at a time",
      "Long runs build long lasting confidence"
    );
  }
  
  if (hasSpeedAchievement) {
    quotes.push(
      "Speed is earned, not given",
      "Fast legs, faster mind",
      "When you feel like quitting, remember why you started"
    );
  }
  
  if (hasElevationAchievement) {
    quotes.push(
      "Hills don't get easier, you get stronger",
      "What goes up, makes you tougher",
      "Climb every mountain, conquer every fear"
    );
  }
  
  return quotes[Math.floor(Math.random() * quotes.length)];
}