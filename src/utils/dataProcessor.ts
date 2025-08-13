import type { ProcessedActivity } from "../types/activity";
import type {
  Activity,
  ProcessedPoint,
  Split,
  Segment,
} from "../types/activity";
import { haversineDistance } from "./gpxParser";

export function processActivity(activity: Activity): ProcessedActivity {
  const processedPoints = computeMetrics(activity.points);
  const normalizedPoints = normalizeMetrics(processedPoints);
  const splits = detectSplits(normalizedPoints, 1000);
  const fastestSplit = findFastestSplit(splits);
  const steepestClimb = findSteepestClimb(normalizedPoints);
  const maxHRSegment = findMaxHRSegment(normalizedPoints);

  return {
    ...activity,
    processedPoints: normalizedPoints,
    splits,
    fastestSplit,
    steepestClimb,
    maxHRSegment,
  };
}

function computeMetrics(points: Activity["points"]): ProcessedPoint[] {
  const processed: ProcessedPoint[] = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const prev = i > 0 ? points[i - 1] : curr;

    const segmentDistance = i > 0 ? haversineDistance(prev, curr) : 0;
    cumulativeDistance += segmentDistance;

    const timeDelta =
      curr.time && prev.time
        ? (curr.time.getTime() - prev.time.getTime()) / 1000
        : 1;

    const speed = timeDelta > 0 ? segmentDistance / timeDelta : 0;
    const pace = speed > 0 ? 1000 / (speed * 60) : 0;

    const elevationDelta = curr.ele && prev.ele ? curr.ele - prev.ele : 0;
    const grade =
      segmentDistance > 0 ? (elevationDelta / segmentDistance) * 100 : 0;

    processed.push({
      ...curr,
      distance: cumulativeDistance,
      pace: smoothValue(processed, i, "pace", pace, 10),
      grade: smoothValue(processed, i, "grade", grade, 5),
      speed,
    });
  }

  return processed;
}

function smoothValue(
  points: ProcessedPoint[],
  index: number,
  field: keyof ProcessedPoint,
  value: number,
  windowSize: number
): number {
  const halfWindow = Math.floor(windowSize / 2);
  const start = Math.max(0, index - halfWindow);
  const end = Math.min(points.length, index + halfWindow);

  if (end - start === 0) return value;

  let sum = value;
  let count = 1;

  for (let i = start; i < index; i++) {
    const val = points[i][field];
    if (typeof val === "number") {
      sum += val;
      count++;
    }
  }

  return sum / count;
}

function normalizeMetrics(points: ProcessedPoint[]): ProcessedPoint[] {
  const paces = points.map((p) => p.pace).filter((p) => p > 0);
  const hrs = points
    .map((p) => p.hr)
    .filter((h): h is number => h !== undefined);
  const powers = points
    .map((p) => p.power)
    .filter((p): p is number => p !== undefined);

  const paceP5 = percentile(paces, 0.05);
  const paceP95 = percentile(paces, 0.95);
  const hrP5 = hrs.length > 0 ? percentile(hrs, 0.05) : 0;
  const hrP95 = hrs.length > 0 ? percentile(hrs, 0.95) : 0;
  const powerP5 = powers.length > 0 ? percentile(powers, 0.05) : 0;
  const powerP95 = powers.length > 0 ? percentile(powers, 0.95) : 0;

  return points.map((point) => ({
    ...point,
    normalizedPace: normalize(point.pace, paceP5, paceP95),
    normalizedHR: point.hr ? normalize(point.hr, hrP5, hrP95) : undefined,
    normalizedPower: point.power
      ? normalize(point.power, powerP5, powerP95)
      : undefined,
  }));
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * p);
  return sorted[index] || 0;
}

function detectSplits(
  points: ProcessedPoint[],
  splitDistance: number
): Split[] {
  const splits: Split[] = [];
  let currentSplitStart = 0;
  let currentSplitDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const segmentDistance = points[i].distance - points[i - 1].distance;
    currentSplitDistance += segmentDistance;

    if (currentSplitDistance >= splitDistance) {
      const splitPoints = points.slice(currentSplitStart, i + 1);
      const startTime = splitPoints[0].time;
      const endTime = splitPoints[splitPoints.length - 1].time;
      const splitTime =
        startTime && endTime
          ? (endTime.getTime() - startTime.getTime()) / 1000
          : 0;

      const avgPace =
        splitPoints.reduce((sum, p) => sum + p.pace, 0) / splitPoints.length;
      const avgHR =
        splitPoints.reduce((sum, p) => sum + (p.hr || 0), 0) /
        splitPoints.length;
      const elevGain = splitPoints.reduce((sum, p, idx) => {
        if (idx === 0) return sum;
        const prev = splitPoints[idx - 1];
        return (
          sum + (p.ele && prev.ele && p.ele > prev.ele ? p.ele - prev.ele : 0)
        );
      }, 0);

      splits.push({
        index: splits.length,
        distance: currentSplitDistance,
        time: splitTime,
        pace: avgPace,
        elevationGain: elevGain,
        averageHR: avgHR > 0 ? avgHR : undefined,
      });

      currentSplitStart = i;
      currentSplitDistance = 0;
    }
  }

  return splits;
}

function findFastestSplit(splits: Split[]): Split | undefined {
  if (splits.length === 0) return undefined;
  return splits.reduce((fastest, split) =>
    split.pace < fastest.pace ? split : fastest
  );
}

function findSteepestClimb(
  points: ProcessedPoint[],
  minDistance: number = 100
): Segment | undefined {
  let steepest: Segment | undefined;
  let maxGrade = 0;

  for (let i = 0; i < points.length - 1; i++) {
    let j = i + 1;
    let segmentDistance = 0;
    let totalElevGain = 0;

    while (j < points.length && segmentDistance < minDistance * 2) {
      segmentDistance = points[j].distance - points[i].distance;

      if (points[j].ele && points[i].ele) {
        const elevGain =
          points[j].ele !== undefined && points[i].ele !== undefined
            ? (points[j].ele as number) - (points[i].ele as number)
            : 0;
        if (elevGain > 0) {
          totalElevGain = elevGain;
          const grade = (totalElevGain / segmentDistance) * 100;

          if (segmentDistance >= minDistance && grade > maxGrade) {
            maxGrade = grade;
            steepest = {
              startIndex: i,
              endIndex: j,
              distance: segmentDistance,
              grade,
              description: `${grade.toFixed(1)}% over ${(
                segmentDistance / 1000
              ).toFixed(2)} km`,
            };
          }
        }
      }
      j++;
    }
  }

  return steepest;
}

function findMaxHRSegment(points: ProcessedPoint[]): Segment | undefined {
  let maxHR = 0;
  let maxHRIndex = -1;

  for (let i = 0; i < points.length; i++) {
    if (points[i].hr && points[i].hr! > maxHR) {
      maxHR = points[i].hr!;
      maxHRIndex = i;
    }
  }

  if (maxHRIndex === -1) return undefined;

  const windowSize = 30;
  const start = Math.max(0, maxHRIndex - windowSize);
  const end = Math.min(points.length - 1, maxHRIndex + windowSize);

  return {
    startIndex: start,
    endIndex: end,
    distance: points[end].distance - points[start].distance,
    grade: 0,
    description: `Max HR: ${maxHR} bpm`,
  };
}
