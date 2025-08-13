import { XMLParser } from 'fast-xml-parser';
import type { Point, Activity } from '../types/activity';

export async function parseTCXFile(file: File): Promise<Activity> {
  const text = await file.text();
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });
  
  const tcxData = parser.parse(text);
  console.log('TCX data structure:', tcxData);
  
  const points: Point[] = [];
  let name = file.name.replace('.tcx', '');
  let date: Date | undefined;
  
  // Navigate the TCX structure
  const database = tcxData.TrainingCenterDatabase || tcxData;
  const activities = database.Activities?.Activity || database.Activity;
  
  if (!activities) {
    throw new Error('No activities found in TCX file');
  }
  
  // Handle single activity or array of activities
  const activityList = Array.isArray(activities) ? activities : [activities];
  const activity = activityList[0]; // Use first activity
  
  if (activity['@_Sport']) {
    name = activity['@_Sport'];
  }
  
  if (activity.Id) {
    date = new Date(activity.Id);
  }
  
  // Extract track points from laps
  const laps = Array.isArray(activity.Lap) ? activity.Lap : [activity.Lap];
  
  for (const lap of laps) {
    if (!lap?.Track?.Trackpoint) continue;
    
    const trackpoints = Array.isArray(lap.Track.Trackpoint) 
      ? lap.Track.Trackpoint 
      : [lap.Track.Trackpoint];
    
    for (const tp of trackpoints) {
      if (!tp.Position) continue;
      
      const point: Point = {
        lat: parseFloat(tp.Position.LatitudeDegrees),
        lng: parseFloat(tp.Position.LongitudeDegrees),
        ele: tp.AltitudeMeters ? parseFloat(tp.AltitudeMeters) : undefined,
        time: tp.Time ? new Date(tp.Time) : undefined,
        hr: tp.HeartRateBpm?.Value ? parseInt(tp.HeartRateBpm.Value) : undefined,
        cadence: tp.Cadence ? parseInt(tp.Cadence) : undefined,
        temp: tp.Extensions?.TPX?.Watts ? parseFloat(tp.Extensions.TPX.Watts) : undefined,
      };
      
      // Some TCX files have power in different locations
      if (tp.Extensions?.TPX?.Watts) {
        point.power = parseFloat(tp.Extensions.TPX.Watts);
      } else if (tp.Watts) {
        point.power = parseFloat(tp.Watts);
      }
      
      if (!isNaN(point.lat) && !isNaN(point.lng)) {
        points.push(point);
      }
    }
  }
  
  if (points.length === 0) {
    throw new Error('No valid track points found in TCX file');
  }
  
  const { totalDistance, totalElevationGain, totalTime, averagePace, averageHR, maxHR, bounds } = 
    calculateTCXMetrics(points, activity);
  
  return {
    name,
    date,
    points,
    totalDistance,
    totalElevationGain,
    totalTime,
    averagePace,
    averageHR,
    maxHR,
    bounds,
  };
}

function calculateTCXMetrics(points: Point[], activity: any) {
  let totalDistance = 0;
  let totalElevationGain = 0;
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  let hrSum = 0;
  let hrCount = 0;
  let maxHR = 0;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    totalDistance += haversineDistance(prev, curr);
    
    if (curr.ele && prev.ele && curr.ele > prev.ele) {
      totalElevationGain += curr.ele - prev.ele;
    }
    
    minLat = Math.min(minLat, curr.lat);
    maxLat = Math.max(maxLat, curr.lat);
    minLng = Math.min(minLng, curr.lng);
    maxLng = Math.max(maxLng, curr.lng);
    
    if (curr.hr) {
      hrSum += curr.hr;
      hrCount++;
      maxHR = Math.max(maxHR, curr.hr);
    }
  }
  
  // Try to get metrics from activity summary if available
  let activityDistance = totalDistance;
  let activityTime = 0;
  
  if (activity.Lap) {
    const laps = Array.isArray(activity.Lap) ? activity.Lap : [activity.Lap];
    activityDistance = laps.reduce((sum: number, lap: any) => {
      return sum + (lap.DistanceMeters ? parseFloat(lap.DistanceMeters) : 0);
    }, 0);
    
    activityTime = laps.reduce((sum: number, lap: any) => {
      return sum + (lap.TotalTimeSeconds ? parseFloat(lap.TotalTimeSeconds) : 0);
    }, 0);
  }
  
  // Fallback to calculated from timestamps
  if (activityTime === 0) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    activityTime = firstPoint.time && lastPoint.time
      ? (lastPoint.time.getTime() - firstPoint.time.getTime()) / 1000
      : 0;
  }
  
  const averagePace = activityTime > 0 ? activityTime / (activityDistance / 1000) : 0;
  const averageHR = hrCount > 0 ? hrSum / hrCount : undefined;
  
  return {
    totalDistance: activityDistance || totalDistance,
    totalElevationGain,
    totalTime: activityTime,
    averagePace,
    averageHR,
    maxHR: maxHR > 0 ? maxHR : undefined,
    bounds: { minLat, maxLat, minLng, maxLng },
  };
}

function haversineDistance(p1: Point, p2: Point): number {
  const R = 6371000;
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}