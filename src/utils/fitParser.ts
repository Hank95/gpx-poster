import { Decoder, Stream } from '@garmin/fitsdk';
import type { Point, Activity } from '../types/activity';

export async function parseFITFile(file: File): Promise<Activity> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  const stream = Stream.fromByteArray(bytes);
  const decoder = new Decoder(stream);
  
  if (!decoder.checkIntegrity()) {
    throw new Error('FIT file integrity check failed');
  }
  
  const result = decoder.read();
  console.log('FIT decoder result:', result);
  
  // Handle the actual structure returned by this FIT SDK
  const messages = (result as any).messages || result;
  console.log('Messages found:', !!messages);
  
  if (messages && typeof messages === 'object') {
    console.log('Messages keys:', Object.keys(messages));
  }
  
  const points: Point[] = [];
  let name = file.name.replace('.fit', '');
  let date: Date | undefined;
  
  // Extract session info
  let sessionMessage: any = null;
  if (messages.sessionMesgs && messages.sessionMesgs.length > 0) {
    sessionMessage = messages.sessionMesgs[0];
    console.log('Session message:', sessionMessage);
    if (sessionMessage.startTime) {
      date = new Date(sessionMessage.startTime);
    }
  }
  
  // Extract activity name from sport
  if (messages.sportMesgs && messages.sportMesgs.length > 0) {
    const sport = messages.sportMesgs[0];
    if (sport.name) {
      name = sport.name;
    } else if (sport.sport) {
      name = sport.sport;
    }
  }
  
  // Get record messages (GPS track points)
  const records = messages.recordMesgs || [];
  
  console.log('Records found:', records.length);
  if (records.length > 0) {
    console.log('Sample record:', records[0]);
    console.log('Sample record keys:', Object.keys(records[0]));
    
    // Look for position fields in first few records
    for (let i = 0; i < Math.min(5, records.length); i++) {
      const record = records[i];
      const positionFields = Object.keys(record).filter(key => 
        key.toLowerCase().includes('lat') || 
        key.toLowerCase().includes('lng') || 
        key.toLowerCase().includes('long') || 
        key.toLowerCase().includes('position')
      );
      if (positionFields.length > 0) {
        console.log(`Record ${i} position fields:`, positionFields, record);
        break;
      }
    }
  }
  
  for (const record of records) {
    // Handle different possible field names
    const lat = convertSemicirclesToDegrees(
      record.positionLat || record.position_lat || record.enhancedLatitude
    );
    const lng = convertSemicirclesToDegrees(
      record.positionLong || record.position_long || record.enhancedLongitude
    );
    
    const point: Point = {
      lat,
      lng,
      ele: record.altitude || record.enhancedAltitude || record.enhanced_altitude,
      time: record.timestamp ? new Date(record.timestamp) : undefined,
      hr: record.heartRate || record.heart_rate,
      cadence: record.cadence,
      power: record.power,
      temp: record.temperature,
    };
    
    if (!isNaN(point.lat) && !isNaN(point.lng)) {
      points.push(point);
    }
  }
  
  if (points.length === 0) {
    throw new Error('No valid track points found in FIT file');
  }
  
  const { totalDistance, totalElevationGain, totalTime, averagePace, averageHR, maxHR, bounds } = 
    calculateMetricsFromFIT(points, sessionMessage);
  
  return {
    name: sessionMessage?.sport ? `${sessionMessage.sport} Activity` : name,
    date,
    points,
    totalDistance: sessionMessage?.totalDistance || totalDistance,
    totalElevationGain: sessionMessage?.totalAscent || totalElevationGain,
    totalTime: sessionMessage?.totalElapsedTime || sessionMessage?.totalTimerTime || totalTime,
    averagePace,
    averageHR: sessionMessage?.avgHeartRate || averageHR,
    maxHR: sessionMessage?.maxHeartRate || maxHR,
    bounds,
  };
}

function convertSemicirclesToDegrees(semicircles: number | undefined): number {
  if (semicircles === undefined || semicircles === null) return NaN;
  return (semicircles * 180) / Math.pow(2, 31);
}

function calculateMetricsFromFIT(points: Point[], _sessionMessage: any) {
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
  
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const totalTime = firstPoint.time && lastPoint.time
    ? (lastPoint.time.getTime() - firstPoint.time.getTime()) / 1000
    : 0;
  
  const averagePace = totalTime > 0 ? totalTime / totalDistance : 0;
  const averageHR = hrCount > 0 ? hrSum / hrCount : undefined;
  
  return {
    totalDistance,
    totalElevationGain,
    totalTime,
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