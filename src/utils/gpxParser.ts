import { gpx } from "@tmcw/togeojson";
import type { Point, Activity } from "../types/activity";

export async function parseGPXFile(file: File): Promise<Activity> {
  const text = await file.text();
  const parser = new DOMParser();
  const gpxDoc = parser.parseFromString(text, "application/xml");

  const geoJson = gpx(gpxDoc);

  if (!geoJson.features || geoJson.features.length === 0) {
    throw new Error("No tracks found in GPX file");
  }

  const points: Point[] = [];
  let name = file.name.replace(".gpx", "");
  let date: Date | undefined;

  for (const feature of geoJson.features) {
    if (
      feature.geometry.type === "LineString" ||
      feature.geometry.type === "MultiLineString"
    ) {
      const coords =
        feature.geometry.type === "LineString"
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates;

      if (feature.properties?.name) {
        name = feature.properties.name;
      }

      if (feature.properties?.time) {
        date = new Date(feature.properties.time);
      }

      for (const lineString of coords) {
        for (let i = 0; i < lineString.length; i++) {
          const coord = lineString[i];
          const point: Point = {
            lng: coord[0],
            lat: coord[1],
            ele: coord[2],
          };

          if (
            feature.properties?.coordTimes &&
            feature.properties.coordTimes[i]
          ) {
            point.time = new Date(feature.properties.coordTimes[i]);
          }

          points.push(point);
        }
      }
    }
  }

  if (points.length === 0) {
    throw new Error("No valid track points found in GPX file");
  }

  const { totalDistance, totalElevationGain, totalTime, averagePace, bounds } =
    calculateBasicMetrics(points);

  return {
    name,
    date,
    points,
    totalDistance,
    totalElevationGain,
    totalTime,
    averagePace,
    bounds,
  };
}

function calculateBasicMetrics(points: Point[]) {
  let totalDistance = 0;
  let totalElevationGain = 0;
  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;

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
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const totalTime =
    firstPoint.time && lastPoint.time
      ? (lastPoint.time.getTime() - firstPoint.time.getTime()) / 1000
      : 0;

  const averagePace = totalTime > 0 ? totalTime / totalDistance : 0;

  return {
    totalDistance,
    totalElevationGain,
    totalTime,
    averagePace,
    bounds: { minLat, maxLat, minLng, maxLng },
  };
}

export function haversineDistance(p1: Point, p2: Point): number {
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
